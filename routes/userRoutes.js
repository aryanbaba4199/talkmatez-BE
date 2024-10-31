const express = require('express');
const router = express.Router();

const {getUserDetails, createUser, login, getUsers, updateUser} = require('../controller/users/usersController');
const {CallTiming, updateCallTiming, callDetails, fullLogs}  = require('../controller/users/CallController');

router.post('/createUser', createUser);
router.get('/getUserDetails/:mobile', getUserDetails);
router.get('/getUsers', getUsers);
router.get('/login/:mobile', login);
router.put('/updateUser', updateUser);


router.post('/startCall', CallTiming);
router.put('/endCall', updateCallTiming);
router.get('/calllogs/:id', callDetails);
router.get('/admincalllogs' , fullLogs);



module.exports = router;