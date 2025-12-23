const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lütfen ürün adı giriniz'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Lütfen ürün fiyatı giriniz'],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '/images/default-product.png',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Lütfen ürün kategorisi seçiniz'],
      ref: 'Category',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema); 