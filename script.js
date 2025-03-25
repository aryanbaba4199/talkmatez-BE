const { MongoClient } = require('mongodb');

async function updateIds(uri) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db('test');
    const collection = db.collection('tutors');

    const generateCustomId = () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let letterIndex = 0;
      let number = 1;

      return () => {
        const letterPart = letters[Math.floor(letterIndex / (26 * 10000))] +
                           letters[Math.floor((letterIndex % (26 * 10000)) / 10000)] +
                           letters[Math.floor((letterIndex % 10000) / 10000)];
        const numberPart = String(number).padStart(4, '0');

        if (number === 9999) {
            number = 0;
            letterIndex++;
        } else {
            number++;
        }
        return letterPart + numberPart;
      };
    };

    const idGenerator = generateCustomId();

    const users = await collection.find({}).toArray();
    console.log("Number of users found:", users.length);

    for (const user of users) {
        const newId = idGenerator();
        console.log("Generated ID:", newId);
        await collection.updateOne({ _id: user._id }, { $set: { customid: newId } });
    }

    console.log('User IDs updated successfully.');
  } catch (error) {
    console.error('Error updating IDs:', error);
  } finally {
    await client.close();
  }
}

const uri = 'mongodb+srv://aryanbaba4199:Aryan7277@cluster0.fjkctxi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
updateIds(uri);