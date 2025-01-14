const express = require('express');
const router = express.Router();

const {getLanguages} = require('../controller/Admin/helpers');
const {createPackage, getPackages, updatePackage, deletePackages} = require('../controller/Admin/Pkg');
const {updateTutor, updateCoinsbyAdmin, deleteTutor, socketLogs} = require('../controller/Admin/adminTutors');



router.get('/getLanguages', getLanguages);
router.put('/tutors/updateTutor', updateTutor);
router.delete('/tutors/deleteTutor/:id', deleteTutor);
router.get('/socketLogs', socketLogs);
router.get('/packages/getPackage', getPackages);
router.post('/packages/createPackage', createPackage);
router.put('/packages/updatePackage', updatePackage);
router.delete('/packages/deletePackage/:id', deletePackages);
router.put('/users/updateCoinsByAdmin', updateCoinsbyAdmin);

module.exports = router;