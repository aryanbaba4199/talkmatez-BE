const Agora = require('agora-access-token'); 
const express = require('express');
const router = express.Router();

// Use your actual Agora App ID and certificate
const appId = '3523a8db9d994052bc9c3ba39d051bba'; // Replace with your Agora App ID
const certificate = '3523a8db9d994052bc9c3ba39d051bba'; 

const tokenExpiry = 3600; 
const role = Agora.RtcRole.PUBLISHER; 

// Token generation route
router.get('/', (req, res) => {
  const currentTime = Math.floor(Date.now() / 1000); 
  const expiry = currentTime + tokenExpiry; 
  const { channel, uid } = req.query; 

  try {
    console.log('Channel:', channel, 'UID:', uid);
    
    if (!channel || !uid) {
      return res.status(400).json({ error: 'Channel and UID are required' });
    }

    // Generate the Agora token using the channel and UID
    const token = Agora.RtcTokenBuilder.buildTokenWithUid(
      appId, 
      certificate, 
      channel, 
      uid, 
      role, 
      expiry
    );
    console.log(token);
    return res.status(200).json({ token});
  } catch (err) {
    console.error('Error generating token:', err);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router; // Exporting the router
