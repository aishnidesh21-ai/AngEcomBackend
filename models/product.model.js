const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Product description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0.01, 'Price must be greater than 0']
  },
  image: {
    type: String,
    required: [true, 'Product image URL is required'],
    validate: {
      validator: function (v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: [
        'electronics',
        'clothing',
        'books',
        'home',
        'sports',
        'toys',
        'beauty',
        'automotive'
      ],
      message:
        'Category must be one of: electronics, clothing, books, home, sports, toys, beauty, automotive'
    }
  },
  brand: {
    type: String,
    default: 'MadeInIndia',
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', category: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function () {
  return `₹${this.price.toFixed(2)}`;
});

// Method to check if product is in stock
productSchema.methods.isInStock = function () {
  return this.stock > 0;
};

// Static method to find products by category
productSchema.statics.findByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ createdAt: -1 });
};

// Static method to search products
productSchema.statics.searchProducts = function (query) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Product', productSchema);
