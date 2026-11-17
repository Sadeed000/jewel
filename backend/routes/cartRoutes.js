const express = require('express');
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { addToCart, updateCartItem, applyCoupon } = require('../validators/cartValidator');

const router = express.Router();

router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', validate(addToCart), cartController.addItem);
router.patch('/items/:itemId', validate(updateCartItem), cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

router.post('/coupon', validate(applyCoupon), cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);

module.exports = router;
