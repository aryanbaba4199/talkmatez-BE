const express = require('express');
const router = express.Router();

const {countryDetails} = require('../controller/Helpers/userHelpers');
const {getLanguages} = require('../controller/Admin/helpers')



router.get('/countries', countryDetails);
router.get('/getLanguages', getLanguages); 


module.exports = router;