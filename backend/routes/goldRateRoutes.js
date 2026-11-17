const express = require('express');
const miscController = require('../controllers/miscController');

const router = express.Router();

// Public — used by the gold rate ticker on every page
router.get('/', miscController.getGoldRate);

module.exports = router;
