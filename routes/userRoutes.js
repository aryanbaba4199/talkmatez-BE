const express = require('express');
const router = express.Router();

const {getUserDetails, createUser, login} = require('../controller/users/usersController');


router.post('/createUser', createUser);
router.get('/getUserDetails/:mobile', getUserDetails);
router.get('/login/:mobile', login);



module.exports = router;