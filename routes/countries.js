// backend/routes/countries.js
const router = require('express').Router();
const countriesController = require('../controllers/countriesController');

router.get('/', countriesController.getCountries);

module.exports = router;
