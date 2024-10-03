const express = require('express');
const router = express.Router();

const {getUserDetails, createUser, login, getUsers, updateUser} = require('../controller/users/usersController');


router.post('/createUser', createUser);
router.get('/getUserDetails/:mobile', getUserDetails);
router.get('/getUsers', getUsers);
router.get('/login/:mobile', login);
router.put('/updateUser', updateUser);



module.exports = router;