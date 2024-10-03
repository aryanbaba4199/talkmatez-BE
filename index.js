const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const tutorSocketMap = {}; // Map for tutor sockets
const userSocketMap = {}; // Map for user (student) sockets

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register both userId and tutorId with their socket
  socket.on('register_tutor', ({ tutorId, userId }) => {
    if (tutorId) {
      tutorSocketMap[tutorId] = socket.id;
      console.log(`Tutor registered: ${tutorId} with socket ID: ${socket.id}`);
    }
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
    }
  });

  // Handle call initiation by the user (student)
  socket.on('start_call', ({ tutorId, userId }) => {
    const tutorSocketId = tutorSocketMap[tutorId];
    if (tutorSocketId) {
      // Notify the tutor of the incoming call
      io.to(tutorSocketId).emit('incoming_call', { tutorId, userId });
      console.log(`Incoming call from user ${userId} to tutor ${tutorId}`);
    } else {
      console.log('Tutor is not online');
    }
  });

  // Handle call ending or declining from either user or tutor
  socket.on('end_call', ({ tutorId, userId }) => {
    console.log('Call ended:', { tutorId, userId });
    const userSocketId = userSocketMap[userId];
    const tutorSocketId = tutorSocketMap[tutorId];

    // Notify both parties about the call ending
    if (userSocketId) {
      io.to(userSocketId).emit('call_ended', { tutorId });
    }
    if (tutorSocketId) {
      io.to(tutorSocketId).emit('call_ended', { userId });
    }

    // Remove both the tutor and user from their respective maps
    delete tutorSocketMap[tutorId];
    delete userSocketMap[userId];
  });

  // Handle call decline by tutor
  socket.on('decline_call', ({ tutorId, userId }) => {
    console.log('Call declined by tutor:', { tutorId, userId });
    const userSocketId = userSocketMap[userId];
    if (userSocketId) {
      io.to(userSocketId).emit('call_ended', { tutorId });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove both the tutor and user from their respective maps
    for (let tutorId in tutorSocketMap) {
      if (tutorSocketMap[tutorId] === socket.id) {
        delete tutorSocketMap[tutorId];
        console.log(`Tutor ${tutorId} disconnected and removed from map`);

        // Notify the other party (user) about the call ending
        const userSocketId = userSocketMap[tutorId];
        if (userSocketId) {
          io.to(userSocketId).emit('call_ended', { tutorId });
        }
      }
    }
    for (let userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        console.log(`User ${userId} disconnected and removed from map`);

        // Notify the other party (tutor) about the call ending
        const tutorSocketId = tutorSocketMap[userId];
        if (tutorSocketId) {
          io.to(tutorSocketId).emit('call_ended', { userId });
        }
      }
    }
  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});
