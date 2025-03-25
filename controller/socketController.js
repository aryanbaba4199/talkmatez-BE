const admin = require("firebase-admin");
const Tutors = require("../models/Tutors/tutors");
const User = require("../models/users/users");

const { CallTiming, updateCallTiming } = require("../controller/users/CallController");

const tutorSocketMap = {};
const userSocketMap = {};
const CallIds = {};
const activeCalls = {};
const callTimeouts = {};
const waitingcall = {};

async function getTutorFcmToken(tutorId) {
  const tutor = await Tutors.findOne({ _id: tutorId });
  return tutor ? tutor.fcmToken : null;
}

async function sendFcmNotification(tutorFcmToken, data) {
  const message = {
    token: tutorFcmToken,
    data: {
      agoraToken: `${data.agoraToken}`,
      tutorId: `${data.tutorId}`,
      userId: `${data.userId}`,
      userName: `${data.userName}`,
    },
  };
  try {
    const res = await admin.messaging().send(message);
    console.log('FCM message sent:', res, "token", tutorFcmToken);
    return true;
  } catch (error) {
    console.error("Error sending FCM notification:", error);
    return false;
  }
}

async function handleSocketFallback(io, socket, data, event, fallbackEvent) {
  const tutorSocketId = tutorSocketMap[data.tutorId];
  if (tutorSocketId) {
    try {
      socket.to(tutorSocketId).emit(event, data);
      return true;
    } catch (e) {
      console.error(`Error emitting ${event}:`, e);
    }
  }
  const tutorFcmToken = await getTutorFcmToken(data.tutorId);
  if (tutorFcmToken) {
    const fcmSent = await sendFcmNotification(tutorFcmToken, data);
    if (fcmSent) {
      io.to(userSocketMap[data.userId]).emit(fallbackEvent, data);
      return true;
    }
  }
  return false;
}
let i = 1; 

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("register_tutor", (tutorId) => handleTutorRegistration(tutorId, socket));
    socket.on("register_user", (userId) => handleUserRegistration(userId, socket));
    socket.on("unregister_tutor", (tutorId) => handleTutorUnregistered(socket, tutorId));
    socket.on("reconnect", (tutorId, tutor) => handleTutorReconnection(tutorId, socket, tutor));
    socket.on("start_call", (data) => handleCallStart(io, socket, data));
    socket.on("student_end_call", (data) => handleCallEnd(io, socket, data));
    socket.on("student_early_end", (data) => handleStudentEarlyCallEnd(io, socket, data));
    socket.on("decline_call", (data) => handleCallDeclined(io, socket, data));
    socket.on("tutor_call_end", (data) => handleTutorEndCall(io, socket, data));
    socket.on("call_accepted", (data) => handleCallAccepted(io, socket, data));
    socket.on("disconnect", (reason, data) => handleDisconnection(io, socket, reason));
    socket.on("call_acknowledged", (data) => handleCallAcknowledgment(data));
    socket.on('ping', (id)=> null)
  });
};



const updateTutor = async (id, status) => {
  console.log('Updating tutor status:', status, 'for ID:', id);
  try {
    const updateFields = { status };
    if (status === 'offline') {
      updateFields.token = null;
    }
    await Tutors.findByIdAndUpdate(id, updateFields, { new: true });
  } catch (e) {
    console.error("Error updating tutor:", e.message || e);
  }
};

const startTime = async (data) => {
  try {
    const userId = data.userId;
    const tutorId = data.tutorId;
    const tutor = await Tutors.findById(tutorId);
    const user = await User.findById(userId);

    // Calculate total silver coins
    const totalSilverCoins = user.silverCoins.reduce((sum, coin) => sum + (coin.coins || 0), 0)??0;

    // Calculate free minutes based on silver coins and tutor rate
    const freeMinutes = Math.floor(totalSilverCoins / tutor.rate); 

    const formData = {
      studentStartGoldCoin: user.coins,
      studentStartSilverCoin: totalSilverCoins,
      freeMinutes: freeMinutes,
      tutorStartGoldCoin: tutor.coins,
      tutorStartSilverCoin: tutor.silverCoins,
      start: 0,
      umobile : user.mobile,
      userId: user._id,
      userCustomId : user.uid,
      tutorCustomId : tutor.loginId,
      secUserId: tutor._id,
      end: 0,
      action: data.action,
    };
    console.log('start time is ', formData);

    const callLog = await CallTiming({ body: formData });
    if (callLog) {
      CallIds[userId] = callLog;
    } else {
      console.error("Failed to create call log");
    }
  } catch (e) {
    console.error(e);
  }
};


const handleOnCalls = (data) => {
  try {
    const tutorSocketId = tutorSocketMap[data.tutorId];
    const userSocketId = userSocketMap[data.userId];
    if (tutorSocketId && userSocketId) {
      activeCalls[data.tutorId] = { tutorSocketId, studentSocketId: userSocketId, userId: data.userId };
    }
  } catch (error) {
    console.error("Error in on calls", error);
  }
};

const handleEndCalls = (data) => {
  try {
    delete activeCalls[data.tutorId];
    delete waitingcall[data.tutorId];
  } catch (error) {
    console.error("Error in end calls", error);
  }
};

const updateTime = async (userId, action, call) => {
  try {
    const data = CallIds[userId];
    if (!data) {
      console.error(`No call log found for user ${userId}`);
      return;
    }
    const updateValue = { data, action, call };
    await updateCallTiming({ body: updateValue });
    if (action !== 2) {
      delete CallIds[userId];
    }
  } catch (error) {
    console.error("Error updating call timing:", error);
  }
};

const storeDisconnection = async (logIs, who) => {
  return
};

const handleFcmNotifier = async (data, socket, io) => {
  try {
    const tutorFcmToken = await getTutorFcmToken(data.tutorId);
    if (tutorFcmToken) {
      console.log("Sending call notification via FCM" , tutorFcmToken);
      updateTutor(data?.tutorId, "busy");
      waitingcall[data.tutorId] = setTimeout(() => handleCallNotAccepted(io, socket, data), 15000);
      const fcmSent = await sendFcmNotification(tutorFcmToken, data);
      if (fcmSent) {
        startTime(data);
        handleOnCalls(data);
        socket.broadcast.emit("busy", data.tutorId);
        return;
      }
    } else {
      const userSocketId = userSocketMap[data.userId];
      if (userSocketId) {
        console.log("Network failed to connect");
        socket.to(userSocketId).emit("network_error");
      }
    }
  } catch (error) {
    console.error("Error in FCM Notification", error);
  }
};

const handleTutorRegistration = async (tutorId, socket) => {
  if (!tutorId) return;
  console.log("Register tutor socketid: ", tutorId);
  try {
    tutorSocketMap[tutorId] = socket.id;
    const tutorCurrStatus = activeCalls[tutorId];
    if (tutorCurrStatus && tutorCurrStatus.tutorSocketId) return;
    socket.broadcast.emit("available", tutorId);
    updateTutor(tutorId, "available", socket);
  } catch (e) {
    console.error("Error in tutor Registration", e);
  }
};

const handleTutorUnregistered = (socket, tutorId) => {
  console.log("Handling tutor unregistered", tutorId);
  socket.broadcast.emit("offline", tutorId);
  updateTutor(tutorId, "offline");
};

const handleUserRegistration = async (userId, socket) => {
  console.log("Handling user registration", userId);
  try {
    if (userId) userSocketMap[userId] = socket.id;
  } catch (e) {
    console.error("Error in user Registration", e);
  }
};

const handleCallStart = async (io, socket, data) => {
  console.log("Call started");
  if (!data) return;
  try {
    const tutor = await Tutors.findById(data.tutorId);
    if (tutor.status !== 'available') {
      io.to(userSocketMap[data.userId]).emit('tutor_is_on_call', data);
      return;
    }
    const isTutorBusy = activeCalls[data.tutorId];
    if (isTutorBusy && tutor.status !== 'available') {
      socket.to(userSocketMap[data.userId]).emit('tutor_is_on_call', data);
      return;
    } else if (isTutorBusy && tutor.status === 'available') {
      handleEndCalls(data);
    }
    const tutorSocketId = tutorSocketMap[data.tutorId];

    if (tutorSocketId) {
      try {
        socket.to(tutorSocketId).emit("call_started", data);
        callTimeouts[data.tutorId] = setTimeout(() => handleFcmNotifier(data, socket, io), 3000);
        waitingcall[data.tutorId] = setTimeout(() => handleCallNotAccepted(io, socket, data), 45000);
        startTime(data);
        handleOnCalls(data);
        socket.broadcast.emit("busy", data.tutorId);
        updateTutor(data.tutorId, "busy");
      } catch (e) {
        handleFcmNotifier(data, socket, io);
        console.error(e);
      }
    } else {
      const tutor = await Tutors.findById(data.tutorId);
      if (tutor.status === 'offline') {
        io.to(userSocketMap[data.userId]).emit('tutor_offline', data);
      } else {
        handleFcmNotifier(data, socket, io);
      }
    }
  } catch (error) {
    console.error("Error in starting call", error);
  }
};

const handleStudentEarlyCallEnd = (io, socket, data) => {
  const tutorStatus = activeCalls[data.tutorId];
  console.log('Student Early Call End', tutorStatus);
  if (tutorStatus) {
    handleEndCalls(data);
    socket.broadcast.emit("available", data.tutorId);
  }
  try {
    const tutorSocketId = tutorSocketMap[data.tutorId];
    if (tutorSocketId){
      io.to(tutorSocketId).emit("call_ended", data);
      
    }else{
      handleFcmNotifier(data, socket, io);
    }
    handleRemoveWaiting(data);
    updateTime(data.userId, 0, true);
    handleEndCalls(data);
    socket.broadcast.emit("available", data.tutorId);
    updateTutor(data.tutorId, "available");
   
  } catch (error) {
    console.error("Error in Early Call End", error);
  }
};

const handleCallDeclined = async (io, socket, data) => {
  console.log('Call declined by tutor');
  try {
    handleRemoveWaiting(data);
    updateTime(data.userId, 1, true);
    handleEndCalls(data);
    updateTutor(data.tutorId, "available");
    const userSocketId = userSocketMap[data.userId];
    if (userSocketId) io.to(userSocketId).emit("call_declined", data);
    socket.broadcast.emit("available", data.tutorId);
  } catch (error) {
    console.error("Error in Decline Call", error);
  }
};

const handleCallEnd = async (io, socket, data) => {
  console.log('Student ended the call before pick');
  try {
    handleEndCalls(data);
    updateTime(data.userId, 3);
    socket.broadcast.emit("available", data.tutorId);
    io.to(tutorSocketMap[data.tutorId]).emit("call_ended");
    updateTutor(data.tutorId, "available");
    const tutorSocketId = tutorSocketMap[data.tutorId];
    if (tutorSocketId) io.to(tutorSocketId).emit("call_ended", data);
  } catch (error) {
    console.error("Error in call_ended", error);
  }
};

const handleTutorEndCall = (io, socket, data) => {
  try {
    handleEndCalls(data);
    updateTime(data.userId, 4);
    const userSocketId = userSocketMap[data.userId];
    socket.broadcast.emit("available", data.tutorId);
    updateTutor(data.tutorId, "available");
    console.log('user socket id ', userSocketId)
    if (userSocketId) io.to(userSocketId).emit("tutor_end_the_call", data);
  } catch (error) {
    console.error("Error in tutor_end", error);
  }
};

const handleCallAccepted = (io, socket, data) => {
  try {
    handleRemoveWaiting(data);
    updateTime(data.userId, 2, true);
    const userSocketId = userSocketMap[data?.userId];
    updateTutorRank(data.tutorId);
    if (userSocketId) io.to(userSocketId).emit("call_accepted");
  } catch (error) {
    console.error("Error in Call Accepting", error);
  }
};

const handleCallNotAccepted = async (io, socket, data) => {
  try {
    io && io.to(tutorSocketMap[data.tutorId]).emit("call_ended");
    io && io.to(userSocketMap[data.userId]).emit("call_not_accepted");
    socket.broadcast.emit("available", data.tutorId);
    updateTutor(data.tutorId, "available");
    updateTime(data.userId, 0, true);
  } catch (error) {
    console.error("Error in Call Not Accepting", error);
  }
};

const handleDisconnection = async (io, socket, reason) => {
  try {
    for (let tutorId in tutorSocketMap) {
      if(tutorSocketMap[tutorId] === socket.id) {
        delete tutorSocketMap[tutorId];
        const activeCall = activeCalls[tutorId];
        if (activeCall) {
          const studentSocketId = activeCall.studentSocketId;
          if (studentSocketId) {
            updateTime(activeCall.userId, 6);
            io.to(studentSocketId).emit("call_ended_due_to_disconnect", {
              message: "The tutor has disconnected. The call has ended.",
            });
          }
          handleEndCalls({ tutorId, userId: activeCall.userId });
        }
        // socket.broadcast.emit("offline", tutorId);
        // if (tutorId) updateTutor(tutorId, "offline");
      }
    }
    for (let userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        const tutorId = Object.keys(activeCalls).find((tid) => activeCalls[tid].userId === userId);
        if (tutorId) {
          updateTime(userId, 5);
          const tutorSocketId = activeCalls[tutorId].tutorSocketId;
          if (tutorSocketId) {
            io.to(tutorSocketId).emit("call_ended_due_to_disconnect", {
              message: "The student has disconnected. The call has ended.",
            });
            socket.broadcast.emit("available", tutorId);
            updateTutor(tutorId, "available");
          }
          handleEndCalls({ tutorId, userId });
          storeDisconnection(reason, "Student");
        }
      }
    }
  } catch (error) {
    console.error('Error in Disconnection', error);
  }
};

const handleCallAcknowledgment = (data) => {
  console.log(`Acknowledgment received from tutor ${data.tutorId}`);
  if (callTimeouts[data.tutorId]) {
    clearTimeout(callTimeouts[data.tutorId]);
    delete callTimeouts[data.tutorId];
  }
};

const handleRemoveWaiting = (data) => {
  if (waitingcall[data.tutorId]) {
    clearTimeout(waitingcall[data.tutorId]);
    delete waitingcall[data.tutorId];
  }
};

const updateTutorRank = async (id) => {
  try {
    const currentTutor = await Tutors.findById(id);
    if (!currentTutor) throw new Error(`Tutor with ID ${id} not found`);
    const newRankTutor = await Tutors.findOne({ rank: currentTutor.rank + 1 });
    if (newRankTutor) {
      const currRank = currentTutor.rank;
      const nextRank = newRankTutor.rank;
      await Tutors.findByIdAndUpdate(id, { rank: -1 });
      await Tutors.findByIdAndUpdate(newRankTutor._id, { rank: currRank });
      await Tutors.findByIdAndUpdate(id, { rank: nextRank });
      console.log('Rank swapped');
    } else {
      await Tutors.findByIdAndUpdate(id, { rank: currentTutor.rank+1});
      console.log('rank incremented')
    }
  } catch (e) {
    console.error(`Error updating tutor rank ${id}`, e);
  }
};
