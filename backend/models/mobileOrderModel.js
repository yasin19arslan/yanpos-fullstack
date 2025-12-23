const mongoose = require('mongoose');

const mobileOrderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerName: {
      type: String,
      required: [true, 'Lütfen müşteri adı giriniz'],
    },
    customerPhone: {
      type: String,
      required: [true, 'Lütfen telefon numarası giriniz'],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    campaign: {
      campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
      },
      code: {
        type: String,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'wallet'],
      default: 'card',
    },
    cardDetails: {
      cardNumber: String,
      cardName: String,
      expiryDate: String,
      cvv: String
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MobileOrder', mobileOrderSchema); 