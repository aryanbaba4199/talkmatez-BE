const User = require('../../models/users/users');
const CallLogs = require('../../models/users/calllogs');
const axios = require('axios');
const Tutor = require('../../models/Tutors/tutors');

exports.CallTiming = async (req, res, next) => {
    const { formData } = req.body;
    console.log('formData', formData);

    try {
        // Fetch the current time from the API
        const timeRes = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata');
        const currentTime = timeRes.data.dateTime; 

        const call = new CallLogs({ ...formData, start: currentTime });
        await call.save();

        res.status(200).json({ id: call._id });
    } catch (err) {
        console.log('Error fetching time:', err);
        next(err);
    }
};

exports.updateCallTiming = async (req, res, next) => {
    const {data} = req.body;
    console.log(data?.id); 

    try {
       
        const timeRes = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata');
        const currentTime = timeRes.data.dateTime; 

       
        const updatedCall = await CallLogs.findByIdAndUpdate(
            data.id,
            { end: currentTime },
            { new: true }
        );
        console.log(updatedCall);

        if (!updatedCall) {
            return res.status(404).json({ message: "Call log not found" });
        }

        res.status(200).json(updatedCall);
    } catch (err) {
        console.log('Error updating call timing:', err);
        next(err);
    }
};

exports.callDetails = async (req, res, next) => {
    const { id } = req.params;
    try {
        const logs = await CallLogs.find({ userId: id }).populate({
            path: 'secUserId',
            model: Tutor, 
            select: 'name',
        });


        if (logs.length > 0) {
            
            const callDetails = logs.map(log => ({
                tutorName: log.secUserId ? log.secUserId.name : 'Unknown Tutor',
                start: log.start,
                end: log.end,
            }));

            return res.status(200).json({ callDetails });
        } else {
            return res.status(404).json({ message: 'No call logs found for this user' });
        }
    } catch (err) {
        console.error('Error getting call logs', err);
        next(err);
    }
};

exports.fullLogs = async(req, res, next) => {
    try{
        const data = await CallLogs.find();
        return res.status(200).json(data);
    }catch(e){
        console.error(e)
        next(e);
    }
}

