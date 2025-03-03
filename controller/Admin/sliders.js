const Slider = require('../../models/helpers/sliders');

exports.getSliders = async (req, res, next) => {
    try {
        const sliders = await Slider.find();
        res.status(200).json(sliders);
    } catch (err) {
        console.error(err);
        next(err);
    }
}
exports.createSlider = async (req, res, next) => {
    try {
        const { title, rank, image } = req.body;

        // Increase rank for all slides ranked >= the new rank
        await Slider.updateMany(
            { rank: { $gte: rank } },
            { $inc: { rank: 1 } }
        );

        // Create new slide at intended rank
        const newSlider = await Slider.create({ title, rank, image });

        res.status(200).json(newSlider);
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.updateSlider = async (req, res, next) => {
    try {
        const { title, rank, image, _id } = req.body;

        // Fetch current object
        const existingSlider = await Slider.findById(_id);
        if (!existingSlider) {
            return res.status(404).json({ message: "Slider not found" });
        }

        const oldRank = existingSlider.rank;

        // If rank is changed
        if (oldRank !== rank) {
            if (oldRank < rank) {
                // Moving down: shift slides ranked between oldRank and newRank UP (-1)
                await Slider.updateMany(
                    { rank: { $gt: oldRank, $lte: rank } },
                    { $inc: { rank: -1 } }
                );
            } else {
                // Moving up: shift slides ranked between newRank and oldRank DOWN (+1)
                await Slider.updateMany(
                    { rank: { $gte: rank, $lt: oldRank } },
                    { $inc: { rank: 1 } }
                );
            }
        }

        // Update the slide's rank & data
        const updatedSlider = await Slider.findByIdAndUpdate(
            _id,
            { title, rank, image },
            { new: true }
        );

        res.status(200).json(updatedSlider);
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.deleteSlider = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Slider.findByIdAndDelete(id);
        res.status(200).json({ message: 'Slider deleted successfully' });
    } catch (err) {
        console.error(err);
        next(err);
    }
}