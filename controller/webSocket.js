// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// io.on('connection', (socket) => {
//     console.log('A user connected: ', socket.id);

//     socket.on('start_call', ({ tutorId }) => {
//         console.log('Call started with tutor ID:', tutorId);
//         // Emit the event to all users (except the one who started the call)
//         socket.broadcast.emit('call_started', { tutorId });
//     });

//     socket.on('end_call', ({ tutorId }) => {
//         console.log('Call ended with tutor ID:', tutorId);
//         // Emit the event to all users (except the one who ended the call)
//         socket.broadcast.emit('call_ended', { tutorId });
//     });

//     socket.on('disconnect', () => {
//         console.log('User disconnected:', socket.id);
//     });
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//     console.log(`WebSocket server is running on port ${PORT}`);
// });
