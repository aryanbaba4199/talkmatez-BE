const Tutors = require("../../models/Tutors/tutors");
const jwt = require("jsonwebtoken");
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

    const tutor = new Tutors(formData);
    await tutor.save();
    res.status(200).json({ message: "Tutor Created Successfully" });

  } catch (e) {
    if (e.code === 11000) {
      const duplicatedField = Object.keys(e.keyPattern)[0];
      return res.status(400).json({ message: `${duplicatedField} already exists` });
    }
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getTutors = async (req, res, next) => {
  try {
    const tutors = await Tutors.find();
    if (tutors) {
      res.status(200).json(tutors);
    } else {
      res.status(404).json({ message: "tutorial not found" });
    }
  } catch (e) {
    console.log(e);
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

exports.login = async (req, res, next) => {
  console.log("called");
  const { id } = req.params;
  console.log("id received", id);
  try {
    const tutor = await Tutors.findOne({ tutorId: id });

    if (tutor) {
      // Exclude circular references from the tutor object
      const tutorData = {
        ...tutor.toObject(),
        client: undefined, // Exclude the circular reference (if applicable)
      };

      const token = jwt.sign(
        {
          userId: tutorData._id,
        },
        jwtKey,
        { expiresIn: `${24 * 30}h` }
      );

      res.status(200).json({ token, tutorData });
    } else {
      res.status(404).json({ message: "Tutor not found" });
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.updateToken = async (req, res, next) => {
  const { token, tutorId } = req.body; // Extract token and tutorId from request body
  console.log(token, tutorId);

  if (!token || !tutorId) {
    return res.status(400).json({ message: "Token and tutorId are required" });
  }

  try {
    // Update the fcmToken for the specified tutor
    const updatedTutor = await Tutors.findOneAndUpdate(
      { _id: tutorId }, // Find tutor by tutorId
      { fcmToken: token }, // Update the fcmToken field
      { new: true } // Return the updated document
    );

    if (!updatedTutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    console.log(`Token updated for tutor: ${tutorId}`);
    res.status(200).json({ message: "Token updated successfully" });
  } catch (error) {
    console.error("Error updating token:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTutor = async (req, res) => {
  try {
    console.log("id is  ");
    const { id } = req.params;

    const tutor = await Tutors.findById(id);
    console.log(`Token retrieved`, tutor);
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
