const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const errorHandler = require("./middleware/errorHandler");
const helpers = require("./routes/helpersRoutes");
const TutorsRoute = require("./routes/tutorsRoute");
const iamadmin = require("./routes/admin"); 
const GetLanguages = require("./routes/admin");
const GenerateToken = require("./controller/generateAgoraToken");
const userRoutes = require("./routes/userRoutes");
const socketHandlers = require("./controller/socketController");
const db = require("./Database/db");
const payments = require('./routes/paymentRoutes')
const utilRoutes = require('./routes/utilRoutes')
require("./utils/cronjob");

require("dotenv").config();
db();

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FBTYPE,
  project_id: process.env.FBPROJECTID,
  private_key_id: process.env.FB_PRIVATE_KEY_ID, // Add this if it's not already in .env
  // private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
  private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines

  client_email: process.env.FB_CLIENT_EMAIL,
  client_id: process.env.FB_CLIENT_ID,
  auth_uri: process.env.FB_AUTH_URI,
  token_uri: process.env.FB_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FB_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FB_UNIVERSE_DOMAIN || 'googleapis.com',
  }),
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Use socket handlers
socketHandlers(io);

app.use(cors());
app.use(express.json());
app.use("/helpers", helpers);
app.use("/tutors", TutorsRoute);
app.use("/users", userRoutes);
app.use("/admin/helpers", GetLanguages);
app.use("/admin", iamadmin);
app.use("/generateToken", GenerateToken);
app.use("/payments", payments)
app.use("/cronjobs", utilRoutes);



app.get("/", (req, res) => {
  res.status(200).send("Talkmatez Service is running!");
});

// Error handling middleware
app.use(errorHandler);

server.listen(process.env.PORT || 8080, () => {
  console.log("Server running on port 8080");
});
