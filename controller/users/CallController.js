const User = require("../../models/users/users");
const CallLogs = require("../../models/users/calllogs");
const axios = require("axios");
const Tutor = require("../../models/Tutors/tutors");
const Tutors = require("../../models/Tutors/tutors");

exports.CallTiming = async (req, res, next) => {
  const formData = req.body;
  console.log("formData", req.body);
  if (!formData) {
    return res.status(400);
  }

  try {
    // Fetch the current time from the API
    const timeRes = await axios.get(
      "https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata"
    );
    const currentTime = timeRes.data.dateTime;

    const call = new CallLogs({ ...formData, start: currentTime });
    await call.save();

    res.status(200).json(call);
  } catch (err) {
    console.log("Error fetching time:", err);
    next(err);
  }
};

exports.updateCallTiming = async (req, res, next) => {
  const { data } = req.body;

  if (!data) {
    console.log("no data found");
    return res.status(400).json({ message: "No data found in request body" });
  }
  console.log('in data', data);

  try {
    const timeRes = await axios.get(
      "https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata"
    );
    const currentTime = timeRes.data.dateTime;

    const startTime = data.startTime.start;
    const callDuration = (new Date(currentTime) - new Date(startTime)) / 1000; // duration in seconds

    // Fetch tutor and user by ID to get their current coins and balance
    const tutor = await Tutors.findById(data.startTime.secUserId);
    const user = await User.findById(data.startTime.userId);

    console.log(tutor, user)
    const updatedTutor = await Tutors.findByIdAndUpdate(
      data.startTime.secUserId,
      { coins: Math.round(tutor.coins + callDuration) },
      { new: true }
    );

    const updatedUser = await User.findByIdAndUpdate(
      data.startTime.userId,
      { coins: Math.round(user.coins - callDuration) },
      { new: true }
    );

    const updatedCall = await CallLogs.findByIdAndUpdate(
      data.startTime._id,
      {
        end: currentTime,
        tutorEndCoin: updatedTutor.coins,
        studentEndCoin: updatedUser.coins,
      },
      { new: true }
    );

    console.log(updatedCall);

    res.status(200).json(updatedCall);
  } catch (err) {
    console.log("Error updating call timing:", err);
    next(err);
  }
};

exports.callDetails = async (req, res, next) => {
  const { id } = req.params;
  try {
    const logs = await CallLogs.find({ userId: id }).populate({
      path: "secUserId",
      model: Tutor,
      select: "name",
    });

    if (logs.length > 0) {
      const callDetails = logs.map((log) => ({
        tutorName: log.secUserId ? log.secUserId.name : "Unknown Tutor",
        start: log.start,
        end: log.end,
      }));

      return res.status(200).json({ callDetails });
    } else {
      return res
        .status(404)
        .json({ message: "No call logs found for this user" });
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
