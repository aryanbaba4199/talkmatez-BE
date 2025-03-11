const Razorpay = require('razorpay');
const Transaction = require('../../models/users/txn')
const axios = require('axios')

const { error } = require('console');
const User = require('../../models/users/users');

const razorpay = new Razorpay({
    key_id : process.env.RZR_KEY,
    key_secret : process.env.RZR_SECRET
});

exports.createOrder =  async(req, res)=>{
    console.log('calling order')
    try{
        const formData = req.body;
        const options = {
            amount : formData.amount*100,
            currency : formData.currency,
            receipt : formData.receipt,
   
        }
        const order = await razorpay.orders.create(options);
        formData.orderId = order.id;
        formData.status = order.status;
        formData.token = order.token;
        formData.txnId = 'initiated';
        const txn = new Transaction(formData)
        await txn.save();
        
        
        console.log(order);
        res.status(200).json({order, dbTxnId : txn._id});

    }catch(e){
        console.error('Error in creating order', e)
    }
}



exports.VerifyRzr = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Verifying transaction:", id);

        if (!id) {
            console.log("Transaction ID not provided.");
            return res.status(400).json({ res: false, message: "Transaction ID is required." });
        }

        // Fetch transaction from your DB
        const dbTxn = await Transaction.findOne({ txnId: id });
        if (!dbTxn) {
            console.log("Transaction not found in database.");
            return res.status(404).json({ res: false, message: "Transaction not found in database." });
        }

        if (dbTxn.status === "success") {
            console.log("Payment already successful.");
            return res.status(200).json({ res: false, message: "Payment already marked as success." });
        }

        // Razorpay API Authentication
       const  key_id = process.env.RZR_KEY;
    const key_secret = process.env.RZR_SECRET;

        const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64");

        // Call Razorpay API
        const response = await axios.get(`https://api.razorpay.com/v1/payments/${id}`, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const transaction = response.data; // Razorpay API response
        console.log("Transaction status from Razorpay:", transaction.status);

        if (transaction.status === "captured") {
            console.log("Transaction is captured, marking success.");
            await Transaction.updateOne({ txnId: id }, { status: "success" });
            
            return res.status(200).json({ res: true, message: "Payment is successful.", transaction });
        } else {
            console.log("Transaction is NOT successful:", transaction.status);
            return res.status(400).json({ res: false, message: `Payment failed with status: ${transaction.status}` });
        }
    } catch (error) {
        console.error("Error in verification (Razorpay):", error.message);
        return res.status(500).json({ res: false, message: "Internal Server Error", error: error.message });
    }
};
