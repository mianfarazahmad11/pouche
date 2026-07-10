import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import { bulkActionSchema } from "@/lib/validation/product";
import { getFirstZodError } from "@/lib/validation/settings";

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getFirstZodError(parsed.error) }, { status: 400 });
    }

    await dbConnect();
    const { action, productIds, category, status, discountPercent } = parsed.data;

    if (action === "delete") {
      await Product.deleteMany({ _id: { $in: productIds } });
      return NextResponse.json({ message: "Products deleted successfully" }, { status: 200 });
    }

    if (action === "changeCategory") {
      if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 });
      await Product.updateMany({ _id: { $in: productIds } }, { $set: { category } });
      return NextResponse.json({ message: "Category updated successfully" }, { status: 200 });
    }

    if (action === "changeStatus") {
      if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 });
      await Product.updateMany({ _id: { $in: productIds } }, { $set: { status } });
      return NextResponse.json({ message: "Status updated successfully" }, { status: 200 });
    }

    if (action === "applyDiscount") {
      if (discountPercent == null) {
        return NextResponse.json({ error: "Discount percent is required" }, { status: 400 });
      }

      const products = await Product.find({ _id: { $in: productIds } });
      await Promise.all(
        products.map((p) => {
          const discountPrice = Number((p.price * (1 - discountPercent / 100)).toFixed(2));
          p.discountPrice = discountPrice;
          return p.save();
        })
      );
      return NextResponse.json({ message: "Discount applied successfully" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
