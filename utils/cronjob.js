const cron = require("node-cron");
const mongoose = require("mongoose");
const User = require("../models/users/users");

// Function to allocate daily coins
const allocateDailyCoins = async () => {
  console.log("🚀 Running daily coin allocation job...");

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight

  try {
    // Fetch users who have silver coins with type "welcome_bonus"
    const users = await User.find({ "silverCoins.type": "welcome_bonus" });
    console.log(`🔍 Found ${users.length} users with welcome_bonus coins.`);

    for (let user of users) {
      console.log(`➡️ Processing user: ${user._id}`);

      // Remove expired silver coins
      user.silverCoins = user.silverCoins.filter((coin) => {
        const expiryDate = new Date(coin.time);
        expiryDate.setDate(expiryDate.getDate() + (coin.expiry || 1));
        return expiryDate > today;
      });

      // Check if the user is eligible for another daily bonus
      const firstCoinDate = new Date(user.silverCoins[0]?.time || today);
      console.log(`📅 First Coin Date: ${firstCoinDate}`);

      const daysPassed = Math.floor(
        (today - firstCoinDate) / (1000 * 60 * 60 * 24)
      );
      console.log(`⏳ Days Passed: ${daysPassed}`);

      if (user.silverCoinExpiry && daysPassed < user.silverCoinExpiry) {
        user.silverCoins.push({
          type: "welcome_bonus",
          coins: 100, // Adjust as needed
          expiry: 1, // Expires in 1 day
          time: today,
          pkgId: null, // Avoid CastError by setting it to null
        });

        console.log(
          "✅ Added New Coins:",
          JSON.stringify(user.silverCoins, null, 2)
        );

        await user.save();
        console.log(`💾 User ${user._id} saved successfully.`);
      } else {
        console.log(`⛔ No new coins added for user ${user._id}`);
      }
    }

    console.log("✅ Daily coin allocation completed.");
  } catch (error) {
    console.error("❌ Error in daily coin allocation:", error);
  }
};

// **🔥 Trigger Immediately for Testing**
(async () => {
  console.log("🚀 Manually triggering daily coin allocation for testing...");
  await allocateDailyCoins();
})();

// **⏰ Schedule to Run Every Midnight**
cron.schedule("0 0 * * *", async () => {
  console.log("🕛 Running scheduled cron job at midnight...");
  await allocateDailyCoins();
});

module.exports = { allocateDailyCoins };
