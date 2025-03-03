const { client, xml } = require("@xmpp/client");

const xmpp = client({
  service: "xmpp://localhost:5222", // XMPP Server
  domain: "localhost",
  username: "admin",  // Replace with real admin user
  password: "7277", 
  tls: { rejectUnauthorized: false },
  
});

// ✅ Connection Events
xmpp.on("online", (address) => {
  console.log(`✅ XMPP Server Connected as ${address}`);
  xmpp.send(xml("presence", {})); // Show as online
});

// ❌ Error Handling
xmpp.on("error", (err) => console.error("❌ XMPP Error:", err));

// 🔄 Incoming Messages
xmpp.on("stanza", (stanza) => {
  if (stanza.is("message")) {
    console.log(`📩 Message from ${stanza.attrs.from}:`, stanza.getChildText("body"));
  }
});

// 🚀 Start XMPP Connection
xmpp.start().catch(console.error);
