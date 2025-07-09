const Notification = require("../../models/users/notification");
const WelcomePackage = require("../../models/helpers/welcome");

const Tutors = require("../../models/Tutors/tutors");
const User = require("../../models/users/users");
const Transaction = require("../../models/users/txn");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const axios = require("axios");
const { getxmppusers, registeronxmpp } = require("../xmpp");
require("dotenv").config();

const jwtKey = process.env.JWT_SECRET;

exports.getuserbyid = async (req, res, next) => {
  try {
    const user = req.user;
    
    console.log(user);
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
const generateRandomUsername = (name) => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
  return `${name}${randomNum}`; // Combines name and random number
};

exports.createUser = async (req, res, next) => {
  const  formData  = req.body;
  const user = generateRandomUsername(req.body.name);
  
  try {
    const existingUser = await User.findOne({ mobile: formData.mobile });

    if (existingUser) {
      const token = jwt.sign(
      {
        id: existingUser._id,
        mobile: existingUser.mobile,
      },
      jwtKey,
      { expiresIn: `${24 * 30}h` }
    );
      return res.status(201).json({ user: existingUser, token :  token });
    }

    const welcomePackage = await WelcomePackage.findOne();

    if (!welcomePackage || !welcomePackage._id) {
      return res
        .status(400)
        .json({ message: "No valid welcome package found" });
    }

    const dailyCoins = welcomePackage.coinValue / welcomePackage.expiry;

    // Ensure the silverCoins array contains the required `type` field
    formData.silverCoins = [
      {
        coins: dailyCoins,
        expiry: 1,
        time: Date.now(),
        pkgId: new mongoose.Types.ObjectId(welcomePackage._id),
        type: "welcome_bonus", // Ensure 'type' field is added
      },
    ];

    formData.silverCoinExpiry = welcomePackage.expiry;

    // Generate and assign a unique custom ID
    const customId = await generateCustomId();
    console.log("Generated UID:", customId);
    formData.uid = customId;

    const user = new User(formData);
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        mobile: user?.mobile,
      },
      jwtKey,
      { expiresIn: `${24 * 30 *12 }h` }
    );

    res.status(200).json({ token, user });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const generateCustomId = async () => {
  const lastUser = await User.findOne().sort({ uid: -1 }).lean();

  if (!lastUser || !lastUser.uid) {
    return "AAA0001"; // First user
  }

  let lastUid = lastUser.uid;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let letterPart = lastUid.slice(0, 3);
  let numberPart = parseInt(lastUid.slice(3), 10);

  if (numberPart < 9999) {
    numberPart++;
  } else {
    numberPart = 1;

    // Increment letter sequence
    let lastIndex =
      letters.indexOf(letterPart[2]) +
      letters.indexOf(letterPart[1]) * 26 +
      letters.indexOf(letterPart[0]) * 26 * 26;

    lastIndex++;

    if (lastIndex >= 26 * 26 * 26) {
      throw new Error("UID limit reached!"); // Handle max limit case
    }

    letterPart =
      letters[Math.floor(lastIndex / (26 * 26))] +
      letters[Math.floor((lastIndex % (26 * 26)) / 26)] +
      letters[lastIndex % 26];
  }

  return letterPart + String(numberPart).padStart(4, "0");
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(404).json({ message: "User not found" });
  }
};
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = req.user;
   

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    if (user) {
      res.status(200).json(user);
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.login = async (req, res, next) => {
  console.log("called", req.params);
  const { mobile } = req.params;
  console.log(mobile); // Debug log to check the mobile parameter
  try {
    const user = await User.findOne({ mobile });

    if (user === null) {
      res.status(250).json({ message: "User not in database" });
    } else {
      const token = jwt.sign(
          {
            id: user._id,
            mobile: user?.mobile,
          },
          jwtKey,
          { expiresIn: `${24 * 30*12}h` }
        );
        return res.status(200).json({ token, user });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
  }
};

exports.updateUser = async (req, res, next) => {
  const { formData } = req.body;

  try {
    const user = await User.findByIdAndUpdate(formData._id, formData, {
      new: true,
    });
    if (user) {
      res.status(200).json({ message: "success" });
    } else {
      res.status(404).json({ message: "Error updating user" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.updateCoins = async (req, res, next) => {
  const formData = req.body;

  console.log("form have coins", formData);

  try {
    const isUser = await User.findById(formData.userId);
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(formData.userId);
    const user = await User.findByIdAndUpdate(
      formData.userId,
      { coins: formData.coins + parseInt(isUser.coins) },
      { new: true }
    );
    console.log(user);
    const notificationData = {
      userId: formData.userId,
      title: "Coins Updated",
      message: `${formData.coins} added to your wallet`,
      icon: formData.coins > 0 ? "good" : "warning", // 'good' for adding coins, 'warning' for deductions
      read: false,
      priority: "high",
    };
    const notification = new Notification(notificationData);
    await notification.save();

    res.status(200).json(user);
  } catch (err) {
    console.error("Error updating coins:", err);
    res.status(500).json({ message: "Error updating coins" });
  }
};

exports.uNtDetails = async (req, res, next) => {
  const { userId, tutorId } = req.body;

  if (!userId && !tutorId) {
    return res.status(400).json({ message: "!userId or TutorId" });
  }
  try {
    const user = await User.findById({ _id: userId });
    const tutor = await Tutors.findById({ _id: tutorId });
    res.status(200).json({ user, tutor });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ time: -1 })
      .limit(100);
    res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.verifyTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findOne({ txnId: id });
    console.log("Found transaction", txn);
    if (txn) {
      res.status(200).json({ transaction: true, txn });
    } else {
      res.status(404).json({ transaction: false });
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.createTransaction = async (req, res, next) => {
  const formData = req.body;

  try {
    const txn = new Transaction(formData);
    await txn.save();
    res.status(200).json(txn._id);
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.updateTransaction = async (req, res, next) => {
  const formData = req.body;
  console.log("transaction form have", formData);
  try {
    if (formData.signature === "canceled") {
      return res.status(207).json({ message: "Payment was not done" });
    }
    let data;
    if (formData.txnId !== "null" && formData.status !== "success") {
      data = { ...formData, initialFetch: true };
    } else {
      data = formData;
    }
    const user = await User.findById(formData.userId);
    await User.findByIdAndUpdate(
      formData.userId,
      {
        coins: user.coins + formData.coins,
      },
      { new: true }
    );
    const txn = await Transaction.findByIdAndUpdate(formData._id, data, {
      new: true,
    });
    if (txn) {
      res.status(200).json({ message: "success" });
    } else {
      res.status(404).json({ message: "Error updating transaction" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.disableTxn = async (req, res) => {
  try {
    const { id } = req.params;
    const currTxn = await Transaction.findById(id);
    if (currTxn.retry < 5) {
      console.log("transaction verification count", currTxn.retry);
      return res.status(200).json({ message: currTxn.retry });
    } else {
      const txn = await Transaction.findByIdAndUpdate(
        id,
        { initialFetch: false },
        { new: true }
      );
      if (txn) {
        res.status(200).json({ message: "success" });
      } else {
        res.status(404).json({ message: "Error disabling transaction" });
      }
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: err.message });
  }
};

exports.pendingTxns = async (req, res) => {
  try {
    const { id } = req.params;

    const txns = await Transaction.find({
      userId: id,
      initialFetch: false,
      status: "success",
      txnId: { $ne: "canceled" },
    });

    console.log("Transactions are:", txns);
    res.status(200).json(txns);
  } catch (err) {
    console.error("Error fetching pending transactions:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getNotification = async (req, res) => {
  const { id } = req.params;
  console.log(req.params);
  if (!id) {
    return res.status(400).json({ message: "!userId" });
  }

  try {
    const notification = await Notification.find({ userId: id, read: false });
    res.status(200).json(notification);
  } catch (err) {
    console.error(err);
  }
};

exports.updateNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    res.status(200).json({ message: "success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.error(err);
  }
};

exports.createNotification = async (req, res) => {
  const formData = req.body;

  try {
    const notification = new Notification(formData);
    await notification.save();
    res.status(200).json({ message: "success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.error(err);
  }
};
