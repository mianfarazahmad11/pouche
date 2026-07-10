import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import User from '@/models/User';
import { getSiteSettings } from '@/lib/siteSettings';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function normalizeShippingAddress(input, fallback = {}) {
  return {
    fullName: String(input?.fullName || fallback.fullName || '').trim(),
    phone: String(input?.phone || fallback.phone || '').trim(),
    addressLine: String(input?.addressLine || '').trim(),
    city: String(input?.city || '').trim(),
    postalCode: String(input?.postalCode || '').trim(),
    country: String(input?.country || '').trim(),
  };
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, paymentMethod, shippingAddress } = await req.json();
    const settings = await getSiteSettings();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    await dbConnect();
    const getItemProductId = (item) => {
      const raw = item?.productId;
      if (!raw) return null;
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'object') return raw._id ? String(raw._id) : null;
      return null;
    };
    const productIds = items.map(getItemProductId).filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 400 });
    }

    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = {};
    products.forEach((p) => { productMap[p._id.toString()] = p; });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const resolvedPaymentMethod = paymentMethod || "stripe";
    if (!["stripe", "cod"].includes(resolvedPaymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    if (resolvedPaymentMethod === "cod" && !settings.cashOnDeliveryEnabled) {
      return NextResponse.json({ error: "Cash on Delivery is disabled" }, { status: 400 });
    }
    if (resolvedPaymentMethod === "stripe" && !settings.stripeEnabled) {
      return NextResponse.json({ error: "Stripe payment is disabled" }, { status: 400 });
    }
    if (!settings.cashOnDeliveryEnabled && !settings.stripeEnabled) {
      return NextResponse.json({ error: "No payment methods are enabled" }, { status: 400 });
    }

    const orderUser = await User.findById(session.userId).select('name email phoneNumber').lean();
    const normalizedShippingAddress = normalizeShippingAddress(shippingAddress, {
      fullName: orderUser?.name || session?.name || '',
      phone: orderUser?.phoneNumber || '',
    });

    const requiredShippingFields = ['fullName', 'phone', 'addressLine', 'city', 'postalCode', 'country'];
    const missingShippingField = requiredShippingFields.find((field) => !normalizedShippingAddress[field]);
    if (missingShippingField) {
      return NextResponse.json({ error: 'Please complete your delivery address before checkout' }, { status: 400 });
    }

    const lineItems = [];
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const productId = getItemProductId(item);
      if (!productId) continue;
      const product = productMap[productId?.toString()];

      if (!product) continue;

      const price = product.discountPrice || product.price || 0;
      subtotal += price * item.quantity;

      const productName = product.name?.trim() || 'Premium Product';

      let absoluteImageUrl = product.imageUrl;
      if (absoluteImageUrl && absoluteImageUrl.startsWith('/')) {
        absoluteImageUrl = `${baseUrl}${absoluteImageUrl}`;
      }

      lineItems.push({
        price_data: {
          currency: settings.currencyCode.toLowerCase(),
          product_data: {
            name: productName,
            ...(product.category && { description: product.category }),
            ...(absoluteImageUrl && absoluteImageUrl.startsWith('http') && { images: [absoluteImageUrl] }),
          },
          unit_amount: Math.round(price * 100), // cents
        },
        quantity: item.quantity,
      });

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtPurchase: price,
        name: product.name,
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 400 });
    }

    const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.defaultShippingCharges;
    const taxAmount = settings.taxEnabled ? (subtotal * settings.taxPercentage) / 100 : 0;
    const totalPrice = subtotal + shipping + taxAmount;

    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: settings.currencyCode.toLowerCase(),
          product_data: { name: 'Standard Shipping' },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: settings.currencyCode.toLowerCase(),
          product_data: { name: `Tax (${settings.taxPercentage}%)` },
          unit_amount: Math.round(taxAmount * 100),
        },
        quantity: 1,
      });
    }

    // Create pending order
    const order = await Order.create({
      userId: session.userId,
      products: orderItems,
      totalPrice: totalPrice,
      subtotal,
      shippingAmount: shipping,
      taxAmount,
      paymentMethod: resolvedPaymentMethod,
      paymentStatus: 'unpaid',
      status: 'pending',
      shippingAddress: normalizedShippingAddress,
      customerSnapshot: {
        name: orderUser?.name || session?.name || '',
        email: orderUser?.email || '',
      },
      statusHistory: [
        {
          status: 'pending',
          note: resolvedPaymentMethod === 'cod' ? 'Order placed with Cash on Delivery' : 'Order created, awaiting payment confirmation',
          changedAt: new Date(),
        },
      ],
    });

    if (resolvedPaymentMethod === 'cod') {
      // Clear Cart from DB for this user
      await Cart.findOneAndUpdate({ userId: session.userId }, { items: [] });
      return NextResponse.json({ orderId: order._id.toString() });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id.toString()}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: {
        orderId: order._id.toString(),
      },
    });

    // Link session ID to the order
    order.stripeSessionId = checkoutSession.id;
    await order.save();

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('SERVER ERROR [Checkout]:', error);
    return NextResponse.json({ 
        error: error.message,
    }, { status: 500 });
  }
}
