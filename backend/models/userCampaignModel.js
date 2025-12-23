const mongoose = require('mongoose');

const userCampaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Bir kullanıcının belirli bir kampanyayı daha kullanıp kullanamayacağını kontrol eden metot
userCampaignSchema.methods.canUse = function (campaign) {
  return this.isActive && 
    (campaign.userLimit === 0 || this.usedCount < campaign.userLimit);
};

// Bileşik index - bir kullanıcı için her kampanya benzersiz olmalı
userCampaignSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

module.exports = mongoose.model('UserCampaign', userCampaignSchema); 