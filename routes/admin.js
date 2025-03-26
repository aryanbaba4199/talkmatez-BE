const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verification');

const {getLanguages} = require('../controller/Admin/helpers');
const {createPackage, getPackages, updatePackage, deletePackages, createWelPkg, getWelPkg, updateWelPkg, getaPackage,getTransctionById, getTransaction} = require('../controller/Admin/Pkg');
const {updateTutor, updateCoinsbyAdmin, deleteTutor, login} = require('../controller/Admin/adminTutors');
const {createSlider, getSliders, updateSlider, deleteSlider} = require('../controller/Admin/sliders');



router.get('/getLanguages', getLanguages);
router.put('/tutors/updateTutor', verifyToken, updateTutor);
router.delete('/tutors/deleteTutor/:id', verifyToken, deleteTutor);
router.get('/packages/getPackage',  getPackages);
router.post('/packages/createPackage', verifyToken, createPackage);
router.put('/packages/updatePackage', verifyToken, updatePackage);
router.delete('/packages/deletePackage/:id', verifyToken, deletePackages);
router.put('/users/updateCoinsByAdmin', verifyToken, updateCoinsbyAdmin);
router.get('/packages/getapackage/:id', getaPackage);

// welcome package
router.post('/create/welcomePackage', verifyToken, createWelPkg)
router.get('/get/welcomePackage', getWelPkg);
router.put('/update/welcomePackage', verifyToken, updateWelPkg)
router.post('/login', login)

// ----------sliders--------------------------------
router.post('/sliders', verifyToken, createSlider);
router.get('/sliders', getSliders);
router.put('/sliders',verifyToken, updateSlider);
router.delete('/sliders/:id',verifyToken, deleteSlider);

//-------------Transaction-----------------------
router.get('/transactions/:page', verifyToken, getTransaction) 
router.get('/transactionById/:id', verifyToken, getTransctionById)


module.exports = router;