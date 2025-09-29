const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const productsRoutes = require('./routes/products.routes');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:4200','https://angecommerce.netlify.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: ' ✅ Server running on port 8082', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl 
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors 
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      message: 'Invalid ID format' 
    });
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({ 
      message: `${field} already exists` 
    });
  }
  
  res.status(error.status || 500).json({
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Database connection
const connectDB = async () => {
  try {
    // Try MongoDB Atlas first, then local MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://aishnidesh21:w3hfJwqv3PV851C8@cluster0.jxovuda.mongodb.net/ecomDB?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Log database collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name).join(', ') || 'None');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Note: Using MongoDB Atlas connection. If this fails, check your internet connection.');
    console.log('🔧 Alternative: Install MongoDB locally: https://www.mongodb.com/try/download/community');
    
    // Try local MongoDB as fallback
    try {
      console.log('🔄 Trying local MongoDB connection...');
      await mongoose.connect('mongodb://127.0.0.1:27017/ecommerce', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Local MongoDB connected successfully');
    } catch (localError) {
      console.error('❌ Local MongoDB also failed:', localError.message);
      console.log('⚠️  Continuing without database connection...');
      console.log('📝 Some features may not work without database');
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
const PORT = process.env.PORT || 8082;

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log('\n🚀 Server Status:');
      console.log(`   ✅ Server running on port ${PORT}`);
      console.log(`   🌐 Local: http://localhost:${PORT}`);
      console.log(`   📡 API Base: http://localhost:${PORT}/api`);
      console.log(`   🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   📅 Started at: ${new Date().toLocaleString()}`);
      console.log('\n📋 Available Endpoints:');
      console.log('   🔐 Auth: /api/auth (POST /register, POST /login, GET /profile)');
      console.log('   📦 Products: /api/products (GET, POST, PUT, DELETE)');
      console.log('\n⚡ Ready to accept requests!\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;