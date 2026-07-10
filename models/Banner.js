import mongoose from "mongoose"

const placementField = { type: String, enum: ["home", "collection", "promotion"], default: "home" }

const BannerSchema = new mongoose.Schema(
  {
    placement: placementField,
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    imageUrl: { type: String, required: true, trim: true },
    buttonText: { type: String, default: "", trim: true },
    buttonLink: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
)

const existingBannerModel = mongoose.models.Banner
const existingEnumValues = existingBannerModel?.schema?.path("placement")?.enumValues || []
const needsModelRefresh = existingBannerModel && !existingEnumValues.includes("promotion")

// Dev hot-reload safety: recreate cached model when enum changed.
if (needsModelRefresh) {
  if (typeof mongoose.deleteModel === "function") {
    mongoose.deleteModel("Banner")
  } else {
    delete mongoose.models.Banner
  }
}

export default mongoose.models.Banner || mongoose.model("Banner", BannerSchema)
