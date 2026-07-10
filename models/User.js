import mongoose from 'mongoose';

const profileImageField = { type: String, default: '' };
const phoneNumberField = { type: String, default: '' };
const accountStatusField = { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' };
const lastLoginAtField = { type: Date, default: null };
const resetPasswordTokenHashField = { type: String, default: null };
const resetPasswordExpiresAtField = { type: Date, default: null };

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profileImageUrl: profileImageField,
  phoneNumber: phoneNumberField,
  accountStatus: accountStatusField,
  lastLoginAt: lastLoginAtField,
  resetPasswordTokenHash: resetPasswordTokenHashField,
  resetPasswordExpiresAt: resetPasswordExpiresAtField,
}, { timestamps: true });

const existingUserModel = mongoose.models.User;

// Dev hot-reload safety: ensure new fields exist on cached model schemas.
if (existingUserModel) {
  const addMap = {};
  if (!existingUserModel.schema.path('profileImageUrl')) addMap.profileImageUrl = profileImageField;
  if (!existingUserModel.schema.path('phoneNumber')) addMap.phoneNumber = phoneNumberField;
  if (!existingUserModel.schema.path('accountStatus')) addMap.accountStatus = accountStatusField;
  if (!existingUserModel.schema.path('lastLoginAt')) addMap.lastLoginAt = lastLoginAtField;
  if (!existingUserModel.schema.path('resetPasswordTokenHash')) addMap.resetPasswordTokenHash = resetPasswordTokenHashField;
  if (!existingUserModel.schema.path('resetPasswordExpiresAt')) addMap.resetPasswordExpiresAt = resetPasswordExpiresAtField;
  if (Object.keys(addMap).length > 0) {
    existingUserModel.schema.add(addMap);
  }
}

export default existingUserModel || mongoose.model('User', UserSchema);
