const express = require('express');
const router = express.Router();

const {getTutors, createTutor, updateTutor, login, updateToken, getTutor} = require('../controller/Tutors/tutorsController');
const {tutorCalllogs} = require('../controller/users/CallController');

console.log('called')

router.post('/createTutor', createTutor);
router.get('/getTutors', getTutors);
router.put('/updateTutor', updateTutor);
router.get('/login/:id', login);
router.put('/updateToken', updateToken)
router.get('/getTutor/:id', getTutor);
router.get('/calllogs/:id', tutorCalllogs);



module.exports = router;