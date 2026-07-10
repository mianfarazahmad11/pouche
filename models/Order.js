import mongoose from 'mongoose';

const OrderProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
  name: { type: String, required: true },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [OrderProductSchema],
  totalPrice: { type: Number, required: true },
  subtotal: { type: Number, default: 0 },
  shippingAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['stripe', 'bank_transfer', 'cod'], default: 'stripe' },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'failed'], default: 'unpaid' },
  status: { 
    type: String, 
    enum: ['awaiting_payment', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  shippingAddress: {
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    addressLine: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  customerSnapshot: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  statusHistory: [{
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  }],
  stripeSessionId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

const existingOrderModel = mongoose.models.Order;

// Dev hot-reload safety for newly introduced order fields.
if (existingOrderModel) {
  const ensureField = (path, definition) => {
    if (!existingOrderModel.schema.path(path)) {
      existingOrderModel.schema.add({ [path]: definition });
    }
  };
  ensureField('subtotal', { type: Number, default: 0 });
  ensureField('shippingAmount', { type: Number, default: 0 });
  ensureField('taxAmount', { type: Number, default: 0 });
  ensureField('paymentStatus', { type: String, enum: ['paid', 'unpaid', 'failed'], default: 'unpaid' });
  ensureField('customerSnapshot', {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
  });
  ensureField('shippingAddress', {
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    addressLine: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' },
  });
  ensureField('statusHistory', [{
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  }]);
}

export default existingOrderModel || mongoose.model('Order', OrderSchema);
