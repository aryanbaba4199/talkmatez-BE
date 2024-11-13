// socketHandlers.js
const admin = require("firebase-admin");
const Tutors = require("../models/Tutors/tutors");
const User = require("../models/users/users");
const {
  CallTiming,
  updateCallTiming,
} = require("../controller/users/CallController");

const tutorSocketMap = {};
const userSocketMap = {};
const CallIds = {};
const activeCalls= {};
const tutoronCall = {};
const studentOnCall = {};

async function getTutorFcmToken(tutorId) {
  const tutor = await Tutors.findOne({ _id: tutorId });
  return tutor ? tutor.fcmToken : null;
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Register tutor with socket ID
    socket.on("register_tutor", ({ tutorId }) => {
      console.log("Register tutor socketid: ", socket.id);

      if (tutorId) {
        tutorSocketMap[tutorId] = socket.id;
        socket.broadcast.emit("available", tutorId);
        updateTutor(tutorId, "available");
      }
    });

    // Register user with socket ID
    socket.on("register_user", ({ userId }) => {
      console.log("Registerer user socketid: ", socket.id);
      if (userId) {
        userSocketMap[userId] = socket.id;
      }
    });

    // Start a call
    socket.on("start_call", async ({ data }) => {
      if (!data) {
        return;
      }
      const tutorSocketId = tutorSocketMap[data.tutorId];
      if (tutorSocketId) {
        
        socket.to(tutorSocketId).emit("call_started", data);
        handleOnCalls(data);
        socket.broadcast.emit("busy", data.tutorId);
        
        updateTutor(data.tutorId, "busy");
      } else {
        const userSocketId = userSocketMap[data.userId];
        console.log(userSocketId);
        if (userSocketId) {
          console.log("network failed to connect");
          socket.to(userSocketId).emit("network_error");
        }

        const tutorFcmToken = await getTutorFcmToken(data.tutorId);

        // if (tutorFcmToken) {

        //   const message = {
        //     token: tutorFcmToken,
        //     notification: {
        //       title: "Incoming Call",
        //       body: `You have an incoming call from ${data.userId}`,
        //     },
        //     data: {
        //       agoraToken: `${data?.agoraToken}`,
        //       channelName: `${data?.channelName}`,
        //       userId: `${data?.userId}`,
        //     },
        //   };

        //   try {
        //     await admin.messaging().send(message);

        //   } catch (error) {
        //     console.error("Error sending FCM notification:", error);
        //   }
        // } else {
        //   console.error(`No FCM token found for tutor ${data.tutorId}`);
        // }
      }
    });

    // End a call
    socket.on("end_call", (data) => {
      handleEndCalls(data);
      updateTime(data.userId);
      socket.broadcast.emit("available", data?.tutorId);
      io.to(tutorSocketMap[data.tutorId]).emit("call_ended");
      updateTutor(data.tutorId, "available");
      const tutorSocketId = tutorSocketMap[data.tutorId];
      if (tutorSocketId) {
        io.to(tutorSocketId).emit("call_ended", data);
      }
    });

    // Decline a call
    socket.on("decline_call", ({ data }) => {
      handleEndCalls(data);
      socket.broadcast.emit("available", data.tutorId);
      updateTutor(data.tutorId, "available");
      const userSocketId = userSocketMap[data.userId];
      if (userSocketId) {
        io.to(userSocketId).emit("call_declined", data);
      }
    });

    socket.on("tutor_end", (data) => {
      handleEndCalls(data);
      const userSocketId = userSocketMap[data.userId];
      socket.broadcast.emit("available", data.tutorId);
      
      updateTutor(data.tutorId, "available");
      updateTime(data.userId);
      if (userSocketId) {
        io.to(userSocketId).emit("tutor_end_the_call");
      }
    });

    socket.on("call_accepted", (data) => {
      startTime(data);
      const userSocketId = userSocketMap[data?.userId];
      if (userSocketId) {
        io.to(userSocketId).emit("call_accepted");
      }
    });

    // Handle disconnection
    // Handle disconnection
    socket.on("disconnect", () => {
      // Check if a tutor disconnected
      for (let tutorId in tutorSocketMap) {
        if (tutorSocketMap[tutorId] === socket.id) {
          delete tutorSocketMap[tutorId];
          console.log(`Tutor ${tutorId} disconnected.`);
    
          // Check for active call
          const activeCall = activeCalls[tutorId];
          if (activeCall) {
            const studentSocketId = activeCall.studentSocketId;
            if (studentSocketId) {
              updateTime(activeCall.userId)
              io.to(studentSocketId).emit("call_ended_due_to_disconnect", {
                message: "The tutor has disconnected. The call has ended.",
              });
            }
            handleEndCalls({ tutorId, userId: activeCall.userId });
          }
    
          socket.broadcast.emit("offline", tutorId);
          updateTutor(tutorId, "offline");
        }
      }
    
      // Check if a student disconnected
      for (let userId in userSocketMap) {
        if (userSocketMap[userId] === socket.id) {
          delete userSocketMap[userId];
          console.log(`User ${userId} disconnected.`);
    
          // Find if this student is in an active call
          const tutorId = Object.keys(activeCalls).find(
            (tid) => activeCalls[tid].userId === userId
          );
          if (tutorId) {
            updateTime(userId);
            const tutorSocketId = activeCalls[tutorId].tutorSocketId;
            if (tutorSocketId) {
              io.to(tutorSocketId).emit("call_ended_due_to_disconnect", {
                message: "The student has disconnected. The call has ended.",
              });
              socket.broadcast.emit("available", tutorId);
              updateTutor(tutorId, 'available');
            }
            handleEndCalls({ tutorId, userId });
          }
        }
      }
    });

    
    
  });
};

const updateTutor = async (id, status) => {
  try {
    const x = await Tutors.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );
  } catch (e) {
    console.log("error updating", e);
  }
};

const startTime = async (data) => {
  try {
    const userId = data.userId;
    const tutorId = data.tutorId;

    const tutor = await Tutors.findById(tutorId);
    const user = await User.findById(userId);

    const formData = {
      studentStartCoin: user.coins,
      tutorStartCoin: tutor.coins,
      start: 0,
      userId: user._id,
      secUserId: tutor._id,
      end: 0,
    };

    // Call CallTiming and handle the result
    const callLog = await CallTiming({ body: formData });
    if (callLog) {
      console.log("Call log id is", callLog._id);
      CallIds[userId] = callLog;
    } else {
      console.error("Failed to create call log");
    }
  } catch (e) {
    console.error(e);
  }
};

function handleOnCalls(data) {
  const tutorSocketId = tutorSocketMap[data.tutorId];
  const userSocketId = userSocketMap[data.userId];

  if (tutorSocketId && userSocketId) {
    activeCalls[data.tutorId] = {
      tutorSocketId,
      studentSocketId: userSocketId,
      userId: data.userId,
    };
  }
}

function handleEndCalls(data) {
  delete activeCalls[data.tutorId];
}

const updateTime = async (userId) => {
  try {
    const data = CallIds[userId];
    console.log("start call data is ", data);
    if (!data) {
      console.error(`No call log found for user ${userId}`);
      return;
    }
    await updateCallTiming({ body: data });
    delete CallIds[userId];
    console.log(`Call timing updated and cleared for user ${userId}`);
  } catch (error) {
    console.error("Error updating call timing:", error);
  }
};

