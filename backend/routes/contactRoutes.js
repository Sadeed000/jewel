const express = require('express');
const rateLimit = require('express-rate-limit');
const miscController = require('../controllers/miscController');
const validate = require('../middlewares/validate');
const { contact } = require('../validators/miscValidators');

const router = express.Router();

// Limit contact form submissions to prevent spam
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { status: 'fail', message: 'Too many contact submissions. Please try again later.' },
});

router.post('/', contactLimiter, validate(contact), miscController.submitContact);

module.exports = router;
