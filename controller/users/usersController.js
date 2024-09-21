const User = require('../../models/users/users').

exports.createUser = async (req, res, next) => {
    const {formData} = req.body;
    try{
        const exisitingUser = await User.findOne({mobile : formData.mobile});
        if(exisitingUser){
            res.status(201).json({message : "User Already Registered"})
        }else{
            const user = new User(formData);
            await user.save();
            res.status(200).json({message : "User Registered"})
        }
    }catch(err){
        console.error(err);
        next(err);
    }
}

exports.getUserDetails = async(req, res, next)=>{
    const {mobile} = req.params;
    try{
        const user = await User.findOne({mobile : mobile});
        if(user){
            res.status(200).json(user);
        }else{
            res.status(404).json({message : "User not in database"});
        }
    }catch(err){
        console.error(err);
        next(err);
    }
};