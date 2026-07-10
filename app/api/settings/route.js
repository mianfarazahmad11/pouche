import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/siteSettings";
import { getFirstZodError, settingsSchema } from "@/lib/validation/settings";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const settings = await getSiteSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getFirstZodError(parsed.error) }, { status: 400 });
    }

    const settings = await updateSiteSettings(parsed.data);
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
