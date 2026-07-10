import dbConnect from "@/lib/mongodb";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cart = await Cart.findOne({ userId: session.userId }).populate('items.productId');
    return NextResponse.json(cart || { items: [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, quantity } = await req.json();
    const qtyToAdd = Math.max(1, Number(quantity) || 1);
    const product = await Product.findById(productId).select("status quantity name").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.status === "draft") {
      return NextResponse.json({ error: "Product is coming soon" }, { status: 400 });
    }
    if ((product.quantity || 0) <= 0) {
      return NextResponse.json({ error: "Product is out of stock" }, { status: 400 });
    }

    let cart = await Cart.findOne({ userId: session.userId });
    if (!cart) {
      if (qtyToAdd > product.quantity) {
        return NextResponse.json({ error: `Only ${product.quantity} item(s) available in stock` }, { status: 400 });
      }
      cart = await Cart.create({ userId: session.userId, items: [{ productId, quantity: qtyToAdd }] });
    } else {
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        const nextQty = cart.items[itemIndex].quantity + qtyToAdd;
        if (nextQty > product.quantity) {
          return NextResponse.json({ error: `Only ${product.quantity} item(s) available in stock` }, { status: 400 });
        }
        cart.items[itemIndex].quantity = nextQty;
      } else {
        if (qtyToAdd > product.quantity) {
          return NextResponse.json({ error: `Only ${product.quantity} item(s) available in stock` }, { status: 400 });
        }
        cart.items.push({ productId, quantity: qtyToAdd });
      }
      await cart.save();
    }
    
    cart = await Cart.findOne({ userId: session.userId }).populate('items.productId');
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    let cart = await Cart.findOne({ userId: session.userId });
    if (cart && productId) {
       cart.items = cart.items.filter(item => item.productId.toString() !== productId);
       await cart.save();
    } else if (cart && !productId) {
       cart.items = [];
       await cart.save();
    }
    
    cart = await Cart.findOne({ userId: session.userId }).populate('items.productId');
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
