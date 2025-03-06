const express = require('express');
const router = express.Router();

const {getLanguages} = require('../controller/Admin/helpers');
const {createPackage, getPackages, updatePackage, deletePackages, createWelPkg, getWelPkg, updateWelPkg, getaPackage} = require('../controller/Admin/Pkg');
const {updateTutor, updateCoinsbyAdmin, deleteTutor, login} = require('../controller/Admin/adminTutors');
const {createSlider, getSliders, updateSlider, deleteSlider} = require('../controller/Admin/sliders');


router.get('/getLanguages', getLanguages);
router.put('/tutors/updateTutor', updateTutor);
router.delete('/tutors/deleteTutor/:id', deleteTutor);
router.get('/packages/getPackage', getPackages);
router.post('/packages/createPackage', createPackage);
router.put('/packages/updatePackage', updatePackage);
router.delete('/packages/deletePackage/:id', deletePackages);
router.put('/users/updateCoinsByAdmin', updateCoinsbyAdmin);
router.get('/packages/getapackage/:id', getaPackage);

// welcome package
router.post('/create/welcomePackage', createWelPkg)
router.get('/get/welcomePackage', getWelPkg);
router.put('/update/welcomePackage', updateWelPkg)
router.post('/login', login)

// ----------sliders--------------------------------
router.post('/sliders', createSlider);
router.get('/sliders', getSliders);
router.put('/sliders', updateSlider);
router.delete('/sliders/:id', deleteSlider);


module.exports = router;