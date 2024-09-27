// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDb = require('./Database/db');
const errorHandler = require('./middleware/errorHandler');
const helpers = require('./routes/helpersRoutes');
const Tutors = require('./routes/tutorsRoute');
const GetLanguages = require('./routes/admin');
const userRoutes = require('./routes/userRoutes');
// const { startWebSocketServer } = require('./controller/webSocket');

require('dotenv').config();

const app = express();
const port = 4000;

// Middleware
app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Database connection
connectDb();

// Routes
app.use('/helpers', helpers);
app.use('/tutors', Tutors);
app.use('/users', userRoutes)
app.use("/admin/helpers", GetLanguages);

// Error handling middleware
app.use(errorHandler);

// Start the HTTP server
const server = app.listen(port, () => {
    console.log('Listening on port', port);
});

// Start the WebSocket server and pass the HTTP server instance
// startWebSocketServer(server);
