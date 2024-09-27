const express = require('express');
const router = express.Router();

const {getTutors, createTutor, updateTutor} = require('../controller/Tutors/tutorsController');
console.log('called')

router.post('/createTutor', createTutor);
router.get('/getTutors', getTutors);
router.put('/updateTutor', updateTutor);


module.exports = router;