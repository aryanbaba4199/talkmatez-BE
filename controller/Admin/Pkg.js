const PkgModel = require("../../models/helpers/packages");
const WelcomePackage = require("../../models/helpers/welcome");
const Transaction = require("../../models/users/txn")

exports.getPackages = async (req, res, next) => {
  try {
    const pkgData = await PkgModel.find();
    res.status(200).json(pkgData);
  } catch (err) {
    next(err);
  }
};

exports.getaPackage = async(req, res, next) => {
  try{
    const pkg = await PkgModel.findById(req.params.id);
    res.status(200).json(pkg);
  }catch(err){
    console.error(err);
    next(err);
  }
}

exports.getWelPkg = async (req, res, next) => {
  try {
    const welData = await WelcomePackage.findOne();
    res.status(200).json(welData);
  } catch (err) {
    console.error("Error in getting weilcome package", err);
    next(err);
  }
};

exports.createPackage = async (req, res, next) => {
  console.log("form have ", req.body);
  try {
    const pkgData = new PkgModel(req.body);
    await pkgData.save();
    res.status(200).json({ message: "Package created successfully" });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.createWelPkg = async (req, res, next) => {
  try {
    const wel = new WelcomePackage(req.body);
    await wel.save();
    res.status(200).json({ message: "Welcome package created successfully" });
  } catch (err) {
    console.error("error in creating welcome package ", err);
    next(err);
  }
};

exports.updatePackage = async (req, res, next) => {
  console.log("updatePackage", req.body);
  const { _id } = req.body;
  try {
    const pkgData = await WelcomePackage.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    if (pkgData) {
      res.status(200).json({ message: "Package updated successfully" });
    } else {
      res.status(404).json({ message: "Package not found" });
    }
  } catch (err) {
    next(err);
  }
};
exports.updateWelPkg = async (req, res, next) => {
  const { _id } = req.body;
  try {
    const wel = await WelcomePackage.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    if (wel) {
      res.status(200).json({ message: "Welcome package updated successfully" });
    }
  } catch (err) {
    console.error("error in updating welcome package ", err);
    next(err);
  }
};

exports.deletePackages = async (req, res, next) => {
  const { id } = req.params;
  console.log("id is ", id);
  try {
    const pkgData = await PkgModel.findByIdAndDelete(id);
    if (pkgData) {
      res.status(200).json({ message: "Package deleted successfully" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};


exports.getTransaction = async (req, res, next) => {
  console.log('called');

  try {
    const page = parseInt(req.params.page) || 1;
    const skip = (page - 1) * 50; 
    const transactions = await Transaction.find({})
      .sort({ time: -1 })
      .skip(skip)
      .limit(50);

  
    const totalTransactions = await Transaction.countDocuments();
    res.status(200).json({
      transactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / 50),
      totalTransactions
    });
  } catch (e) {
    console.error('Error in getting transactions', e);
    next(e);
  }
};


exports.getTransctionById = async(req, res, next)=>{
  const {id} = req.params;
  try{
    const transaction = await Transaction.findOne({txnId : id});
    if(!transaction){
      return res.status(404).json({message: "Transaction not found"});
    }
    return res.status(200).json(transaction);
  }catch(e){
    console.error('Error in getting transaction by id', e);
    next(e);
  }
}