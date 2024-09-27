const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);


const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    },
  });
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
  
    // When a call starts
    socket.on('start_call', ({ tutorId }) => {
      // Notify the tutor about the incoming call
      io.to(tutorId).emit('incoming_call', { callerId: socket.id });
    });
  
    // When a call is accepted
    socket.on('accept_call', ({ tutorId }) => {
      io.to(tutorId).emit('call_accepted', { tutorId });
    });
  
    // When a call is declined
    socket.on('decline_call', ({ tutorId }) => {
      io.to(tutorId).emit('call_declined', { tutorId });
    });
  
    // When a call ends
    socket.on('end_call', ({ tutorId }) => {
      io.to(tutorId).emit('call_ended', { tutorId });
    });
  });
  

server.listen(5000, () => {
    console.log('Server is running on port 5000');
});
