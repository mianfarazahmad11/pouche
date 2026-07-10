const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const users = await User.find({}, 'name email role');
    console.log('Users found:', JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

listUsers();
