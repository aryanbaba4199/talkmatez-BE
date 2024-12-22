const crypto = require('crypto');
const axios = require('axios');

const merchantId = process.env.MERCHANT_ID;
const saltKey = process.env.PHONEPATY_SALT_KEY;
const saltIndex = process.env.PHONEPATY_SALT_ID;

const createSignature = (payload) => {
  const data = payload + "/" + saltKey;
  return crypto.createHash("sha256").update(data).digest("hex");
};

exports.initiatePayment = async (req, res) => {
  const options = {
    method: 'post',
    url: 'https://api.phonepe.com/apis/hermes/pg/v1/pay',
    headers: {
          accept: 'text/plain',
          'Content-Type': 'application/json',
          },
  data: {
  }
  };
  axios
    .request(options)
        .then(function (response) {
        console.log(response.data);
    })
    .catch(function (error) {
      console.error(error);
    });
};

exports.verifyPayment = async(req, res)=>{
  console.log(req.body);
    // try{
    //     const { transactionId } = req.body;
    //     const payload = {
    //         merchantId, transactionId
    //     };
    //     const payloadString = JSON.stringify(payload);
    //     const signature = createSignature(payloadString);
    //     const option = {
    //         method: "POST",
    //         url: "https://api.phonepe.com/apis/hermes/payments/status",
    //         headers: {
    //             "Content-Type": "application/json",
    //             "X-VERIFY": `${signature}###${saltIndex}`,
    //         },
    //         data: payload,
    //     }
    //     const response = await axios(option);
    //     res.status(200).json({ success: true, data: response.data });
    // } catch (error) {
    //     console.error("Payment verification failed", error);
    //     res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
    // }
}

exports.generateCryptoString = async(req, res)=>{
  const {payload} = req.body;
  
  try{
    const data = crypto
    .createHmac('sha256', saltKey)
    .update(JSON.stringify(payload))
    .digest('hex');
    console.log(data);
    res.status(200).json(data);
  }catch(error){
    console.error("Error generating crypto string", error);
    res.status(500).json({ success: false, message: "Error generating crypto string", error: error.message });
  }
}