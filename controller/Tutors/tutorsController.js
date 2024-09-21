const Tutors = require("../../models/Tutors/tutors");

exports.createTutor = async(req, res, next)=>{
   const {formData} = req.body;
   try{
    const tutor = new Tutors(formData);
     await tutor.save();
     res.status(200).json({message : "success"})
   } catch(e){
    console.log(e);
    next(e);
   }
}

exports.getTutors = async(req, res, next)=>{
    try{
        const tutors = await Tutors.find();
        if(tutors){
            res.status(200).json(tutors)
        }else{
            res.status(404).json({message : "tutorial not found"})  
        }
    }catch(e){
        console.log(e);
        next(e);
    }
};

exports.updateTutor = async(req, res, next)=>{
    const {formData} = req.body;
    console.log(formData);
    try{
        const tutor = await Tutors.findByIdAndUpdate(formData._id, formData, {
            new : true,
            runValidators : true,
        })
        if(!tutor){
            return res.status(404).send({message: 'Tutor not found'});

        }
        return res.status(200).json(tutor);
    }catch(e){
        console.error(e);
        next(e);
    }
};