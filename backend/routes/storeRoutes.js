const express = require('express');
const miscController = require('../controllers/miscController');
const validate = require('../middlewares/validate');
const { storeQuery } = require('../validators/miscValidators');

const router = express.Router();

router.get('/', validate(storeQuery, 'query'), miscController.listStores);
router.get('/:slug', miscController.getStoreBySlug);

module.exports = router;
