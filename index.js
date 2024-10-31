const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const serviceAccount = require("./models/talkmatez-f8850-firebase-adminsdk-aqirh-d4ba80d895.json");
const Tutors = require("./models/Tutors/tutors");

const db  = require("./Database/db");

db(); 



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const tutorSocketMap = {};
const userSocketMap = {}; 

async function getTutorFcmToken(tutorId) {
  console.log('finding tutor : ',   tutorId)
  const tutor = await Tutors.findOne({_id : tutorId})
  if(tutor){
    return tutor.fcmToken;
  }else{
    console.log('NO token found')
    return null;
  }
  
}



io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register tutor with socket ID
  socket.on("register_tutor", ({ tutorId }) => {
    if (tutorId) {
      tutorSocketMap[tutorId] = socket.id;
      console.log(`Tutor registered: ${tutorId} with socket ID: ${socket.id}`);
    
    }
  });

  // Register user with socket ID
  socket.on("register_user", ({ userId }) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`User registered: ${userId} with socket ID: ${socket.id}`);

    }
  });

  socket.on('test_event', (data) => {
    console.log('Test event received:', data);
    socket.emit('test_event_response', { response: 'Hello client' });
  });

  // Start a call between a tutor and a user
  socket.on("start_call", async({data}) => {
    console.log('tutorId is',data.tutorId);
    const tutorSocketId = tutorSocketMap[data.tutorId];
    
    if (tutorSocketId) {
      
      socket.broadcast.emit('call_started', data); 
    
    } else {
      // Tutor is offline, send FCM notification
      const tutorFcmToken = await getTutorFcmToken(data.tutorId);
      console.log('tutorFcmToken is', tutorFcmToken);
      if (tutorFcmToken) {
        console.log('tutorFcmToken is', tutorFcmToken);
        
        const message = {
          token: tutorFcmToken,
          notification: {
            title: "Incoming Call",
            body: `You have an incoming call from ${data.userId}`,
          },
          data: {
            agoraToken: `${data?.agoraToken}`,
            channelName: `${data?.channelName}`,
            userId: `${data?.userId}`,
          },
        };

        try {
          await admin.messaging().send(message);
          console.log("FCM notification sent to tutor:", data.tutorId);
        } catch (error) {
          console.error("Error sending FCM notification:", error);
        }
      } else {
        console.error(`No FCM token found for tutor ${data.tutorId}`);
      }
    }
  });

  // End the call between a tutor and a user
  socket.on("end_call", ({data}) => {
    const tutorSocketId = tutorSocketMap[data.tutorId];
    if(tutorSocketId){
      socket.broadcast.emit('call_ended', data);
    }
    console.log(`Call ended between ${data?.userId} & ${data?.tutorId} `);
     
    
  });

  // Decline the call
  socket.on("decline_call", ({data}) => {
    console.log(`Call declined by tutor`);
    
    // Notify the user that the call was declined
    const userSocketId = userSocketMap[data?.userId];
    if (userSocketId) {
      socket.broadcast.emit('call_declined', data);
    }
  });

  // Handle user or tutor disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Check if the disconnected socket was a tutor
    for (let tutorId in tutorSocketMap) {
      if (tutorSocketMap[tutorId] === socket.id) {
        delete tutorSocketMap[tutorId];
        console.log(`Tutor ${tutorId} disconnected.`);

        // Notify any user connected to this tutor
        for (let userId in userSocketMap) {
          const userSocketId = userSocketMap[userId];
          if (userSocketId) {
            io.to(userSocketId).emit("call_ended", { tutorId });
          }
        }
      }
    }

    // Check if the disconnected socket was a user
    for (let userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        console.log(`User ${userId} disconnected.`);

        // Notify any tutor connected to this user
        for (let tutorId in tutorSocketMap) {
          const tutorSocketId = tutorSocketMap[tutorId];
          if (tutorSocketId) {
            io.to(tutorSocketId).emit("call_ended", { userId });
          }
        }
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
