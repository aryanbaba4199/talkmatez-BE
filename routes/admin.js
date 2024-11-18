const express = require('express');
const router = express.Router();

const {getLanguages} = require('../controller/Admin/helpers');
const {updateTutor, deleteTutor, socketLogs} = require('../controller/Admin/adminTutors');



router.get('/getLanguages', getLanguages);
router.put('/tutors/updateTutor', updateTutor);
router.delete('/tutors/deleteTutor/:id', deleteTutor);
router.get('/socketLogs', socketLogs);



module.exports = router;