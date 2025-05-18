const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verification');

const {getTutors, createTutor, updateTutor, login, updateToken, getTutor, dashboardData, updateRating, getTutorsList
    ,getDisconnectedCalls, getMissedCalls, getReceivedCalls, getRejectedCalls,
    updateFirstTime,
    xendCall
} = require('../controller/Tutors/tutorsController');
const {tutorCalllogs} = require('../controller/users/CallController');

console.log('called')

router.post('/createTutor', verifyToken, createTutor);
router.get('/getTutors', getTutors);
router.get('/getTutorsList', getTutorsList);
router.put('/updateTutor', verifyToken, updateTutor);
router.post('/login', login);
router.put('/updateToken', updateToken)
router.get('/getTutor', verifyToken, getTutor);
router.get('/calllogs', verifyToken, tutorCalllogs);
router.get('/dashboard', verifyToken, dashboardData);
router.put('/updateRating/:id', updateRating);
router.get('/updateFirstTime/:id', updateFirstTime);

// Call logs
router.get('/calls/missed/:id', verifyToken, getMissedCalls);
router.get('/calls/accepted/:id',verifyToken, getReceivedCalls);
router.get('/calls/rejected/:id', verifyToken, getRejectedCalls);
router.get('/calls/disconnected/:id', verifyToken, getDisconnectedCalls);


// call action 
router.post('/declineCall', xendCall)




module.exports = router;