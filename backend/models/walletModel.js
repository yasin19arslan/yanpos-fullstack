const mongoose = require('mongoose');

const walletSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ['deposit', 'payment', 'refund'],
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ['pending', 'completed', 'failed'],
          default: 'pending'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Wallet', walletSchema); 