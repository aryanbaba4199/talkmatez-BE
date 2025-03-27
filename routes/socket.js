
const express = require('express');
const router = express.Router();
const {handleStudentCallEnd, handleStudentEarlyCallEnd} = require('../controller/socketController');

router.post('/student/earlyEnd', handleStudentEarlyCallEnd);
router.post('/student/end', handleStudentCallEnd);

module.exports = router;