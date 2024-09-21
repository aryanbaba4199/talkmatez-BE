const express = require('express');
const router = express.Router();

const {countryDetails} = require('../controller/Helpers/userHelpers');


router.get('/countries', countryDetails);


module.exports = router;