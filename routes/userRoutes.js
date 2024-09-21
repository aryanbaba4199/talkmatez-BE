const express = require('express');
const router = express.Router();

const {getUserDetails, createUser} = require('../controller/users/usersController');


router.post('/createUser', createUser);
router.get('/getUserDetails', getUserDetails);


module.exports = router;