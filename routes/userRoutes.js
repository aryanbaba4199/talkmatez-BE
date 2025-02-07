const express = require('express');
const router = express.Router();

const {getUserDetails, createUser,createTransaction, updateTransaction, login, getUsers, updateUser, uNtDetails,  getuserbyid, updateCoins, getTransaction, getNotification, createNotification, updateNotification, verifyTransaction} = require('../controller/users/usersController');
const {CallTiming, updateCallTiming, callDetails, fullLogs}  = require('../controller/users/CallController');
const { verifyPayment } = require('../controller/Admin/payment');

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
router.get('/verifyTransaction/:id', verifyTransaction)
router.post('/createTransaction', createTransaction)
router.put('/notification/:id', updateNotification)
router.get('/notification/:id', getNotification);
router.post('/notification', createNotification);
router.put('/updateTransaction', updateTransaction)





module.exports = router;