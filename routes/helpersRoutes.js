const express = require('express');
const router = express.Router();


const {getLanguages, createLanguages, deleteLanguage,
    getGuide, createGuide, deleteGuide,
    createCountry, getCountries, deleteCountry,
} = require('../controller/Admin/helpers');






// Language
router.get('/getLanguages', getLanguages); 
router.post('/createLanguages', createLanguages);
router.get('/getLanguage', getLanguages);
router.delete('/deleteLanguage/:id', deleteLanguage);

//Guides
router.get('/getGuide', getGuide);
router.delete('/deleteGuide/:id', deleteGuide);
router.post('/createGuide', createGuide);

//country
router.get('/getCountry', getCountries);
router.delete('/deleteCountry/:id', deleteCountry);
router.post('/createCountry', createCountry);


module.exports = router;