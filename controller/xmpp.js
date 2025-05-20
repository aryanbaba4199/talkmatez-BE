const axios = require("axios");
const { client, xml } = require("@xmpp/client");
const https = require("https");
const Tutors = require("../models/Tutors/tutors");
const admin = require("firebase-admin");
require("dotenv").config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const xmppIp = process.env.XMPPIP;
const ADMIN_JID = `admin@${process.env.XMPPIP}`;
const ADMIN_PASS = process.env.XMPPPASS;
const API_BASE = `https://${process.env.XMPPIP}:5443/api`;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const HINTS_NS = "urn:xmpp:hints";

const XMPP_CONFIG = {
  service: `xmpp://${process.env.XMPPIP}:5222`,
  domain: process.env.XMPPIP,
  username: process.env.XMPPUN,
  password: process.env.XMPPPASS,
  // tls: {
  //   rejectUnauthorized: false, // disable cert check for dev
  // },
};

// const XMPP_URI = `http://localhost:5280/api`;
// const XMPP_CONFIG = {
//   service: "xmpp://localhost:5222",
//   domain: "localhost",
//   username: "admin",
//   password: "pass",
// };

// Persistent XMPP connection
let xmppClient = null;
let connectionPromise = null;
let isConnected = false;

// Initialize and maintain single XMPP connection
const getXmppClient = async () => {
  if (xmppClient && isConnected) return xmppClient;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      xmppClient = client(XMPP_CONFIG);

      xmppClient.on("error", (err) => {
        console.error("XMPP Error:", err);
        isConnected = false;
        connectionPromise = null;
      });
      xmppClient.on("offline", () => {
        console.log("XMPP Offline");
        isConnected = false;
        connectionPromise = null;
      });
      xmppClient.on("online", (address) => {
        console.log("✅ Persistent XMPP connected as", address.toString());
        isConnected = true;
      });
      xmppClient.on("stanza", (stanza) => {
      if (stanza.is("message")) {
        const received = stanza.getChild("received", "urn:xmpp:receipts");
        if (received) {
          const msgId = received.attrs.id;
          const from = stanza.attrs.from;
          console.log(`📥 Delivery receipt from ${from} for message id ${msgId}`);
          // Here you can update your DB or application state to mark message delivered
        }
      }
    });

      await xmppClient.start();
      return xmppClient;
    } catch (err) {
      console.error("XMPP Connection Error:", err);
      isConnected = false;
      connectionPromise = null;
      throw err;
    }
  })();

  return connectionPromise;
};

// Health check to maintain connection
const startHealthChecks = () => {
  setInterval(async () => {
    try {
      const client = await getXmppClient();
      if (isConnected) {
        await client.send(xml("presence"));
        console.log("Health check: Presence sent");
        
      }
    } catch (err) {
      console.error("Health check failed:", err.message);
    }
  }, 100000); // Every 30 seconds
};

// Initialize connection when module loads
getXmppClient().catch((err) =>
  console.error("Initial XMPP connection failed:", err)
);
startHealthChecks();

// API Functions
exports.registeronxmpp = async (uri, formData) => {
  try {
    formData.host = xmppIp;
    console.log("uri is ", uri, formData);
    const res = await axios.post(`${API_BASE}/${uri}`, formData, {
      auth: { username: ADMIN_JID, password: ADMIN_PASS },
      headers: { "Content-Type": "application/json" },
      httpsAgent,
    });
    return { registered: true, message: "User registered on XMPP server" };
  } catch (e) {
    console.error("Error in registering on XMPP:", e.message);
    return { registered: false, message: "User registration failed" };
  }
};

// exports.getxmppusers = async () => {
//   try {
//     const res = await axios.get(`${XMPP_URI}/registered_users?host=104.197.117.162`, );
//     return { success: true, data: res.data };
//   } catch (e) {
//     console.error("Error getting XMPP users:", e.message);
//     return { success: false, error: e.message };
//   }
// };

exports.getxmppusers = async () => {
  try {
    const res = await axios.get(`${API_BASE}/registered_users?host=${xmppIp}`, {
      auth: {
        username: ADMIN_JID,
        password: ADMIN_PASS,
      },
      httpsAgent,
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("users are", res.data);
    return { success: true, data: res.data };
  } catch (e) {
    console.error("Error getting XMPP users:", e.message);
    return { success: false, error: e.message };
  }
};

exports.sendXmppMessage = async (toBare, payload) => {
  if (!toBare || !payload)
    return { success: false, error: "Missing to / payload" };
    const fcmData = {}
    notifyViaFcm(toBare, payload.eventType, payload.data, )
    console.log('id is ', toBare, 'data is', payload)
  // try {
  //   const xmpp = await getXmppClient();
  //   const body =
  //     typeof payload === "object" ? JSON.stringify(payload) : String(payload);
  //   const toJid = toBare.includes("@")
  //     ? toBare
  //     : `${toBare}@${xmppIp}`;

  //   const stanza = xml(
  //     "message",
  //     { to: toJid, type: "chat", id: Date.now().toString() },
  //     // 👇 prevent Ejabberd from storing / replaying this message
  //     xml("no-store", { xmlns: HINTS_NS }),
  //     xml("no-permanent", { xmlns: HINTS_NS }),
  //     xml("no-copy", { xmlns: HINTS_NS }),
  //     xml("body", {}, body),
  //     xml("request", { xmlns: "urn:xmpp:receipts" }) 
  //   );

  //   await xmpp.send(stanza);
  //   console.log("📤 Sent 1‑to‑1 to", toJid);
  //   return { success: true };
  // } catch (e) {
  //   console.error("❌ sendXmppMessage:", e.message);
  //   return { success: false, error: e.message };
  // }
};

// utils/xmpp.js  (or wherever you keep it)
exports.broadcastMessage = async (eventType, tid, msg) => {
  try {
    // ⚡️ 1. Get a live XMPP connection
    const xmpp = await getXmppClient();

    // ⚡️ 2. Ask the Ejabberd REST API who’s online
    const res = await axios.post(
      `${API_BASE}/connected_users_info`,
      {},
      {
        auth: {
          username: ADMIN_JID,
          password: ADMIN_PASS,
        },
      }
    );

    // ⚡️ 3. Keep only “real” online users (skip admin + RN‑teacher app)
    const sessions = res.data.filter(
      (u) =>
        u.status === "available" &&
        !u.jid.startsWith("admin") &&
        !u.jid.endsWith("/react-native-teacher")
    );

    if (sessions.length === 0) {
      console.log("🤷 No one online");
      return { success: true, delivered: 0 };
    }

    let delivered = 0;
    let failed = 0;

    // ⚡️ 4. Broadcast the message
    await Promise.all(
      sessions.map(async (s, idx) => {
        const bareJid = s.jid.split("/")[0]; // Strip resource

        const payload = {
          eventType,
          tid,
          msg,
        };

        const stanza = xml(
          "message",
          { to: bareJid, type: "chat", id: `${Date.now()}-${idx}` },
          xml("body", {}, JSON.stringify(payload))
        );

        try {
          await xmpp.send(stanza);
          delivered++;
        } catch (err) {
          failed++;
          console.error(`❌ Failed to send to ${bareJid}:`, err.message);
        }
      })
    );

    console.log(`📢 Broadcast: delivered ${delivered}, failed ${failed}`);
    return { success: failed === 0, delivered, failed };
  } catch (err) {
    console.error("❌ broadcastMessage error:", err.message);
    return { success: false, error: err.message };
  }
};





// Graceful shutdown handler
process.on("SIGINT", async () => {
  if (xmppClient && isConnected) {
    await xmppClient.stop().catch(console.error);
  }
  process.exit();
});


const notifyViaFcm = async (tutorId, eventType, data) => {
  try {
    // Fetch tutor FCM token from DB (make sure you await this!)
    const tutor = await Tutors.findById(tutorId).select('fcmToken').lean();
  
    if (!tutor || !tutor.fcmToken) {
      console.warn(`No FCM token found for tutorId: ${tutorId}`);
      return false;
    }

    console.log("Sending call notification via FCM to token:", tutor.fcmToken);

    const message = {
      token: tutor.fcmToken,
      data: {
        eventType : String(eventType),
        agoraToken: String(data.agoraToken),
        tid: String(data.tid),
        channel: String(data.channel),
        userName: "Unknown",
      },
      
    };

    try {
      const res = await admin.messaging().send(message);
      console.log('FCM message sent:', res, "token", tutor.fcmToken);
      return true;
    } catch (error) {
      console.error("Error sending FCM notification:", error);
      return false;
    }

  } catch (error) {
    console.error("Error in handleFcmNotifier:", error);
    return false;
  }
};
