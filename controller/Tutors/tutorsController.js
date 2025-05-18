const Tutors = require("../../models/Tutors/tutors");
const CallLogs = require("../../models/users/calllogs");
const Call = require("../../models/users/calllogs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { registeronxmpp, getxmppusers, sendXmppMessage, broadcastMessage } = require("../xmpp");
require("dotenv").config();

const jwtKey = process.env.JWT_SECRET;

exports.createTutor = async (req, res, next) => {
  const formData = req.body;

  try {
    const existingId = await Tutors.findOne({ loginId: formData.loginId });
    const existingEmail = await Tutors.findOne({ email: formData.email });

    if (existingId) {
      return res.status(300).json({ message: "ID Already Exists" });
    } else if (existingEmail) {
      return res.status(300).json({ message: "Email Already Exists" });
    }
    await Tutors.updateMany({}, { $inc: { rank: 1 } });
    const tutor = new Tutors(formData);
    await tutor.save();
    res.status(200).json({ message: "Tutor Created Successfully" });
  } catch (e) {
    if (e.code === 11000) {
      const duplicatedField = Object.keys(e.keyPattern)[0];
      return res
        .status(400)
        .json({ message: `${duplicatedField} already exists` });
    }
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTutors = async (req, res, next) => {
  try {
    // const tutors = await Tutors.find();
    // if (tutors) {
    //   res.status(200).json(tutors);
    // } else {
    //   res.status(404).json({ message: "tutorial not found" });
    // }
    const tutors = await Tutors.aggregate([
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "available"] }, then: 1 },
                { case: { $eq: ["$status", "busy"] }, then: 2 },
                { case: { $eq: ["$status", "offline"] }, then: 3 },
              ],
              default: 4,
            },
          },
        },
      },
      {
        $sort: { statusOrder: 1 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          qualification: 1,
          image: 1,
          primaryLanguage: 1,
          secondryLanguage: 1,
          status: 1,
          tutorType: 1,
          rating: 1,
          rate: 1,
        },
      },
    ]);
    return res.status(200).json(tutors);
  } catch (e) {
    console.log(e);
    next(e);
  }
};
exports.getTutorsList = async (req, res, next) => {
  try {
    // Fetch all tutors grouped by status
    const availableTutors = await Tutors.find({ status: "available" }).sort({
      rank: 1,
    }); // Sort by rank ascending
    const busyTutors = await Tutors.find({ status: "busy" });
    const offlineTutors = await Tutors.find({ status: "offline" });

    if (availableTutors || busyTutors || offlineTutors) {
      res.status(200).json({
        availableTutors,
        busyTutors,
        offlineTutors,
      });
    } else {
      res.status(404).json({ message: "No tutors found" });
    }
  } catch (e) {
    console.error("Error fetching tutors:", e);
    next(e);
  }
};

exports.updateTutor = async (req, res, next) => {
  const { formData } = req.body;
  console.log(formData);
  try {
    const tutor = await Tutors.findByIdAndUpdate(formData._id, formData, {
      new: true,
      runValidators: true,
    });
    if (!tutor) {
      return res.status(404).send({ message: "Tutor not found" });
    }
    return res.status(200).json(tutor);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.updateRating = async (req, res) => {
  const { id } = req.params;
  const formData = req.body;

  try {
    const tutor = await Tutors.findById(id);
    if (!tutor) {
      console.log("Tutor not found");
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.rating) {
      tutor.rating = [];
    }
    const existingRatingIndex = tutor.rating.findIndex(
      (r) => r?.userId === formData.userId
    );

    if (existingRatingIndex !== -1) {
      tutor.rating[existingRatingIndex] = formData;
    } else {
      tutor.rating.push(formData);
    }
    await tutor.save();

    res.status(200).json({
      message: "Rating updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.login = async (req, res, next) => {
  const { loginId, password } = req.body;

  try {
    const tutor = await Tutors.findOne({ loginId });

    if (!tutor || password !== tutor.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const tutorData = {
      ...tutor.toObject(),
      client: undefined,
    };

    // Generate token
    const token = jwt.sign(
      { userId: tutor._id.toString() },
      jwtKey,
      { expiresIn: `${24 * 30}h` }
    );

    // Check XMPP registration
    const xres = await getxmppusers();
    if (!xres.success) {
      return res.status(500).json({ message: "Failed to fetch XMPP users" });
    }

    const xmppUsers = xres.data;
    const userIdStr = tutor._id.toString();

    if (!xmppUsers.includes(userIdStr)) {
      const isreg = await registeronxmpp("register", {
        user: userIdStr,
        password: tutor.email, // ⚠️ You might want to use a secure random password instead
      });

      if (!isreg.registered) {
        return res.status(500).json({ message: "Failed to register on XMPP" });
      }

      console.log("✅ Registered on XMPP:", userIdStr);
    } else {
      console.log("🟢 Already registered on XMPP:", userIdStr);
    }

    return res.status(200).json({ token, tutorData });

  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.updateToken = async (req, res, next) => {
  const { token, tutorId } = req.body;
  console.log("tutor Id is ", tutorId, token);
  if (!tutorId) {
    return res.status(400).json({ message: "Token and tutorId are required" });
  }

  try {
    const updatedTutor = await Tutors.findOneAndUpdate(
      { _id: tutorId },
      { fcmToken: token },
      { new: true }
    );

    if (!updatedTutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    res.status(200).json({ message: "Token updated successfully" });
  } catch (error) {
    console.error("Error updating token:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTutor = async (req, res) => {
  try {
    const tutor = await Tutors.findById(req.user._id);
    if (tutor) {
      res.status(200).json(tutor);
    } else {
      res.status(404).json({ message: "Tutor not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: " Server error" });
  }
};

exports.dashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const call = await CallLogs.find({ secUserId: userId });

    const data = {
      totalCall: call.length,
      acceptedCall: call.filter(
        (c) => c.connection === true && parseInt(c.action) !== 6
      ).length,
      declinedCall: call.filter((c) => parseInt(c.action) === 1).length,
      disconnectedCall: call.filter((c) => parseInt(c.action) === 6).length,
      missedCall: call.filter(
        (c) => c.connection === false && parseInt(c.action) !== 1
      ).length,
    };
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: " Server error" });
  }
};

exports.getMissedCalls = async (req, res, next) => {
  const { id } = req.params;
  try {
    const missedCalls = await CallLogs.find({
      secUserId: id,
      connection: false,
      action: { $ne: 1 },
    });
    res.status(200).json(missedCalls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getReceivedCalls = async (req, res, next) => {
  const { id } = req.params;
  try {
    const receivedCalls = await CallLogs.find({
      secUserId: id,
      connection: true,
      action: { $ne: 6 },
    });
    res.status(200).json(receivedCalls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRejectedCalls = async (req, res, next) => {
  const { id } = req.params;
  try {
    const rejectedCalls = await CallLogs.find({
      secUserId: id,
      action: 1,
    });
    res.status(200).json(rejectedCalls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDisconnectedCalls = async (req, res, next) => {
  const { id } = req.params;
  try {
    const acceptedCalls = await CallLogs.find({
      secUserId: id,
      connection: true,
      action: { $ne: 6 },
    });
    res.status(200).json(acceptedCalls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateFirstTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedTutor = await Tutors.findByIdAndUpdate(
      { _id: id },
      { firstTime: false },
      { new: true }
    );
    console.log("tutor updated");
    if (!updatedTutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    res.status(200).json({ message: "First time updated successfully" });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.xendCall = async(req, res, next)=>{
  try{
    const {userId, eventType, tutorId} = req.body;
    const message = {
      eventType : eventType
    }
    await sendXmppMessage(userId, message)
    await updateTutorStatus(tutorId, 'available')
    await broadcastMessage(10, tutorId, 'available')
    return res.status(200).json({message : 'Informed student about call end'})
  }catch(e){
    console.error('Error in xendCall', e)
  }
}

const updateTutorStatus = async (tid, status) => {
  console.log('Updating tutor', tid, 'to', status);
  try {
    await Tutors.findByIdAndUpdate(tid, { status }, { new: true });
    return true;
  } catch (e) {
    console.error('Tutor update error:', e.message);
    return false;
  }
};
