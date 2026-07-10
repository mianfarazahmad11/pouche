import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(
      {
        websiteName: settings.websiteName,
        websiteLogoUrl: settings.websiteLogoUrl,
        faviconUrl: settings.faviconUrl,
        currencyCode: settings.currencyCode,
        currencySymbol: settings.currencySymbol,
        defaultShippingCharges: settings.defaultShippingCharges,
        freeShippingThreshold: settings.freeShippingThreshold,
        cashOnDeliveryEnabled: settings.cashOnDeliveryEnabled,
        stripeEnabled: settings.stripeEnabled,
        storePhoneNumber: settings.storePhoneNumber,
        storeEmailAddress: settings.storeEmailAddress,
        shopAddress: settings.shopAddress,
        taxEnabled: settings.taxEnabled,
        taxPercentage: settings.taxPercentage,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
