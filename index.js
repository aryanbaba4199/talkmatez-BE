// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const tutorSocketMap = {}; // Mapping of tutorId -> socket.id
const userSocketMap = {}; // Mapping of userId -> socket.id
const activeCalls = {}; // Tracks ongoing calls by tutorId -> { tutorId, userId }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register_tutor", ({ tutorId }) => {
   
    if (tutorId) {
      tutorSocketMap[tutorId] = socket.id;
      console.log(`Tutor registered: ${tutorId} with socket ID: ${socket.id}`);
    }
  });

  socket.on("register_user", ({ userId }) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
    }
  });

  socket.on("start_call", ({ tutorId, userId }) => {
    console.log('start_call', tutorId, userId);
    try{
      socket.emit('start_call', { tutorId, userId }, () => {
        const tutorSocketId = tutorSocketMap[tutorId];
        const userSocketId = userSocketMap[userId]; // Check for user connection
        if (tutorSocketId) {
          console.log('starting'); 
          socket.to(tutorSocketId).emit("incoming_call", { userId });
          console.log(`Call from user ${userId} to tutor ${tutorId}`);
        } else {
          console.log(`Tutor ${tutorId} or User ${userId} is not online.`);
        }
      });
    }catch(e){
      console.log('error in start_call', e);
    }
    
  });

  socket.on("end_call", ({ tutorId, userId }) => {
    console.log(`Call ended between tutor ${tutorId} and user ${userId}`);
    const userSocketId = userSocketMap[userId];
    const tutorSocketId = tutorSocketMap[tutorId];

    if (userSocketId) {
      io.to(userSocketId).emit("call_ended", { tutorId });
    }
    if (tutorSocketId) {
      io.to(tutorSocketId).emit("call_ended", { userId });
    }

    clearCall(tutorId, userId);
  });

  socket.on("decline_call", ({ tutorId, userId }) => {
    console.log(`Call declined by tutor ${tutorId}`);
    const userSocketId = userSocketMap[userId];
    if (userSocketId) {
      io.to(userSocketId).emit("call_ended", { tutorId });
    }
    clearCall(tutorId, userId);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    for (let tutorId in tutorSocketMap) {
      if (tutorSocketMap[tutorId] === socket.id) {
        delete tutorSocketMap[tutorId];
        console.log(`Tutor ${tutorId} disconnected.`);

        if (activeCalls[tutorId]) {
          const { userId } = activeCalls[tutorId];
          const userSocketId = userSocketMap[userId];
          if (userSocketId) {
            io.to(userSocketId).emit("call_ended", { tutorId });
          }
          clearCall(tutorId, userId);
        }
      }
    }

    for (let userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        console.log(`User ${userId} disconnected.`);

        if (activeCalls[userId]) {
          const { tutorId } = activeCalls[userId];
          const tutorSocketId = tutorSocketMap[tutorId];
          if (tutorSocketId) {
            io.to(tutorSocketId).emit("call_ended", { userId });
          }
          clearCall(tutorId, userId);
        }
      }
    }
  });

  const clearCall = (tutorId, userId) => {
    delete activeCalls[tutorId];
    delete activeCalls[userId];
  };
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
