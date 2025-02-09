const User = require("../../models/users/users");
const CallLogs = require("../../models/users/calllogs");
const axios = require("axios");
const Tutor = require("../../models/Tutors/tutors");
const Tutors = require("../../models/Tutors/tutors");



exports.CallTiming = async (req, res) => {
  const formData = req.body;
  
  if (!formData) {
    console.error("No form data provided");
    return;
  }

  try {
    // Use system time for the current timestamp
    const currentTime = new Date().toISOString(); // ISO format for consistency

    // Create a new call log with the form data and current start time
    const call = new CallLogs({ ...formData, start: currentTime });
    await call.save();

    // If this controller is called directly, just return the call data
    return call;
  } catch (err) {
    console.error("Error creating call log:", err);
  }
};



exports.updateCallTiming = async (req, res, next) => {
  const { data, action, call } = req.body;

  if (!data) {
    console.log("no data found");
    return res.status(400).json({ message: "No data found in request body" });
  }


  try {
    
    const currentTime = new Date().toISOString();

    const startTime = data.start;
    let callDuration = call ? 0  : (new Date(currentTime) - new Date(startTime)) / 1000; 

    console.log('call duration: ' + callDuration)
    const coinDuration = Math.ceil(callDuration / 60);
    console.log('coin duration: ' + coinDuration)


    const tutor = await Tutors.findById(data.secUserId);
    const user = await User.findById(data.userId);

  
    const earnCoin = tutor.rate * coinDuration;
    console.log('earn coin is ',earnCoin)
    const updatedTutor = await Tutors.findByIdAndUpdate(
      data.secUserId,
      { coins: Math.round(tutor.coins + earnCoin) },
      { new: true }
    );

    const updatedUser = await User.findByIdAndUpdate(
      data.userId,
      { coins: Math.round(user.coins - earnCoin) },
      { new: true }
    );

    if (action === 2) {
      const updatedCall = await CallLogs.findByIdAndUpdate(
        data._id,
        {
          start: currentTime,
          end: currentTime,
          tutorEndCoin: updatedTutor.coins,
          studentEndCoin: updatedUser.coins,
          action: action,
          connection: true,
        },
        { new: true }
      );
      return updatedCall;
    } else {
      const updatedCall = await CallLogs.findByIdAndUpdate(
        data._id,
        {
          end: currentTime,
          tutorEndCoin: updatedTutor.coins,
          studentEndCoin: updatedUser.coins,
          action: action,
        },
        { new: true }
      );
      return updatedCall;
    }
  } catch (err) {
    console.log("Error updating call timing:", err);
    res.status(500).json(err);
  }
};


exports.callDetails = async (req, res, next) => {
  console.log('call details')
  const { id, page = 1 } = req.params; // Default to page 1 if not provided
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const logs = await CallLogs.find({ userId: id })
      .populate({
        path: "secUserId",
        model: Tutor,
        select: "name",
      })
      .sort({ start: -1 }) // Sort by start time descending to get latest logs
      .skip(skip)
      .limit(limit);

    if (logs.length > 0) {
      const callDetails = logs.map((log) => ({
        tutorName: log.secUserId ? log.secUserId.name : "Unknown Tutor",
        start: log.start,
        end: log.end,
        studentUsedCoins : log.studentStartCoin-log.studentEndCoin, 
        action : log.action,
        connection : log.connection,
      }));

      return res.status(200).json({ callDetails });
    } else {
      return res.status(404).json({ message: "No call logs found for this user" });
    }
  } catch (err) {
    console.error("Error getting call logs", err);
    next(err);
  }
};

exports.tutorCalllogs = async (req, res, next) => {
  const { id, page = 1 } = req.params;
  const limit = 100;
  const skip = (page - 1) * limit;

  try {
    const logs = await CallLogs.find({ secUserId: id })
      .populate({
        path: "userId",
        model: User,
        select: "name",
      })
      .sort({ start: -1 }) // Sort by start time descending to get latest logs
      .skip(skip)
      .limit(limit);
    if (logs.length > 0) {
      const callDetails = logs.map((log) => ({
        studentName: log.userId ? log.userId.name : "Unknown Student",
        start: log.start,
        end: log.end,
        studentUsedCoins : log.studentStartCoin-log.studentEndCoin, 
        action : log.action,
        connection : log.connection,
      }));

      return res.status(200).json({ callDetails });
    } else {
      return res.status(404).json({ message: "No call logs found for this user" });
    }
    
  } catch (err) {
    console.error("Error getting call logs", err);
    next(err);
  }
};


exports.fullLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Fetch call logs with pagination
    const callLogs = await CallLogs.find()
      .sort({ start: -1 })
      .skip(skip)
      .limit(limit);

    const enhancedLogs = await Promise.all(
      callLogs.map(async (log) => {
        const user = await User.findById(log.userId, "name");
        const secUser = await Tutors.findById(log.secUserId, "name");

        return {
          ...log._doc,
          student: user ? user.name : null,
          user: secUser ? secUser.name : null,
        };
      })
    );

    return res.status(200).json(enhancedLogs);
  } catch (e) {
    console.error(e);
    next(e);
  }
};
