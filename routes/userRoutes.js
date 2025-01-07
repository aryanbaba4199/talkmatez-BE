const express = require('express');
const router = express.Router();

const {getUserDetails, createUser, login, getUsers, updateUser, uNtDetails, getuserbyid, updateCoins, getTransaction} = require('../controller/users/usersController');
const {CallTiming, updateCallTiming, callDetails, fullLogs}  = require('../controller/users/CallController');

router.post('/createUser', createUser);
router.get('/getUserDetails/:mobile', getUserDetails);
router.get('/getUsers', getUsers);
router.get('/login/:mobile', login);
router.put('/updateUser', updateUser);
router.get('/getuserbyid/:id', getuserbyid);
router.put('/updateCoins', updateCoins);


router.post('/startCall', CallTiming);
router.put('/endCall', updateCallTiming);
router.get('/calllogs/:id', callDetails);
router.get('/admincalllogs' , fullLogs);
router.post('/userandtutordetails',uNtDetails )
router.get('/getTransaction/:id', getTransaction) 



module.exports = router;