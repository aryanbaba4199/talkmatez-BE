// socketHandlers.js
const admin = require("firebase-admin");
const Tutors = require("../models/Tutors/tutors");
const User = require("../models/users/users");
const SocketLog = require("../models/Others/socket");
const {
  CallTiming,
  updateCallTiming,
} = require("../controller/users/CallController");

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

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("register_tutor", (tutorId) => {
      handleTutorRegistration(tutorId, socket);
    });
    socket.on("register_user", (userId) => {
      handleUserRegistration(userId, socket);
    });
    socket.on("reconnect", (tutorId, tutor) => {
      handleTutorReconnection(tutorId, socket, tutor);
    });
    socket.on("start_call", (data) => hanleCallStart(io, socket, data));
    socket.on("student_end_call", (data) => handleCallEnd(io, socket, data));
    socket.on("student_early_end", (data) =>
      handleStudentEarlyCallEnd(io, socket, data)
    );
    socket.on("decline_call", (data) => handleCallDeclined(io, socket, data));
    socket.on("tutor_call_end", (data) => handleTutorEndCall(io, socket, data));
    socket.on("call_accepted", (data) => handleCallAccepted(io, socket, data));
    
    socket.on("disconnect", (reason, data) =>
      handleDisconnection(io, socket, reason)
    );
    socket.on("call_acknowledged", (data) => {
      handleCallAcknowledgment(data);
    });
  });
};

// ------------Updating Tutor------------
const updateTutor = async (id, status) => {
  try {
    if(status==='offline'){
        await Tutors.findByIdAndUpdate(
        id,
        { token : null},
        { new: true }
      );
    }
    const x = await Tutors.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );
  } catch (e) {
    console.log("error updating", e);
  }
};

//---------------Storing Start Time----------------

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
      action: data.action,
    };

    // Call CallTiming and handle the result
    const callLog = await CallTiming({ body: formData });
    if (callLog) {
      // console.log("Call log id is", callLog._id);
      CallIds[userId] = callLog;
    } else {
      console.error("Failed to create call log");
    }
  } catch (e) {
    console.error(e);
  }
};

function handleOnCalls(data) {
  try {
    const tutorSocketId = tutorSocketMap[data.tutorId];
    const userSocketId = userSocketMap[data.userId];

    if (tutorSocketId && userSocketId) {
      activeCalls[data.tutorId] = {
        tutorSocketId,
        studentSocketId: userSocketId,
        userId: data.userId,
      };
    }
  } catch (error) {
    console.error("error in on calls", error);
  }
}

function handleEndCalls(data) {
  try {
    delete activeCalls[data.tutorId];

  } catch (error) {
    console.error("error in end calls", error);
  }
}

const updateTime = async (userId, action, call) => {
  try {
    const data = CallIds[userId];
    console.log("start call data is ", data);
    if (!data) {
      console.error(`No call log found for user ${userId}`);
      return;
    }
    updateValue = { data, action, call };
    await updateCallTiming({ body: updateValue });
    if (action !== 2) {
      // console.log(`Call timing updated and cleared for user ${userId}`);
      delete CallIds[userId];
    }
  } catch (error) {
    console.error("Error updating call timing:", error);
  }
};

const storeDisconnection = async (logIs, who) => {
  try {
    const log = new SocketLog({
      logIs,
      who,
    });
    await log.save();
  } catch (error) {
    console.error("Error updating call timing:", error);
  }
};

const handleFcmNotifier = async (data, socket, io) => {
  try {
    const tutorFcmToken = await getTutorFcmToken(data.tutorId);
    console.log("tutorFcmToken", data);
    if (tutorFcmToken) {
      console.log("sendin call notification via FCM");
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
        waitingcall[data.tutorId] = setTimeout(() => {
          handleCallNotAccepted(io, socket, data)
        }, 60000);
        await admin.messaging().send(message);
        startTime(data);
        handleOnCalls(data);
        socket?.broadcast?.emit("busy", data.tutorId);
        updateTutor(data?.tutorId, "busy");
        return;
      } catch (error) {
        updateTutor(data.tutorId, "Offline");
        console.error("Error sending FCM notification:", error);
      }
    } else {
      const userSocketId = userSocketMap[data.userId];
      console.log(userSocketId);
      if (userSocketId) {
        console.log("network failed to connect");
        socket.to(userSocketId).emit("network_error");
      }
    }
  } catch (error) {
    console.error("Error in FCM Notification", error);
  }
};

// -------------Handling tutor Registration -----------------

const handleTutorRegistration = async (tutorId, socket) => {
  if(!tutorId){
    return;
  }
  console.log("Register tutor socketid: ", tutorId);
  try {
    if (tutorId) {
      tutorSocketMap[tutorId] = socket.id;
      const tutorCurrStatus = activeCalls[tutorId]
      if(tutorCurrStatus && tutorCurrStatus.tutorSocketId){
       return;
      }
      socket.broadcast.emit("available", tutorId);
      updateTutor(tutorId, "available");
      
    }
  } catch (e) {
    console.error("Error in tutor Registration", e);
  }
};

//---------------------Handling User Registration--------------------

const handleUserRegistration = async (userId, socket) => {
  console.log("Handling user registration", userId);
  try {
    if (userId) {
      userSocketMap[userId] = socket.id;
    }
  } catch (e) {
    console.error("Error in user Registration", e);
  }
};

//-------------------Handle Reconnection of Tutor --------------------

const handleTutorReconnection = async (tutorId, tutor, socket) => {
  try {
    tutorSocketMap[tutorId] = socket.id;
    if (tutor) {
      await updateTutor(tutorId, "available");
      socket.broadcast.emit("available", tutorId);
    }
  } catch (error) {
    console.error("Error in tutor Reconnection", error);
  }
};

//----------------Handling Call Start ----------------
const hanleCallStart = (io, socket, data) => {
  if (!data) {
    return;
  }
  console.log("Handling call start ", data)
  try {
    const tutorSocketId = tutorSocketMap[data.tutorId];
    console.log("start call tutorId", tutorSocketId, data.tutorId);
    if (tutorSocketId) {
      try {
        socket.to(tutorSocketId).emit("call_started", data);
        console.log("starting data is ", data);
        callTimeouts[data.tutorId] = setTimeout(() => {
          console.log(`No acknowledgment from tutor ${data.tutorId}. Sending FCM notification.`);
          handleFcmNotifier(data);
        }, 10000); 
        waitingcall[data.tutorId] = setTimeout(() => {
          handleCallNotAccepted(io, socket, data)
        }, 60000);
        startTime(data);
        handleOnCalls(data);
        socket.broadcast.emit("busy", data.tutorId);
        updateTutor(data.tutorId, "busy");
      } catch (e) {
        handleFcmNotifier(data);
        console.error(e);
      }
    } else {
      console.log("sending to FCM");
      handleFcmNotifier(data, socket);
    }
  } catch (error) {
    console.error("Error in starting call", error);
  }
};

//----------------Handling Student Early Call End--------------

const handleStudentEarlyCallEnd = (io, socket, data) => {
  try {
    handleRemoveWaiting(data);
    console.log("student ended connection", data);
    updateTime(data.userId, 0, true);
    handleEndCalls(data);
    socket.broadcast.emit("available", data.tutorId);
    updateTutor(data.tutorId, "available");
    const tutorSocketId = tutorSocketMap[data.tutorId];
    if (tutorSocketId) {
      io.to(tutorSocketId).emit("call_ended", data);
    }
  } catch (error) {
    console.error("Error in Early Call End", error);
  }
};

//-------------------Handling Call Decline--------------------
const handleCallDeclined = async (io, socket, data) => {
  try {
    handleRemoveWaiting(data);
    console.log("declined", data);
    updateTime(data.userId, 1, true);
    handleEndCalls(data);
    socket.broadcast.emit("available", data.tutorId);
    updateTutor(data.tutorId, "available");
    const userSocketId = userSocketMap[data.userId];
    if (userSocketId) {
      io.to(userSocketId).emit("call_declined", data);
    }
  } catch (error) {
    console.error("Error in Decline Call", error);
  }
};

//--------------------Handling Student call End --------------------------------

const handleCallEnd = (io, socket, data) => {
  try {
    handleEndCalls(data);
    updateTime(data.userId, 3);
    socket.broadcast.emit("available", data?.tutorId);
    io.to(tutorSocketMap[data.tutorId]).emit("call_ended");
    updateTutor(data.tutorId, "available");
    const tutorSocketId = tutorSocketMap[data.tutorId];
    if (tutorSocketId) {
      io.to(tutorSocketId).emit("call_ended", data);
    }
  } catch (error) {
    console.error("Error in call_ended", error);
  }
};

//------------Handling Tutor end call --------------------

const handleTutorEndCall = (io, socket, data) => {
  console.log('the data is',data);
  try {
    handleEndCalls(data);
    updateTime(data.userId, 4);
    const userSocketId = userSocketMap[data.userId];
    console.log("tutor_end_the_call", userSocketId);
    socket.broadcast.emit("available", data.tutorId);

    updateTutor(data.tutorId, "available");
    if (userSocketId) {
      console.log("emititng user about tutor end call");
      io.to(userSocketId).emit("tutor_end_the_call", data);
    }
  } catch (error) {
    console.error("error in tutor_end", error);
  }
};

//---------------Handling call accepted --------------------------------

const handleCallAccepted = (io, socket, data) => {
  try {
    handleRemoveWaiting(data);
    console.log("accepted", data);
    updateTime(data.userId, 2, true);
    const userSocketId = userSocketMap[data?.userId];
    updateTutorRank(data.tutorId);
    if (userSocketId) {
      io.to(userSocketId).emit("call_accepted");
    }
  } catch (error) {
    console.log("Error in Call Accepting", error);
  }
};

//----------Handling Call not accepted --------------------------------

const handleCallNotAccepted = async (io, socket, data) => {
  try {
    console.log("Handling Call Not Accepted");
    io.to(tutorSocketMap[data.tutorId]).emit("call_ended");
    io.to(userSocketMap[data.userId]).emit("call_not_accepted");
    console.log('emiting tutor available', data.tutorId);
    socket.broadcast.emit("available", data.tutorId);
    updateTutor(data.tutorId, "available");
    console.log('emited')
    updateTime(data.userId, 0, true);
  } catch (error) {
    console.error("Error in Call Not Accepting", error);
  }
};

//--------------------Handling Disconnection---------------------
const handleDisconnection = async (io, socket, reason) => {
  console.log('handling disconnect', socket.id)

  try {
    for (let tutorId in tutorSocketMap) {
      if (tutorSocketMap[tutorId] === socket.id) {
        delete tutorSocketMap[tutorId];
        console.log(`Tutor ${tutorId} disconnected.`);
  
        // Check for active call
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
  
        socket.broadcast.emit("offline", tutorId);
        if(tutorId){
          updateTutor(tutorId, "offline");
        } 
      
        storeDisconnection(reason, "Tutor");
      }
    }
  } catch (e) {
    console.error("Error in Tutor Disconnection", e);
  }

  // Check if a student disconnected
  try {
    for (let userId in userSocketMap) {
      console.log('Disconnecting user ', userId);
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        console.log(`User ${userId} disconnected.`);
  
        // Find if this student is in an active call
        const tutorId = Object.keys(activeCalls).find(
          (tid) => activeCalls[tid].userId === userId
        );
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
    console.error('Error in User Disconnection',error);
  }
};


// Handling Call Acknowledgment
const handleCallAcknowledgment = (data) => {
  console.log(`Acknowledgment received from tutor ${data.tutorId}`);

  // Clear the timeout if it exists
  if (callTimeouts[data.tutorId]) {
    clearTimeout(callTimeouts[data.tutorId]);
    delete callTimeouts[data.tutorId];
    console.log(`Timeout cleared for tutor ${data.tutorId}`);
  }
};

// Remove waiting 
const handleRemoveWaiting = async(data)=>{
  if(waitingcall[data.tutorId]){
    clearTimeout(waitingcall[data.tutorId]);
    delete waitingcall[data.tutorId];
  }
}

//-------------Updating tutor Rank --------------------
const updateTutorRank = async (id) => {
  try {
  const currentTutor = await Tutors.findById(id);
  if (!currentTutor) {
    throw new Error(`Tutor with ID ${tutorId} not found`);
  };
  const newRankTutor = await Tutors.findOne({rank : currentTutor.rank+1});
  if(newRankTutor){
    const currRank = currentTutor.rank
    const nextRank = newRankTutor.rank
  
  await Promise.all([
    Tutors.findByIdAndUpdate(id, {rank : nextRank}),
    Tutors.findByIdAndUpdate(newRankTutor._id, {rank : currRank})
  ]);
  console.log(`Ranks updated: Tutor ${currentTutor.name} is now rank ${nextRank}, and Tutor ${newRankTutor.name} is now rank ${currRank}`);
  }else{
    await Tutors.findByIdAndUpdate(id, {rank : currentTutor.rank+1})
    console.log(`Tutor ${currentTutor.name}'s rank incremented to ${currentTutor.rank + 1}`);
  }
    
  }catch (e) {
    console.error(`Error updating tutor rank ${id}`, e);
  }
}