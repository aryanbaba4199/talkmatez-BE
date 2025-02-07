const express = require('express');
const router = express.Router();

const {getTutors, createTutor, updateTutor, login, updateToken, getTutor, dashboardData, updateRating, getTutorsList
    ,getDisconnectedCalls, getMissedCalls, getReceivedCalls, getRejectedCalls
} = require('../controller/Tutors/tutorsController');
const {tutorCalllogs} = require('../controller/users/CallController');

console.log('called')

router.post('/createTutor', createTutor);
router.get('/getTutors', getTutors);
router.get('/getTutorsList', getTutorsList);
router.put('/updateTutor', updateTutor);
router.post('/login', login);
router.put('/updateToken', updateToken)
router.get('/getTutor/:id', getTutor);
router.get('/calllogs/:id', tutorCalllogs);
router.get('/dashboard/:id', dashboardData);
router.put('/updateRating/:id', updateRating);

// Call logs
router.get('/calls/missed/:id', getMissedCalls);
router.get('/calls/accepted/:id', getReceivedCalls);
router.get('/calls/rejected/:id', getRejectedCalls);
router.get('/calls/disconnected/:id', getDisconnectedCalls);



module.exports = router;