import dbConnect from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";

export const DEFAULT_SITE_SETTINGS = {
  websiteName: "LuxeShop",
  websiteLogoUrl: "",
  faviconUrl: "/favicon.ico",
  currencyCode: "PKR",
  currencySymbol: "Rs.",
  defaultShippingCharges: 200,
  freeShippingThreshold: 5000,
  cashOnDeliveryEnabled: true,
  stripeEnabled: true,
  storePhoneNumber: "",
  storeEmailAddress: "",
  shopAddress: "",
  taxEnabled: false,
  taxPercentage: 0,
};

function toPlainSettings(input = {}) {
  return {
    websiteName: String(input.websiteName ?? DEFAULT_SITE_SETTINGS.websiteName),
    websiteLogoUrl: String(input.websiteLogoUrl ?? ""),
    faviconUrl: String(input.faviconUrl ?? DEFAULT_SITE_SETTINGS.faviconUrl),
    currencyCode: String(input.currencyCode ?? DEFAULT_SITE_SETTINGS.currencyCode),
    currencySymbol: String(input.currencySymbol ?? DEFAULT_SITE_SETTINGS.currencySymbol),
    defaultShippingCharges: Number(input.defaultShippingCharges ?? DEFAULT_SITE_SETTINGS.defaultShippingCharges),
    freeShippingThreshold: Number(input.freeShippingThreshold ?? DEFAULT_SITE_SETTINGS.freeShippingThreshold),
    cashOnDeliveryEnabled: Boolean(input.cashOnDeliveryEnabled ?? DEFAULT_SITE_SETTINGS.cashOnDeliveryEnabled),
    stripeEnabled: Boolean(input.stripeEnabled ?? DEFAULT_SITE_SETTINGS.stripeEnabled),
    storePhoneNumber: String(input.storePhoneNumber ?? ""),
    storeEmailAddress: String(input.storeEmailAddress ?? ""),
    shopAddress: String(input.shopAddress ?? ""),
    taxEnabled: Boolean(input.taxEnabled ?? DEFAULT_SITE_SETTINGS.taxEnabled),
    taxPercentage: Number(input.taxPercentage ?? DEFAULT_SITE_SETTINGS.taxPercentage),
  };
}

const CURRENCY_SYMBOLS = {
  PKR: "Rs.",
  USD: "$",
  EUR: "EUR",
  GBP: "GBP",
  INR: "Rs.",
  AED: "AED",
  SAR: "SAR",
};

export async function getSiteSettings() {
  try {
    await dbConnect();
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global" },
      { $setOnInsert: { key: "global", ...DEFAULT_SITE_SETTINGS } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return toPlainSettings({ ...DEFAULT_SITE_SETTINGS, ...settings });
  } catch (error) {
    if (error?.code === 11000) {
      try {
        await dbConnect();
        const existing = await SiteSettings.findOne({ key: "global" }).lean();
        if (existing) {
          return toPlainSettings({ ...DEFAULT_SITE_SETTINGS, ...existing });
        }
      } catch (retryError) {
        console.warn("SITE SETTINGS RETRY FAILED:", retryError?.message || retryError);
      }
    }
    console.warn("SITE SETTINGS FALLBACK:", error?.message || error);
    return toPlainSettings(DEFAULT_SITE_SETTINGS);
  }
}

export function sanitizeSettingsInput(payload = {}) {
  const numeric = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const currencyCode = DEFAULT_SITE_SETTINGS.currencyCode;
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;

  return {
    websiteName: String(payload.websiteName ?? "").trim() || DEFAULT_SITE_SETTINGS.websiteName,
    websiteLogoUrl: String(payload.websiteLogoUrl ?? "").trim(),
    faviconUrl: String(payload.faviconUrl ?? "").trim() || DEFAULT_SITE_SETTINGS.faviconUrl,
    currencyCode,
    currencySymbol,
    defaultShippingCharges: Math.max(0, numeric(payload.defaultShippingCharges, DEFAULT_SITE_SETTINGS.defaultShippingCharges)),
    freeShippingThreshold: Math.max(0, numeric(payload.freeShippingThreshold, DEFAULT_SITE_SETTINGS.freeShippingThreshold)),
    cashOnDeliveryEnabled: Boolean(payload.cashOnDeliveryEnabled),
    stripeEnabled: Boolean(payload.stripeEnabled),
    storePhoneNumber: String(payload.storePhoneNumber ?? "").trim(),
    storeEmailAddress: String(payload.storeEmailAddress ?? "").trim(),
    shopAddress: String(payload.shopAddress ?? "").trim(),
    taxEnabled: Boolean(payload.taxEnabled),
    taxPercentage: Math.min(100, Math.max(0, numeric(payload.taxPercentage, 0))),
  };
}

export async function updateSiteSettings(payload = {}) {
  await dbConnect();
  const clean = sanitizeSettingsInput(payload);
  const updated = await SiteSettings.findOneAndUpdate(
    { key: "global" },
    { $set: clean, $setOnInsert: { key: "global" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return toPlainSettings({ ...DEFAULT_SITE_SETTINGS, ...updated });
}
