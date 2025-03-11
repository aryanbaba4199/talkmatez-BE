const express = require('express');
const router = express.Router();
const {createOrder, VerifyRzr} = require('../controller/users/razorpay')
const {getUserDetails, createUser,createTransaction, disableTxn, pendingTxns, updateTransaction, login, getUsers, updateUser, uNtDetails,  getuserbyid, updateCoins, getTransaction, getNotification, createNotification, updateNotification, verifyTransaction, deleteUser} = require('../controller/users/usersController');
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
router.get('/pendingTxns/:id', pendingTxns)
router.put('/disableTxn/:id', disableTxn) 
router.delete('/removeUser/:id', deleteUser)
router.post('/payment', createOrder);
router.get('/payment/:id', VerifyRzr)





module.exports = router;