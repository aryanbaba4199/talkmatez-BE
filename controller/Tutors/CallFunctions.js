const mongoose = require("mongoose");
const User = require("../../models/users/users");
const Tutor = require("../../models/Tutors/tutors");
const Call = require("../../models/users/calllogs");

const MAX_RETRIES = 3;

exports.startTime = async (userId, tutorId, action) => {
  console.log("Start time function called with:", { userId, tutorId, action });

  try {
    const [user, tutor] = await Promise.all([
      User.findById(userId),
      Tutor.findById(tutorId),
    ]);

    if (!user || !tutor) {
      console.error("User or Tutor not found:", { userId, tutorId });
      throw new Error("User or Tutor not found");
    }

    const totalSilverCoins = Array.isArray(user.silverCoins)
      ? user.silverCoins.reduce((sum, coin) => sum + (coin.coins || 0), 0)
      : 0;
    const freeMinutes =
      tutor.rate > 0 ? Math.floor(totalSilverCoins / tutor.rate) : 0;

    const formData = {
      initiated: new Date().toISOString(),
      start: new Date().toISOString(),
      end: "0", // Set end as string '0' per schema
      userId: user._id.toString(),
      userCustomId: user.uid || "",
      tutorCustomId: tutor.loginId || "",
      umobile: user.mobile || "",
      secUserId: tutor._id.toString(),
      studentStartGoldCoin: user.coins || 0,
      studentStartSilverCoin: totalSilverCoins,
      freeMinutes,
      tutorStartGoldCoin: tutor.coins || 0,
      tutorStartSilverCoin: tutor.silverCoins || 0,
      action: action.toString(),
      charge: 0,
      connection: false,
    };

    const call = await Call.create(formData);
    console.log(
      "Call log created successfully:",
      call._id,
      "start:",
      call.start
    );
    return call;
  } catch (error) {
    console.error("Error in startTime:", error);
    throw error;
  }
};

exports.updateCallTiming = async (callId, userId, action) => {
  if (!callId || !userId) {
    console.error("Missing callId or userId:", { callId, userId });
    return;
  }

  const validActions = [1, 2, 3, 4, 5, 6, 7, 8, 10];
  if (!validActions.includes(action)) {
    console.error(`Invalid action: ${action}`);
    throw new Error(`Invalid action: ${action}`);
  }

  const session = await mongoose.startSession();
  let retries = 0;

  try {
    const callLog = await Call.findById(callId);
    if (!callLog) {
      console.error(`No call log found for ID: ${callId}`);
      throw new Error("Call log not found");
    }
    console.log("Call log found:", {
      callId,
      start: callLog.start,
      connection: callLog.connection,
      action: callLog.action,
      charge: callLog.charge,
    });

    while (retries < MAX_RETRIES) {
      try {
        session.startTransaction();

        const currentTime = new Date().toISOString();
        const startLog = await Call.findById(callId).session(session);
        if (!startLog) {
          await session.abortTransaction();
          throw new Error("Call log not found");
        }

        if (startLog.charge !== 0 && [5, 6, 7, 8].includes(action)) {
          console.log(`Charges already applied for call ID: ${callId}`);
          await session.commitTransaction();
          return { success: true, message: "Charges already applied" };
        }

        const [tutor, user] = await Promise.all([
          Tutor.findById(startLog.secUserId).session(session),
          User.findById(startLog.userId).session(session),
        ]);
        if (!tutor || !user) {
          await session.abortTransaction();
          throw new Error("Tutor or User not found");
        }

        let callUpdateData = { action: action.toString() };
        let updatedUser = user;
        let updatedTutor = tutor;

        // Handle tutor rank update and connection for action === 2 (call accepted)
        if (action === 2) {
          const newRankTutor = await Tutor.findOne({
            rank: tutor.rank + 1,
          }).session(session);
          if (newRankTutor) {
            await Promise.all([
              Tutor.findByIdAndUpdate(
                tutor._id,
                { rank: newRankTutor.rank },
                { session }
              ),
              Tutor.findByIdAndUpdate(
                newRankTutor._id,
                { rank: tutor.rank },
                { session }
              ),
            ]);
            console.log(
              `Rank swapped for tutor ${tutor._id}: ${tutor.rank} <-> ${newRankTutor.rank}`
            );
          } else {
            await Tutor.findByIdAndUpdate(
              tutor._id,
              { rank: tutor.rank + 1 },
              { session }
            );
            console.log(
              `Rank incremented for tutor ${tutor._id}: ${tutor.rank} -> ${
                tutor.rank + 1
              }`
            );
          }
          updatedTutor = await Tutor.findById(tutor._id).session(session);
          callUpdateData = {
            ...callUpdateData,
            connection: true,
            end : Date.now().toString(),
            charge: 0,
          };
          console.log(
            `Action 2 processed: callId=${callId}, connection set to true`
          );
        }
        // Handle coin deductions and end time for actions 5, 6, 7, 8
        else if (startLog.connection && [5, 6, 7, 8].includes(action)) {
          const startTime = new Date(startLog.start);
          if (isNaN(startTime.getTime())) {
            await session.abortTransaction();
            throw new Error(
              `Invalid start time in call log: ${startLog.start}`
            );
          }
          const callDuration = (Date.now() - startTime.getTime()) / 1000;
          if (callDuration <= 0) {
            console.warn(
              `Zero or negative call duration: ${callDuration}s for callId: ${callId}, start: ${startLog.start}`
            );
          }
          const coinDuration = Math.max(1, Math.ceil(callDuration / 60)); // Ensure at least 1 minute
          const totalCharge = tutor.rate * coinDuration;

          if (totalCharge > 0) {
            let remainingDeduction = totalCharge;
            let usedSilverCoins = 0;
            let updatedSilverCoins = Array.isArray(user.silverCoins)
              ? [...user.silverCoins].sort(
                  (a, b) => new Date(a.time) - new Date(b.time)
                )
              : [];

            for (
              let i = 0;
              i < updatedSilverCoins.length && remainingDeduction > 0;
              i++
            ) {
              const silverCoinEntry = updatedSilverCoins[i];
              if (silverCoinEntry.coins >= remainingDeduction) {
                silverCoinEntry.coins -= remainingDeduction;
                usedSilverCoins += remainingDeduction;
                remainingDeduction = 0;
              } else {
                usedSilverCoins += silverCoinEntry.coins;
                remainingDeduction -= silverCoinEntry.coins;
                silverCoinEntry.coins = 0;
              }
            }
            updatedSilverCoins = updatedSilverCoins.filter(
              (coin) => coin.coins > 0
            );
            const usedGoldCoins = remainingDeduction;

            [updatedUser, updatedTutor] = await Promise.all([
              User.findByIdAndUpdate(
                startLog.userId,
                {
                  $set: { silverCoins: updatedSilverCoins },
                  $inc: { coins: -usedGoldCoins },
                },
                { new: true, session }
              ),
              Tutor.findByIdAndUpdate(
                startLog.secUserId,
                {
                  $inc: { coins: usedGoldCoins, silverCoins: usedSilverCoins },
                },
                { new: true, session }
              ),
            ]);

            console.log(
              `Call ended: callId=${callId}, action=${action}, duration=${callDuration}s, charge=${totalCharge}`
            );
            console.log(
              `Coins Deducted - User Gold: ${usedGoldCoins}, Silver: ${usedSilverCoins}`
            );
            console.log(
              `Coins Credited - Tutor Gold: ${usedGoldCoins}, Silver: ${usedSilverCoins}`
            );
          }

          callUpdateData = {
            ...callUpdateData,
            end: currentTime, // Set end time to current time
            tutorEndGoldCoin: updatedTutor.coins || 0,
            studentEndGoldCoin: updatedUser.coins || 0,
            srudentEndSilverCoins:
              updatedUser.silverCoins.reduce(
                (sum, coin) => sum + (coin.coins || 0),
                0
              ) || 0, // Keep typo as per schema
            tutorEndSilverCoin: updatedTutor.silverCoins || 0,
            charge: totalCharge,
          };
          console.log(
            `Action ${action} processed作品: callId=${callId}, end time set, coins updated`
          );
        }
        // Set end time for actions 3 and 4 (call declined or no answer)
        else if ([3, 4].includes(action)) {
          callUpdateData = {
            ...callUpdateData,
            end: currentTime,
          };
          zadaniaTime = currentTime;
          console.log(
            `Action ${action} processed: callId=${callId}, end time set to ${currentTime}`
          );
        } else {
          console.log(
            `No charge or end time update applied: connection=${startLog.connection}, action=${action}`
          );
        }

        const updatedCall = await Call.findByIdAndUpdate(
          callId,
          callUpdateData,
          { new: true, session }
        );
        console.log("Call log updated:", {
          callId,
          action,
          connection: updatedCall.connection,
          start: updatedCall.start,
          end: updatedCall.end,
          charge: updatedCall.charge,
        });
        await session.commitTransaction();
        return { success: true, updatedUser, updatedTutor };
      } catch (err) {
        await session.abortTransaction();
        if (err.codeName === "WriteConflict" && retries < MAX_RETRIES - 1) {
          console.warn(
            `Write conflict detected for callId: ${callId}, retrying (${
              retries + 1
            }/${MAX_RETRIES})`
          );
          retries++;
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * (retries + 1))
          );
          continue;
        }
        console.error("Error updating call timing:", err);
        throw err;
      }
    }
    throw new Error(
      `Max retries (${MAX_RETRIES}) exceeded for call ID: ${callId}`
    );
  } catch (error) {
    console.error("Error in updateCallTiming:", error);
    throw error;
  } finally {
    session.endSession();
  }
};
