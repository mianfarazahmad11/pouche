import { z } from "zod";

export const settingsSchema = z.object({
  websiteName: z.string().trim().min(1, "Website name is required").max(120, "Website name is too long"),
  websiteLogoUrl: z.string().trim().max(500, "Logo URL is too long").optional().default(""),
  faviconUrl: z.string().trim().max(500, "Favicon URL is too long").optional().default("/favicon.ico"),
  defaultShippingCharges: z.coerce.number().min(0, "Shipping charges cannot be negative"),
  freeShippingThreshold: z.coerce.number().min(0, "Free shipping threshold cannot be negative"),
  cashOnDeliveryEnabled: z.boolean(),
  stripeEnabled: z.boolean(),
  storePhoneNumber: z.string().trim().max(60, "Phone number is too long").optional().default(""),
  storeEmailAddress: z.union([z.literal(""), z.string().trim().email("Invalid store email address")]),
  shopAddress: z.string().trim().max(500, "Shop address is too long").optional().default(""),
  taxEnabled: z.boolean(),
  taxPercentage: z.coerce.number().min(0, "Tax cannot be negative").max(100, "Tax cannot exceed 100%"),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export function getFirstZodError(error) {
  if (!error?.issues?.length) return "Invalid request data";
  return error.issues[0].message || "Invalid request data";
}
