const express = require('express');
const miscController = require('../controllers/miscController');
const validate = require('../middlewares/validate');
const { newsletter } = require('../validators/miscValidators');

const router = express.Router();

router.post('/subscribe', validate(newsletter), miscController.subscribe);
router.post('/unsubscribe', validate(newsletter), miscController.unsubscribe);

module.exports = router;
