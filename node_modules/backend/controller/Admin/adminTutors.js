
const Tutors = require("../../models/Tutors/tutors");
const User = require("../../models/users/users");
const SocketLogs = require("../../models/Others/socket");

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
        return res.status(200).send({message: '0'});
    }catch(e){
        console.error(e);
        next(e);
    }
};

exports.deleteTutor = async(req, res, next)=>{
    const {id} = req.params;
    console.log('the id is ', id)
    try{
        const tutor = await Tutors.findByIdAndDelete(id);
        return res.status(200).send({message: 'tutor deleted successfully'});
    }catch(e){
        console.error(e);
        next(e);
    }
}

exports.socketLogs = async(req, res, next) => {
    try{
        const data = await SocketLogs.find();
        res.status(200).send(data);
    }catch(e){
        console.error(e);
        res.status(500).send({message: 'not found'});
    }
}

exports.updateCoinsbyAdmin = async(req, res, next) => {
    const {userId, coins} = req.body;
    console.log(userId, coins);
    try{
        const user = await User.findByIdAndUpdate(userId, {coins: coins}, {new: true});
        if(!user){
            return res.status(404).send({message: 'User not found'});
        }
        return res.status(200).send({message: 'Coins updated successfully'});
    }catch(e){
        console.error(e);
        next(e);
    }
}
