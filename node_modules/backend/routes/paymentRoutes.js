const express = require('express')


const { initiatePayment, verifyPayment,generateCryptoString } = require("../controller/Admin/payment");
const router = express.Router();
router.post("/initiate", initiatePayment);
router.post("/verify", verifyPayment);
router.post("/crypto", generateCryptoString);
module.exports = router;