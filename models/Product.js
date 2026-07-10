import mongoose from 'mongoose';

const productSchemaFields = {
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  imageUrl: { type: String },
  galleryImages: [{ type: String }],
  featuredThumbnail: { type: String },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  sku: { type: String, required: true, unique: true, trim: true },
  quantity: { type: Number, default: 0, min: 0 },
  lowStockAlertLevel: { type: Number, default: 5, min: 0 },
  status: { type: String, enum: ['active', 'draft'], default: 'active' },
  featured: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  colorVariants: [{ type: String }],
  deviceCompatibility: { type: String, default: '' },
  materialType: { type: String, default: '' },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  tags: [{ type: String }],
  brand: { type: String, default: '' },
  model: { type: String, default: '' },
  ram: { type: String, default: '' },
  storage: { type: String, default: '' },
  battery: { type: String, default: '' },
  color: { type: String, default: '' },
  ageGroup: { type: String, default: '' },
  material: { type: String, default: '' },
  safetyStandards: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  shadeColor: { type: String, default: '' },
  ingredients: { type: String, default: '' },
  expiryDate: { type: Date },
  skinType: { type: String, default: '' },
  netWeight: { type: String, default: '' },
  packagingType: { type: String, default: '' },
  size: { type: String, default: '' },
  returnPolicy: { type: String, default: '' },
};

const ProductSchema = new mongoose.Schema({
  ...productSchemaFields,
}, { timestamps: true });

const existingProductModel = mongoose.models.Product;

// Dev hot-reload safety: ensure cached model has modern gallery fields.
if (existingProductModel) {
  const missingFields = Object.keys(productSchemaFields).filter(
    (field) => !existingProductModel.schema.path(field)
  );
  if (missingFields.length > 0) {
    const addMap = {};
    for (const field of missingFields) addMap[field] = productSchemaFields[field];
    existingProductModel.schema.add(addMap);
  }
}

export default existingProductModel || mongoose.model('Product', ProductSchema);
