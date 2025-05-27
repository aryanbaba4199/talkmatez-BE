const jwt = require('jsonwebtoken');
const User = require('../models/users/users');
const Tutors = require('../models/Tutors/tutors');

const verifyToken = async(req, res, next)=>{
    try{
        console.log('Verifying token', req?.headers?.authorization);
        const token = req.headers.authorization.split(' ')[1];
        
        
        if(!token){
            return res.status(403).json({message: 'Token not provided'});
        }
     

        const decoded = jwt.decode(token, process.env.JWT_SECRET);
   
        let user;
        user = await User.findById(decoded.id).select('name mobile _id fcmToken coins silverCoins');
        if(!user){
            user = await Tutors.findById(decoded.userId);
        };
        if(!user){
            return res.status(404).json({message: 'Unauthorized Access'});
        }
        req.user = user;
    
        next();
    }catch(err){
        console.log('Error in verification',err)
        return res.status(500).json({message: 'Internal Server Error'});
    }
}
module.exports = verifyToken;