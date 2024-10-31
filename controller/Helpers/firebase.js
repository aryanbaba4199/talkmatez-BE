const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./path/to/serviceAccountKey.json')),
});

const sendCallNotification = async (deviceToken) => {
  const message = {
    notification: {
      title: 'Incoming Call',
      body: 'You have an incoming call from a student.',
    },
    data: {
      type: 'incoming_call',
    },
    token: deviceToken,
  };

  try {
    await admin.messaging().send(message);
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
