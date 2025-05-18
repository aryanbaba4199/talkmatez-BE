const express = require('express');
const {createCall, endCall} = require('../controller/users/CallController')


const router = express.Router();

router.post('/startCall', createCall)
router.post('/endCall', endCall)




module.exports = router;