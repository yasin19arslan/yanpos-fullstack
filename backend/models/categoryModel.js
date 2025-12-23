const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lütfen kategori adı giriniz'],
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      default: '/images/default-category.png',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', categorySchema); 