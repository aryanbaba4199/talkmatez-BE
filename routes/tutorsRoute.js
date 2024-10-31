const express = require('express');
const router = express.Router();

const {getTutors, createTutor, updateTutor, login, updateToken} = require('../controller/Tutors/tutorsController');
console.log('called')

router.post('/createTutor', createTutor);
router.get('/getTutors', getTutors);
router.put('/updateTutor', updateTutor);
router.get('/login/:id', login);
router.put('/updateToken', updateToken)


module.exports = router;