import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const order = await Order.findById(resolvedParams.id).populate('userId', 'name email');
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (session.role !== 'admin' && order.userId._id.toString() !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await dbConnect();
    const { status, paymentStatus } = await req.json();

    const validStatuses = ['awaiting_payment', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['paid', 'unpaid', 'failed'];

    if (status && !validStatuses.includes(status)) {
       return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }

    const order = await Order.findById(resolvedParams.id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    order.statusHistory = [
      ...(order.statusHistory || []),
      {
        status: order.status,
        note: status === 'cancelled' ? 'Order cancelled by admin' : 'Order updated by admin',
        changedAt: new Date(),
      },
    ];
    await order.save();
    const updatedOrder = await Order.findById(order._id).populate('userId', 'name email');
    
    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
