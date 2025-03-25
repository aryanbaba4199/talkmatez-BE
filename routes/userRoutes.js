const express = require('express');
const router = express.Router();
const {createOrder, VerifyRzr} = require('../controller/users/razorpay')
const {getUserDetails, createUser,createTransaction, disableTxn, pendingTxns, updateTransaction, login, getUsers, updateUser, uNtDetails,  getuserbyid, updateCoins, getTransaction, getNotification, createNotification, updateNotification, verifyTransaction, deleteUser} = require('../controller/users/usersController');
const {CallTiming, updateCallTiming, callDetails, fullLogs}  = require('../controller/users/CallController');
const { verifyPayment } = require('../controller/Admin/payment');
const verifyToken = require('../utils/verification');

router.post('/createUser', createUser);
router.get('/getUserDetails', verifyToken, getUserDetails);
router.get('/getUsers', verifyToken, getUsers);
router.get('/login/:mobile', login);
router.put('/updateUser', verifyToken, updateUser);
router.get('/getuserbyid', verifyToken, getuserbyid);
router.put('/updateCoins', verifyToken, updateCoins);
router.post('/startCall',verifyToken, CallTiming);
router.put('/endCall',verifyToken, updateCallTiming);
router.get('/calllogs',verifyToken, callDetails);
router.get('/admincalllogs' ,verifyToken, fullLogs);
router.post('/userandtutordetails', verifyToken,uNtDetails )
router.get('/getTransaction', verifyToken, getTransaction) 
router.get('/verifyTransaction/:id', verifyToken, verifyTransaction)
router.post('/createTransaction', createTransaction)
router.put('/notification/:id', updateNotification)
router.get('/notification/:id', getNotification);
router.post('/notification', createNotification);
router.put('/updateTransaction', verifyToken, updateTransaction)
router.get('/pendingTxns/:id', verifyToken, pendingTxns)
router.put('/disableTxn/:id', verifyToken, disableTxn) 
router.delete('/removeUser/:id', verifyToken, deleteUser)
router.post('/payment', verifyToken, createOrder);
router.get('/payment/:id', verifyToken, VerifyRzr)





module.exports = router;