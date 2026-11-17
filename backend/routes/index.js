const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const orderRoutes = require('./orderRoutes');
const storeRoutes = require('./storeRoutes');
const newsletterRoutes = require('./newsletterRoutes');
const contactRoutes = require('./contactRoutes');
const goldRateRoutes = require('./goldRateRoutes');
const digitalGoldRoutes = require('./digitalGoldRoutes');
const contentRoutes = require('./contentRoutes');
const adminRoutes = require('./adminRoutes');
const uploadRoutes = require('./uploadRoutes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    data: {
      service: 'aurelia-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Module mounts
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/stores', storeRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/contact', contactRoutes);
router.use('/gold-rate', goldRateRoutes);
router.use('/digital-gold', digitalGoldRoutes);
router.use('/content', contentRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
