const express = require('express');
const router = express.Router();

const {getLanguages} = require('../controller/Admin/helpers');
const {updateTutor} = require('../controller/Admin/adminTutors');


router.get('/getLanguages', getLanguages);
router.put('/tutors/updateTutor', updateTutor);



module.exports = router;