const express = require('express');
const miscController = require('../controllers/miscController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { digitalGoldEnrol } = require('../validators/miscValidators');

const router = express.Router();

// Public calculator — used by /digital-gold page slider
router.get('/calculate', miscController.calculate);

// Authenticated plan operations
router.use(protect);

router.post('/enrol', validate(digitalGoldEnrol), miscController.enrol);
router.get('/my-plans', miscController.listMyPlans);
router.get('/my-plans/:id', miscController.getMyPlan);
router.post('/my-plans/:id/installments/:month/pay', miscController.payInstallment);

module.exports = router;
