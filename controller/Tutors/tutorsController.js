const Tutors = require("../../models/Tutors/tutors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const jwtKey = process.env.JWT_SECRET;


exports.createTutor = async (req, res, next) => {
  const { formData } = req.body;
  const name = formData.name.split(' ')[0].slice(0, 8).toLowerCase();
  const randomDigit = Math.floor(Math.random() *10000).toString().padStart(4, '0');
  const tutorId = `${name}${randomDigit}`;
  const newFormData = {...formData, tutorId};
  try {
    const tutor = new Tutors(newFormData);
    await tutor.save();
    res.status(200).json({tutorId : tutor.tutorId});
  } catch (e) {
    console.log(e);
    next(e);
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
    const { id } = req.params;
  
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
        res.status(404).json({ message: 'Tutor not found' });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  };
