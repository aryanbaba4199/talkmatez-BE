const axios = require("axios");
const { client, xml } = require("@xmpp/client");
require("dotenv").config();


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const XMPP_URI = `http://${process.env.XMPPIP}/api`;
const XMPP_CONFIG = {
  service: `xmpp://${process.env.XMPPIP}:5222`,
  domain: process.env.XMPPIP,
  username: process.env.XMPPUN,
  password: process.env.XMPPPASS,
  tls: {
    rejectUnauthorized: false // disable cert check for dev
  
  }
};

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
  }, 30000); // Every 30 seconds
};

// Initialize connection when module loads
getXmppClient().catch((err) =>
  console.error("Initial XMPP connection failed:", err)
);
startHealthChecks();

// API Functions
exports.registeronxmpp = async (uri, formData) => {
  try {
    const res = await axios.post(`${XMPP_URI}/${uri}`, formData, {
      auth: {
        username: "admin@localhost",
        password: "pass",
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { registered: true, message: "User registered on XMPP server" };
  } catch (e) {
    console.error("Error in registering on XMPP:", e.message);
    return { registered: false, message: "User registration failed" };
  }
};

exports.getxmppusers = async () => {
  try {
    const res = await axios.get(`${XMPP_URI}/registered_users?host=localhost`);
    return { success: true, data: res.data };
  } catch (e) {
    console.error("Error getting XMPP users:", e.message);
    return { success: false, error: e.message };
  }
};

exports.sendXmppMessage = async (to, message) => {
  if (!to || !message) {
    console.error('Missing recipient or message');
    return { success: false, error: 'Missing recipient or message' };
  }

  try {
    const xmpp = await getXmppClient();
    const messageContent = typeof message === 'object' ? JSON.stringify(message) : String(message);
    const toJid = to.includes('@') && !to.includes('/') ? `${to}/react-app-teacher` : to;
    const messageXML = xml(
      'message',
      { to: toJid, type: 'chat', id: Date.now().toString() },
      xml('body', {}, messageContent)
    );

    await xmpp.send(messageXML);
    console.log('📤 Sent message to', toJid, 'with content:', messageContent);
    return { success: true };
  } catch (err) {
    console.error('❌ Failed to send XMPP message:', err);
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