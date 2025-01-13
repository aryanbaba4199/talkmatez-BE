const PkgModel = require('../../models/helpers/packages');


exports.getPackages = async (req, res, next) => {
    try {
        const pkgData = await PkgModel.find();
        res.status(200).json(pkgData);
    } catch (err) {
        next(err);
    }
}

exports.createPackage = async (req, res, next) => {
    
    console.log('form have ', req.body);
    try {
        const pkgData = new PkgModel(req.body);
        await pkgData.save();
        res.status(200).json({message: 'Package created successfully'});
    } catch (err) {
        console.error(err);
        next(err);
    }
}


exports.updatePackage = async (req, res, next) => {
    const { _id } = req.body;
    try {
        const pkgData = await PkgModel.findByIdAndUpdate(_id, req.body, { new: true });
        if (pkgData) {
            res.status(200).json({ message: 'Package updated successfully' });
        }
    } catch (err) {
        next(err);
    }
};

exports.deletePackages = async (req, res, next) => {
    const { id } = req.params;
    console.log('id is ', id);
    try {
        const pkgData = await PkgModel.findByIdAndDelete(id);
        if (pkgData) {
            res.status(200).json({ message: 'Package deleted successfully' });
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
}