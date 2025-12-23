const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Kampanya başlığı zorunludur'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Kampanya açıklaması zorunludur'],
    },
    code: {
      type: String,
      required: [true, 'Kampanya kodu zorunludur'],
      unique: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'İndirim değeri zorunludur'],
    },
    startDate: {
      type: Date,
      required: [true, 'Başlangıç tarihi zorunludur'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'Bitiş tarihi zorunludur'],
    },
    minimumPurchase: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 = sınırsız
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    userLimit: {
      type: Number,
      default: 1, // Her kullanıcı bu kampanyayı kaç kez kullanabilir
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Kampanyanın aktif olup olmadığını kontrol eden metot
campaignSchema.methods.isValidForUse = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === 0 || this.usedCount < this.usageLimit)
  );
};

module.exports = mongoose.model('Campaign', campaignSchema); 