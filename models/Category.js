import mongoose from "mongoose"

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    subcategories: [{ type: String, trim: true }],
    imageUrl: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
)

export default mongoose.models.Category || mongoose.model("Category", CategorySchema)
