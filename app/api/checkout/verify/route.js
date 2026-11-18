import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await dbConnect();

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    const { orderId } = stripeSession.metadata;

    if (!orderId) {
        // Fallback for older orders or if metadata was missing
        const existingBySession = await Order.findOne({ stripeSessionId: sessionId });
        if (existingBySession) {
            if (session.role !== 'admin' && String(existingBySession.userId) !== String(session.userId)) {
              return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            return NextResponse.json({
              orderId: existingBySession._id,
              paymentStatus: existingBySession.paymentStatus,
              status: existingBySession.status,
            });
        }
        return NextResponse.json({ error: 'Order metadata not found' }, { status: 404 });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (session.role !== 'admin' && String(order.userId) !== String(session.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure session ID is linked (it should already be, but safe to verify)
    if (!order.stripeSessionId) {
        order.stripeSessionId = sessionId;
    }

    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.statusHistory = [
        ...(order.statusHistory || []),
        { status: order.status || 'pending', note: 'Payment confirmed via Stripe', changedAt: new Date() },
      ];
    }
    await order.save();

    return NextResponse.json({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      status: order.status,
    });
  } catch (error) {
    console.error('Order verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
