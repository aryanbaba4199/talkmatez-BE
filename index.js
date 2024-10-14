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
  socket.on("start_call", ({data}) => {
    console.log('tutorId is',data.tutorId);
    const tutorSocketId = tutorSocketMap[data.tutorId];
    
    if (tutorSocketId) {
      console.log(`Call from user ${data.userId} to tutor ${data.tutorId} with socket ID: ${tutorSocketId}`);
      
      socket.broadcast.emit('call_started', data); 
      // // Notify the tutor of the incoming call
      // io.to(tutorSocketId).emit("incoming_call", { userId });

      // Log that the event was successfully emitted
      console.log(`Incoming call event sent to tutor ${data.tutorId} (socket ID: ${tutorSocketId})`);
    } else {
      console.log(`Tutor ${data.tutorId} or User ${data.userId} is not online.`);
      
      // Notify the user that the tutor is unavailable
      socket.emit("error", { message: "Tutor is not available." });
    }
  });

  // End the call between a tutor and a user
  socket.on("end_call", ({userId}) => {
    console.log(`Call ended between `);
    
    socket.broadcast.emit('call_ended', userId);
  });

  // Decline the call
  socket.on("decline_call", ({ tutorId, userId }) => {
    console.log(`Call declined by tutor ${tutorId}`);
    
    // Notify the user that the call was declined
    const userSocketId = userSocketMap[userId];
    if (userSocketId) {
      io.to(userSocketId).emit("call_ended", { tutorId });
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
