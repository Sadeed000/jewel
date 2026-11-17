const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { register, login, updatePassword } = require('../validators/authValidator');

const router = express.Router();

// Strict limiter on credential endpoints to slow down brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 'fail', message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validate(register), authController.register);
router.post('/login', authLimiter, validate(login), authController.login);
router.post('/logout', authController.logout);

// Protected
router.get('/me', protect, authController.me);
router.patch('/update-password', protect, validate(updatePassword), authController.updatePassword);

module.exports = router;
