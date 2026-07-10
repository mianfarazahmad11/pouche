import mongoose from "mongoose";

const SiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    websiteName: { type: String, default: "LuxeShop" },
    websiteLogoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "/favicon.ico" },
    currencyCode: { type: String, default: "PKR" },
    currencySymbol: { type: String, default: "Rs." },
    defaultShippingCharges: { type: Number, default: 200, min: 0 },
    freeShippingThreshold: { type: Number, default: 5000, min: 0 },
    cashOnDeliveryEnabled: { type: Boolean, default: true },
    stripeEnabled: { type: Boolean, default: true },
    storePhoneNumber: { type: String, default: "" },
    storeEmailAddress: { type: String, default: "" },
    shopAddress: { type: String, default: "" },
    taxEnabled: { type: Boolean, default: false },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", SiteSettingsSchema);
