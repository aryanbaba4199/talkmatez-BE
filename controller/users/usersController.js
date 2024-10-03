const User = require("../../models/users/users");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const jwtKey = process.env.JWT_SECRET;

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