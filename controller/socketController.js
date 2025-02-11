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
    socket.on("unregister_tutor", (tutorId) => {
 
      
      handleTutorUnregistered(socket, tutorId);
    })
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
    socket.on("ping", (id)=>heartbeat(io, socket, id))
  });
};

const heartbeat = (io, socket, id)=>{
  try{
    console.log('ping received')
    io.to(userSocketMap[id]).emit('pong')
  }catch(e){
    console.error('heartbeat error', e);
  }
}

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
      studentStartSilverCoin: user.silverCoins.reduce((sum, coin) => sum + (coin.coins || 0), 0),
      freeMinutes: Math.floor(user.silverCoins.reduce((sum, coin) => sum + (coin.coins || 0), 0) / tutor.rate),
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
  console.log('teacher is in room ');
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

    
    if (tutorFcmToken) {
      console.log("sendin call notification via FCM");
      updateTutor(data?.tutorId, "busy");
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
        }, 45000);
        const res = await admin.messaging().send(message);
        console.log('fcm message id', res)
        startTime(data);
        handleOnCalls(data);
        socket.broadcast.emit("busy", data.tutorId);
  
        return;
      } catch (error) {
        if (error.code === "messaging/invalid-registration-token" || error.code === "messaging/registration-token-not-registered") {
          handleTutorUnregistered(socket, data.tutorId);
        }
        
        console.error("Error sending FCM notification:", error);
      }
    } else {
      const userSocketId = userSocketMap[data.userId];

      
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
      updateTutor(tutorId, "available", socket);
      
    }
  } catch (e) {
    console.error("Error in tutor Registration", e);
  }
};

// -----------Handling tutor unregistered------------------------
const handleTutorUnregistered = (socket, tutorId)=>{

  
  socket.broadcast.emit("offline", tutorId);
  updateTutor(tutorId, "offline");
}

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



//----------------Handling Call Start ----------------
const hanleCallStart = async(io, socket, data) => {
  console.log("call started");
  if (!data) {
    return;
  }

  
  try {
    
    const tutor = await Tutors.findById(data.tutorId);
    console.log('tutor status', tutor.status);
    if(tutor.status!=='available'){
      io.to(userSocketMap[data.userId]).emit('tutor_is_on_call', data)
      console.log('tutor is busy emited')
      console.log('returning')
      return; 
    } 

    const isTutorBusy = activeCalls[data.tutorId];
    console.log('isTutorBusy', isTutorBusy);
    console.log('active calls', activeCalls)
    if(isTutorBusy){
      console.log('tutor is busy')
      socket.to(userSocketMap[data.userId]).emit('tutor_is_on_call', data)
      return;  
    }
    const tutorSocketId = tutorSocketMap[data.tutorId];
    console.log("start call tutorId", tutorSocketId, data.tutorId);
    if (tutorSocketId) {
      try {
        socket.to(tutorSocketId).emit("call_started", data);
        console.log("starting data is ", data);
        callTimeouts[data.tutorId] = setTimeout(() => {
          console.log(`No acknowledgment from tutor ${data.tutorId}. Sending FCM notification.`);
          handleFcmNotifier(data);
        }, 3000); 
        waitingcall[data.tutorId] = setTimeout(() => {
          handleCallNotAccepted(io, socket, data)
        }, 45000);
        startTime(data);
        handleOnCalls(data);
        socket.broadcast.emit("busy", data.tutorId);
        updateTutor(data.tutorId, "busy");
      } catch (e) {
        handleFcmNotifier(data);
        console.error(e);
      }
    } else {
      const tutor = await Tutors.findById(data.tutorId)
      if(tutor.status ==='offline') {
        io.to(userSocketMap[data.userId]).emit('tutor_offline', data)
      }else{
        console.log("sending to FCM");
        handleFcmNotifier(data, socket);
      }
      
    }
  } catch (error) {
    console.error("Error in starting call", error);
  }
};

//----------------Handling Student Early Call End--------------

const handleStudentEarlyCallEnd = (io, socket, data) => {
  // const tutorStatus = activeCalls[data.tutorId]
  // console.log('Student Early Call End', tutorStatus);
  // console.log('current active calls', activeCalls);
  // if(tutorStatus){
  //   return;
  // }
  try {
    console.log('Student Early Call', data);
    handleRemoveWaiting(data);

    updateTime(data.userId, 0, true);
    handleEndCalls(data);
    try{
      socket.broadcast.emit("available", data.tutorId);
      updateTutor(data.tutorId, "available");
    }catch(e){
      console.error('error in socket early end', e);
    }
    
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
  console.log('call declined by tutor');
  try {
    handleRemoveWaiting(data);

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

const handleCallEnd = async(io, socket, data) => {
  console.log('student ended the call before pick')
  try {
     handleEndCalls(data);
    await updateTime(data.userId, 3);
    socket.broadcast.emit("available", data.tutorId);
    console.log('broadcasting tutor available', data.tutorId);
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

  try {
    handleEndCalls(data);
    updateTime(data.userId, 4);
    const userSocketId = userSocketMap[data.userId];

    socket.broadcast.emit("available", data.tutorId);
    console.log('broadcasting tutor available');
    updateTutor(data.tutorId, "available");
    if (userSocketId) {
    
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

    updateTime(data.userId, 2, true);
    const userSocketId = userSocketMap[data?.userId];
    updateTutorRank(data.tutorId);
    if (userSocketId) {
      io.to(userSocketId).emit("call_accepted");
    }
  } catch (error) {
    console.error("Error in Call Accepting", error);
  }
};

//----------Handling Call not accepted --------------------------------

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

//--------------------Handling Disconnection---------------------
const handleDisconnection = async (io, socket, reason) => {
 
  

  try {
    for (let tutorId in tutorSocketMap) {
      if (tutorSocketMap[tutorId] === socket.id) {
        delete tutorSocketMap[tutorId];
  
        
  
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
  
        // socket.broadcast.emit("offline", tutorId);
        // if(tutorId){
        //   updateTutor(tutorId, "offline");
        // } 
    
      }
    }
  } catch (e) {
    console.error("Error in Tutor Disconnection", e);
  }

  // Check if a student disconnected
  try {
    for (let userId in userSocketMap) {
 
      
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
      
        
  
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
      throw new Error(`Tutor with ID ${id} not found`);
    }

    // Find the tutor with the next rank
    const newRankTutor = await Tutors.findOne({ rank: currentTutor.rank + 1 });

    if (newRankTutor) {
      const currRank = currentTutor.rank;
      const nextRank = newRankTutor.rank;

      // Update the current tutor's rank to a temporary value
      await Tutors.findByIdAndUpdate(id, { rank: -1 }); // Temporary rank to avoid conflict
      // Swap ranks
      await Tutors.findByIdAndUpdate(newRankTutor._id, { rank: currRank });
      await Tutors.findByIdAndUpdate(id, { rank: nextRank });
      console.log('rank swapped')
    } else {
      // If no tutor has the next rank, just increment the current tutor's rank

      await Tutors.findByIdAndUpdate(id, { rank: currentTutor.rank + 1 });
      console.log('rank incremented')
    }
  } catch (e) {
    console.error(`Error updating tutor rank ${id}`, e);
  }
};
