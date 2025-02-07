const Agora = require('agora-access-token'); 
const express = require('express');
const router = express.Router();
require('dotenv').config();


const appId = process.env.AGORA_APP_ID;
const certificate = process.env.AGORA_CERTIFICATE;  

 

const tokenExpiry = 3600; 
const role = Agora.RtcRole.PUBLISHER; 


router.get('/', (req, res) => {
  const currentTime = Math.floor(Date.now() / 1000); 
  const expiry = currentTime + tokenExpiry; 
  const { channel, uid } = req.query; 

  try {

    console.log('user id is',uid)
    if (!channel || !uid) {
      return res.status(400).json({ error: 'Channel and UID are required' });
    }
 console.log('user id is',uid, channel)
    const token = Agora.RtcTokenBuilder.buildTokenWithUid(
      appId, 
      certificate, 
      channel, 
      0, 
      role, 
      expiry
    );
    console.log('Token generated:', token);
 
    return res.status(200).json({ token});
  } catch (err) {
    console.error('Error generating token:', err);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router; // Exporting the router
