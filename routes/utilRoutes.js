const express = require("express");
const { allocateDailyCoins } = require("../utils/cronjob");

const router = express.Router();

router.get("/test", async (req, res) => {
    try {
        await allocateDailyCoins();
        res.json({ message: "Daily coins allocated successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
