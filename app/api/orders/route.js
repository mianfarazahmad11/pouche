import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
    const skip = (page - 1) * limit;

    let query = {};
    if (session.role !== 'admin') {
      query.userId = session.userId;
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email'),
      Order.countDocuments(query),
    ]);
    return NextResponse.json(orders, {
      status: 200,
      headers: {
        'x-page': String(page),
        'x-limit': String(limit),
        'x-total-count': String(total),
        'x-total-pages': String(Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    // Quick validation
    if (!body.products || !body.products.length || !body.totalPrice) {
      return NextResponse.json({ error: "Missing required order details" }, { status: 400 });
    }

    const newOrder = await Order.create({
      userId: session.userId,
      products: body.products,
      totalPrice: body.totalPrice,
      status: 'pending',
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
