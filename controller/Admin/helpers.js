
const languages = ["Hindi", "English", "Arabic", "Spanish", "Japanese", "Chinese", "Korean"]


exports.getLanguages = async(req, res, next)=>{
    try{
        res.status(200).json(languages)
    }catch(err){
        next(err);
    }
}