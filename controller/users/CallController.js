const User = require("../../models/users/users");
const CallLogs = require("../../models/users/calllogs");
const Tutors = require("../../models/Tutors/tutors");
const mongoose = require("mongoose");
const {sendXmppMessage} = require('../xmpp')

exports.CallTiming = async (req) => {
  const formData = req.body;

  if (!formData) {
    console.error("No form data provided");
    throw new Error("No form data provided");
  }

  try {
    const currentTime = new Date().toISOString();
    const call = new CallLogs({ ...formData, start: currentTime, charge: 0, connection: false });
    await call.save();
    return call;
  } catch (err) {
    console.error("Error creating call log:", err);
    throw err;
  }
};

const MAX_RETRIES = 3;

exports.updateCallTiming = async ({ body }) => {
  const { data, action, call } = body;

  if (!data) {
    console.log("No data provided");
    throw new Error("No data found");
  }

  let retries = 0;
  while (retries < MAX_RETRIES) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const currentTime = new Date().toISOString();
      const startLog = await CallLogs.findById(data._id).session(session);
      if (!startLog) {
        console.error("Call log not found for ID:", data._id);
        await session.abortTransaction();
        throw new Error("Call log not found");
      }

      if (startLog.charge !== 0) {
        console.log(`Charges already applied for call ID: ${data._id}`);
        await session.commitTransaction();
        return { success: true, message: "Charges already applied" };
      }

      const startTime = new Date(startLog.start);
      let callDuration = call ? (Date.now() - startTime) / 1000 : 0;
      console.log("Call Duration (seconds):", callDuration);

      let coinDuration = Math.max(0, Math.ceil(callDuration / 60));
      console.log("Coin Duration (minutes):", coinDuration);

      const tutor = await Tutors.findById(data.secUserId).session(session);
      const user = await User.findById(data.userId).session(session);
      if (!tutor || !user) {
        console.error("Tutor or User not found");
        await session.abortTransaction();
        throw new Error("Tutor or User not found");
      }

      const tutorRate = tutor.rate;
      const totalCharge = tutorRate * coinDuration;
      console.log("Total Charge:", totalCharge);

      let updatedUser = user;
      let updatedTutor = tutor;

      // Only charge if the call was connected and this is the final update
      if (totalCharge > 0 && call && startLog.connection === true) {
        let remainingDeduction = totalCharge;
        let usedSilverCoins = 0;
        let updatedSilverCoins = [...user.silverCoins];

        updatedSilverCoins.sort((a, b) => new Date(a.time) - new Date(b.time));

        for (let i = 0; i < updatedSilverCoins.length && remainingDeduction > 0; i++) {
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

        updatedSilverCoins = updatedSilverCoins.filter(coin => coin.coins > 0);
        const usedGoldCoins = remainingDeduction;

        updatedUser = await User.findByIdAndUpdate(
          data.userId,
          {
            $set: { silverCoins: updatedSilverCoins },
            $inc: { coins: -usedGoldCoins }
          },
          { new: true, session }
        );

        updatedTutor = await Tutors.findByIdAndUpdate(
          data.secUserId,
          {
            $inc: { coins: usedGoldCoins, silverCoins: usedSilverCoins }
          },
          { new: true, session }
        );

        console.log("Coins Deducted from User - Gold:", usedGoldCoins);
        console.log("Coins Deducted from User - Silver:", usedSilverCoins);
        console.log("Coins Credited to Tutor - Gold:", usedGoldCoins);
        console.log("Coins Credited to Tutor - Silver:", usedSilverCoins);
      } else {
        console.log(`No charge applied: connection=${startLog.connection}, isFinal=${call}`);
      }

      const userEndSilverCoins = updatedUser.silverCoins.reduce((sum, coin) => sum + (coin.coins || 0), 0);
      const callUpdateData = {
        end: currentTime,
        tutorEndGoldCoin: updatedTutor.coins,
        studentEndGoldCoin: updatedUser.coins || 0,
        studentEndSilverCoin: userEndSilverCoins,
        tutorEndSilverCoin: updatedTutor.silverCoins,
        charge: (call && startLog.connection) ? totalCharge : 0, // Charge only if connected
        action: action,
      };

      if (action === 2) {
        callUpdateData.start = currentTime;
        callUpdateData.connection = true; // Mark as connected on acceptance
        callUpdateData.charge = 0; // No charge yet
      }

      await CallLogs.findByIdAndUpdate(data._id, callUpdateData, { new: true, session });

      await session.commitTransaction();
      return { success: true, updatedUser, updatedTutor };

    } catch (err) {
      await session.abortTransaction();
      if (err.codeName === 'WriteConflict' && retries < MAX_RETRIES - 1) {
        console.log(`Write conflict detected, retrying (${retries + 1}/${MAX_RETRIES})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 100 * (retries + 1)));
        continue;
      }
      console.error("Error updating call timing:", err);
      throw err;
    } finally {
      session.endSession();
    }
  }
  throw new Error(`Max retries (${MAX_RETRIES}) exceeded for call ID: ${data._id}`);
};

exports.callDetails = async (req, res, next) => {
  console.log('call details');
  const { id, page = 1 } = req.params;
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const logs = await CallLogs.find({ userId: req.user._id })
      .populate({
        path: "secUserId",
        model: Tutors,
        select: "name",
      })
      .sort({ start: -1 })
      .skip(skip)
      .limit(limit);

    if (logs.length > 0) {
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
  const page = req.params.page || 1;
  const limit = 100;
  const skip = (page - 1) * limit;

  try {
    const logs = await CallLogs.find({ secUserId: req.user._id })
      .populate({
        path: "userId",
        model: User,
        select: "name",
      })
      .sort({ start: -1 })
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
    const limit = 50;
    const skip = (page - 1) * limit;

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



// --------web app controllerd -----------
exports.createCall = async(req, res, next)=>{
  const {agoraToken, channel, tid} = req.body;
  try{
    const message = {
      eventType : 1,
      data : {agoraToken, channel, tid}
    }
    sendXmppMessage(`${tid}@localhost`, message)
    return res.status(200).json({message : 'informed to tutor'})
  }catch(e){
    console.error('error in creating call', e)
    next(e)
  }
}

exports.endCall = async(req, res, next)=>{
 
  const {tid, eventType} = req.body;
  try{
    const message = {
      eventType 
    }
    
    await sendXmppMessage(`${tid}@localhost`, message)
    return res.status(200).json({message : 'informed to student'})
  }catch(e){
    console.error('Error in ending call', e)
    next(e)
  }
}