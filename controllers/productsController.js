const Product = require('../models/product.model');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Create new product (Admin only)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, stock, brand, rating } = req.body;

    // Validation
    if (!name || !description || !price || !image || !category || stock === undefined) {
      return res.status(400).json({ 
        message: 'All fields are required: name, description, price, image, category, stock' 
      });
    }

    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    if (stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      image,
      category,
      stock: parseInt(stock),
      brand: brand || 'MadeInIndia',
      rating: rating !== undefined ? parseFloat(rating) : 0
    });
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Validation error', error: error.message });
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, stock, brand, rating } = req.body;

    // Validation
    if (price !== undefined && price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (image) updateData.image = image;
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (brand) updateData.brand = brand;
    if (rating !== undefined) updateData.rating = parseFloat(rating);

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Validation error', error: error.message });
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Update product rating
const updateProductRating = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 0 || rating > 5) return res.status(400).json({ message: 'Invalid rating value. Must be between 0 and 5.' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.ratingCount) {
      const totalRating = product.rating * product.ratingCount;
      product.ratingCount += 1;
      product.rating = (totalRating + rating) / product.ratingCount;
    } else {
      product.rating = rating;
      product.ratingCount = 1;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product rating:', error);
    res.status(500).json({ message: 'Error updating product rating', error: error.message });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Error fetching products by category', error: error.message });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Search query is required' });

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  updateProductRating // ✅ fixed: now exported
};