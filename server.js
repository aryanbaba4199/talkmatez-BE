const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const serviceAccount = require("./models/talkmatez-f8850-firebase-adminsdk-aqirh-d4ba80d895.json");
const errorHandler = require("./middleware/errorHandler");
const helpers = require("./routes/helpersRoutes");
const TutorsRoute = require("./routes/tutorsRoute");
const iamadmin = require("./routes/admin"); 
const GetLanguages = require("./routes/admin");
const GenerateToken = require("./controller/generateAgoraToken");
const userRoutes = require("./routes/userRoutes");
const socketHandlers = require("./controller/socketController");
const db = require("./Database/db");

require("dotenv").config();
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

app.get("/", (req, res) => {
  res.status(200).send("Talkmatez Service is running!");
});

// Error handling middleware
app.use(errorHandler);

server.listen(process.env.PORT || 8080, () => {
  console.log("Server running on port 8080");
});
