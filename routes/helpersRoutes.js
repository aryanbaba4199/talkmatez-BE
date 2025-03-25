const express = require('express');
const router = express.Router();
const  verifyToken = require('../utils/verification');


const {getLanguages, createLanguages, deleteLanguage,
    getGuide, createGuide, deleteGuide,
    createCountry, getCountries, deleteCountry,
} = require('../controller/Admin/helpers');






// Language
router.get('/getLanguages', getLanguages); 
router.post('/createLanguages', verifyToken, createLanguages);
router.get('/getLanguage', getLanguages);
router.delete('/deleteLanguage/:id', verifyToken, deleteLanguage);

//Guides
router.get('/getGuide', getGuide);
router.delete('/deleteGuide/:id', verifyToken, deleteGuide);
router.post('/createGuide', verifyToken, createGuide);

//country
router.get('/getCountry', getCountries);
router.delete('/deleteCountry/:id', verifyToken, deleteCountry);
router.post('/createCountry', verifyToken, createCountry);


module.exports = router;