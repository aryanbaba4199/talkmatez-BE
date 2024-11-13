const Tutors = require("../../models/Tutors/tutors");
const User = require("../../models/users/users");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const jwtKey = process.env.JWT_SECRET;

exports.getuserbyid = async (req, res, next) => {
  const { id } = req.params;
  try{
    const user = await User.findById(id);
    res.status(200).json(user);
  }catch(err){
    console.error(err);
    res.status(500).json({message: err.message});
  }
}

exports.createUser = async (req, res, next) => {
  const { formData } = req.body;
  try {
    const exisitingUser = await User.findOne({ mobile: formData.mobile });

    if (exisitingUser) {
      res.status(201).json({ message: "User Already Registered" });
    } else {
      const user = new User(formData);
      await user.save();
      const token = jwt.sign(
        {
          userId: user._id,
          mobile: user.mobile,
        },
        jwtKey,
        { expiresIn: `${24 * 30}h` }
      );
      res.status(200).json({ token: token, user: user });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getUserDetails = async (req, res, next) => {
  const { mobile } = req.params;

  try {
    const user = await User.findOne({ mobile : JSON.parse(mobile)});

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    if (user.length !== 0) {
      res.status(200).json(user);
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  console.log("called");
  const { mobile } = req.params;
  console.log(mobile); // Debug log to check the mobile parameter
  try {
    const user = await User.findOne({ mobile });
    console.log(user); // Debug log to check if the user is found
    if (user === null) {
      res.status(250).json({ message: "User not in database" });
    } else {
      const token = jwt.sign(
        {
          userId: user._id,
          mobile: user.mobile,
        },
        jwtKey,
        { expiresIn: `${24 * 30}h` }
      );
      res.status(200).json({ token, user });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getUsers = async(req, res, next) => {
  try{
    const users = await User.find();
    res.status(200).json(users); 
  }catch (err) {
    console.error(err);
  }
}

exports.updateUser = async(req, res, next) => {
  
  const {formData} = req.body;
  try{
    const user = await User.findByIdAndUpdate(formData._id, formData, {new:true});
    if(user){
      console.log(user);
      res.status(200).json({message:'success'})
    }else{
      res.status(404).json({message : 'Error updating user'});
    }
  }catch(err){
    console.error(err);
    next(err);
  }
};

exports.updateCoins = async (req, res, next) => {
  const formData = req.body;
  console.log(formData);
  try {
    // Await the update and get the updated user data
    const user = await User.findByIdAndUpdate(
      formData.id, 
      { coins: formData.coins }, 
      { new: true }  // Ensures the updated document is returned
    );
    console.log(user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error updating coins:', err);  
    res.status(500).json({ message: 'Error updating coins' });
  }
};


exports.uNtDetails = async(req, res, next)=>{
  
  const {userId, tutorId} = req.body;
  
  if(!userId && !tutorId){
    return res.status(400).json({message : '!userId or TutorId'})
  }
  try{
    const user = await User.findById({_id : userId})
  const tutor = await Tutors.findById({_id : tutorId})
  res.status(200).json({user, tutor})
  }catch(err){
    console.error(err);
    next(err);
  }

  
}