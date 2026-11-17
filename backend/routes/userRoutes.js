const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updateProfile, addressBody } = require('../validators/userValidator');

const router = express.Router();

// All routes below require authentication
router.use(protect);

router.get('/me', userController.getProfile);
router.patch('/me', validate(updateProfile), userController.updateProfile);

router.get('/addresses', userController.listAddresses);
router.post('/addresses', validate(addressBody), userController.addAddress);
router.patch('/addresses/:addressId', validate(addressBody), userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

module.exports = router;
