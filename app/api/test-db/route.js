import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    await dbConnect();

    return Response.json({
      success: true,
      message: "MongoDB connected successfully",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}