// routes/products.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  updateProductRating
} = require('../controllers/productsController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Public routes (no authentication required)
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

// Protected routes (admin only)
router.post('/', auth, admin, createProduct);
router.put('/:id', auth, admin, updateProduct);
router.delete('/:id', auth, admin, deleteProduct);

// Rating route (requires auth but not admin)
router.patch('/:id/rating', auth, updateProductRating);

module.exports = router;