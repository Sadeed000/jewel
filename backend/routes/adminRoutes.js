const express = require('express');
const { protect, restrictTo } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const adminController = require('../controllers/adminController');
const { adminOrderQuery, adminCustomerQuery, updateCustomer } = require('../validators/adminValidator');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/dashboard', adminController.getDashboard);

router.get('/orders', validate(adminOrderQuery, 'query'), adminController.listOrders);
router.get('/orders/:id', adminController.getOrderById);

router.get('/customers', validate(adminCustomerQuery, 'query'), adminController.listCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.patch('/customers/:id', validate(updateCustomer), adminController.updateCustomer);

module.exports = router;    