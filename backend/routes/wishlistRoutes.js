const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/toggle/:productId', wishlistController.toggle);
router.delete('/:productId', wishlistController.remove);
router.delete('/', wishlistController.clear);

module.exports = router;
