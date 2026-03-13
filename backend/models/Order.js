const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  itemStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'cooking', 'ready', 'served']
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  tableNumber: {
    type: Number,
    required: [true, 'Table number is required'],
    min: 1,
    max: 50
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: (v) => v.length > 0,
      message: 'Order must have at least one item'
    }
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['QRIS', 'Cash']
  },
  status: {
    type: String,
    default: 'paid',
    enum: ['paid', 'confirmed', 'done']
  },
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Auto-generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
