import { z } from "zod";

const nonNegativeNumber = z.coerce.number().min(0);
const categoryValues = ["Electronics", "Mobiles", "Toys", "Cosmetics", "Food", "Fashion", "Home & Living", "Sports"];
const categoryRequiredFields = {
  Electronics: ["name", "sku", "brand", "model", "ram", "storage", "battery", "color", "price", "quantity"],
  Mobiles: ["name", "sku", "brand", "model", "ram", "storage", "battery", "color", "price", "quantity"],
  Toys: ["name", "sku", "brand", "ageGroup", "material", "safetyStandards", "dimensions", "price", "quantity"],
  Cosmetics: ["name", "sku", "brand", "shadeColor", "ingredients", "expiryDate", "skinType", "price", "quantity"],
  Food: ["name", "sku", "brand", "ingredients", "expiryDate", "netWeight", "packagingType", "price", "quantity"],
  Fashion: ["name", "sku", "brand", "size", "color", "material", "price", "quantity"],
  "Home & Living": ["name", "sku", "brand", "price", "quantity"],
  Sports: ["name", "sku", "brand", "price", "quantity"],
};

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  description: z.string().trim().min(1, "Description is required"),
  price: nonNegativeNumber,
  discountPrice: z.union([z.literal(""), z.null(), z.undefined(), nonNegativeNumber]).transform((v) =>
    v === "" || v == null ? undefined : Number(v)
  ),
  imageUrl: z.string().trim().optional().default(""),
  galleryImages: z.array(z.string().trim().min(1)).optional().default([]),
  featuredThumbnail: z.string().trim().optional().default(""),
  category: z.enum(categoryValues),
  subcategory: z.string().trim().optional().default(""),
  sku: z.string().trim().min(1, "SKU is required"),
  quantity: z.coerce.number().int().min(0),
  lowStockAlertLevel: z.coerce.number().int().min(0).optional().default(5),
  status: z.enum(["active", "draft"]),
  featured: z.boolean().optional().default(false),
  newArrival: z.boolean().optional().default(false),
  colorVariants: z.array(z.string().trim()).optional().default([]),
  deviceCompatibility: z.string().trim().optional().default(""),
  materialType: z.string().trim().optional().default(""),
  seoTitle: z.string().trim().optional().default(""),
  seoDescription: z.string().trim().optional().default(""),
  tags: z.array(z.string().trim()).optional().default([]),
  brand: z.string().trim().optional().default(""),
  model: z.string().trim().optional().default(""),
  ram: z.string().trim().optional().default(""),
  storage: z.string().trim().optional().default(""),
  battery: z.string().trim().optional().default(""),
  color: z.string().trim().optional().default(""),
  ageGroup: z.string().trim().optional().default(""),
  material: z.string().trim().optional().default(""),
  safetyStandards: z.string().trim().optional().default(""),
  dimensions: z.string().trim().optional().default(""),
  shadeColor: z.string().trim().optional().default(""),
  ingredients: z.string().trim().optional().default(""),
  expiryDate: z.union([z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"), z.literal(""), z.undefined(), z.null()]).transform((v) =>
    v === "" || v == null ? undefined : v
  ),
  skinType: z.string().trim().optional().default(""),
  netWeight: z.string().trim().optional().default(""),
  packagingType: z.string().trim().optional().default(""),
  size: z.string().trim().optional().default(""),
  returnPolicy: z.string().trim().optional().default(""),
  slug: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  const requiredForCategory = categoryRequiredFields[data.category] || [];
  for (const key of requiredForCategory) {
    const value = data[key];
    if (value == null || String(value).trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required for ${data.category}`,
      });
    }
  }
  if (data.discountPrice != null && data.discountPrice > data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountPrice"],
      message: "Discount price cannot be greater than price",
    });
  }
});

export const bulkActionSchema = z.object({
  action: z.enum(["delete", "changeCategory", "changeStatus", "applyDiscount"]),
  productIds: z.array(z.string().min(1)).min(1, "Select at least one product"),
  category: z.string().trim().optional(),
  status: z.enum(["active", "draft"]).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
});

export function slugifyProductName(name = "") {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function makeUniqueSlug(ProductModel, desiredSlug, productIdToIgnore = null) {
  const baseSlug = desiredSlug || `product-${Date.now()}`;
  let candidate = baseSlug;
  let count = 1;

  while (true) {
    const existing = await ProductModel.findOne({
      slug: candidate,
      ...(productIdToIgnore ? { _id: { $ne: productIdToIgnore } } : {}),
    }).lean();

    if (!existing) return candidate;
    candidate = `${baseSlug}-${count}`;
    count += 1;
  }
}

export async function makeUniqueSku(ProductModel, desiredSku, productIdToIgnore = null) {
  const baseSku = String(desiredSku || `SKU-${Date.now()}`).trim().toUpperCase();
  let candidate = baseSku;
  let count = 1;

  while (true) {
    const existing = await ProductModel.findOne({
      sku: candidate,
      ...(productIdToIgnore ? { _id: { $ne: productIdToIgnore } } : {}),
    }).lean();
    if (!existing) return candidate;
    candidate = `${baseSku}-${count}`;
    count += 1;
  }
}
