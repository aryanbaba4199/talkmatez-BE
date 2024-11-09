const express = require('express');
const router = express.Router();

const {getLanguages} = require('../controller/Admin/helpers');
const {updateTutor, deleteTutor} = require('../controller/Admin/adminTutors');



router.get('/getLanguages', getLanguages);
router.put('/tutors/updateTutor', updateTutor);
router.delete('/tutors/deleteTutor/:id', deleteTutor);



module.exports = router;