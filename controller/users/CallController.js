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
    console.log("No data found in request body");
    return res.status(400).json({ message: "No data found" });
  }

  try {
    let loading;
    const currentTime = new Date().toISOString();
    const startLog = await CallLogs.findById(data._id);
    if (!startLog) {
      console.error("Call log not found");
      return res.status(404).json({ message: "Call log not found" });
    }
    if(startLog.charge!==0){
      console.log('Charges already applied');
      return;
    }

    const startTime = startLog.start;
    let callDuration = call ? 0 : (Date.now() - new Date(startTime)) / 1000;

    console.log("Call Duration (seconds):", callDuration);

    let coinDuration = Math.max(0, Math.ceil(callDuration / 60));
    console.log("Coin Duration (minutes after free minutes used):", coinDuration);

    const tutor = await Tutors.findById(data.secUserId);
    const user = await User.findById(data.userId);
    if (!tutor || !user) {
      console.error("Tutor or User not found");
      return res.status(404).json({ message: "Tutor or User not found" });
    }

    const tutorRate = tutor.rate;
    const totalCharge = tutorRate * coinDuration;
    console.log("Total Charge:", totalCharge);
    
    // **Deduct from User Coins**
    let remainingDeduction = totalCharge;
    let usedSilverCoins = 0;
    let updatedSilverCoins = [...user.silverCoins];

    // Sort silver coins by oldest first
    updatedSilverCoins.sort((a, b) => new Date(a.time) - new Date(b.time));

    // Deduct from silver coins first
    for (let i = 0; i < updatedSilverCoins.length; i++) {
      if (remainingDeduction <= 0) break;

      let silverCoinEntry = updatedSilverCoins[i];
      if (silverCoinEntry.coins >= remainingDeduction) {
        silverCoinEntry.coins -= remainingDeduction;
        usedSilverCoins += remainingDeduction;
        remainingDeduction = 0;
      } else {
        usedSilverCoins += silverCoinEntry.coins;
        remainingDeduction -= silverCoinEntry.coins;
        silverCoinEntry.coins = 0;
      }
    }

    // Remove zero silver coin entries
    updatedSilverCoins = updatedSilverCoins.filter(coin => coin.coins > 0);

    // Deduct remaining from user's gold coins
    const usedGoldCoins = remainingDeduction;

    // Update user's coins
    loading = true;
    const currCallLog = await CallLogs.findById(data._id);
    if(currCallLog.charge!==0){
      console.log('Charges already applied');
      return;
    }
    const updatedUser = await User.findByIdAndUpdate(
      data.userId,
      {
        $set: { silverCoins: updatedSilverCoins },
        $inc: { coins: -usedGoldCoins }
      },
      { new: true }
    );

    // **Credit Tutor with coins deducted from the user**
    const updatedTutor = await Tutors.findByIdAndUpdate(
      data.secUserId,
      {
        $inc: { coins: usedGoldCoins, silverCoins: usedSilverCoins }
      },
      { new: true }
    );

    console.log("Coins Deducted from User - Gold:", usedGoldCoins);
    console.log("Coins Deducted from User - Silver:", usedSilverCoins);
    console.log("Coins Credited to Tutor - Gold:", usedGoldCoins);
    console.log("Coins Credited to Tutor - Silver:", usedSilverCoins);

    // **Update Call Log**
    const userEndSilverCoins = updatedUser.silverCoins.reduce((sum, coin) => sum + (coin.coins || 0), 0);
    const callUpdateData = {
      end: currentTime,
      tutorEndGoldCoin: updatedTutor.coins,
      studentEndGoldCoin: updatedUser?.coins || 0,
      studentEndSilverCoin: userEndSilverCoins,
      tutorEndSilverCoin: updatedTutor?.silverCoins,
      charge : totalCharge,
      action: action,
    };

    if (action === 2) {
      callUpdateData.start = currentTime;
      callUpdateData.connection = true;
    }

    await CallLogs.findByIdAndUpdate(data._id, callUpdateData, { new: true });

    return;

  } catch (err) {
    console.error("Error updating call timing:", err);
    return res.status(500).json({ error: "Internal Server Error" });
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
      // const callDetails = logs.map((log) => ({
      //   tutorName: log.secUserId ? log.secUserId.name : "Unknown Tutor",
      //   start: log.start,
      //   end: log.end,
      //   studentUsedCoins : log.studentStartCoin-log.studentEndCoin, 
      //   action : log.action,
      //   connection : log.connection,
      // }));

      return res.status(200).json({ logs });
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
      

      return res.status(200).json(logs);
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


