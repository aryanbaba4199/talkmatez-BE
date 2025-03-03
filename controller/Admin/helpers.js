const Languages = require("../../models/helpers/languages");
const Guide = require("../../models/helpers/sliders");
const Country = require("../../models/helpers/country");

exports.getLanguages = async (req, res, next) => {
  try {
    const langData = await Languages.find();
    res.status(200).json(langData);
  } catch (err) {
    next(err);
  }
};

exports.createLanguages = async (req, res, next) => {
  const { name } = req.body;
  console.log(name);
  try {
    const langData = await Languages.create({ name: name });
    res.status(200).json(langData);
  } catch (err) {
    next(err);
  }
};

exports.deleteLanguage = async (req, res, next) => {
  const { id } = req.params;
  try {
    const lang = await Languages.findByIdAndDelete(id);
    if (lang) {
      res.status(200).json({ message: "Language deleted successfully" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};


exports.createGuide = async(req, res, next) => {
    try{
        const newGuide = await Guide.create(req.body);
        res.status(200).json({message : 'Guide created successfully'});
    }catch (err) {
        console.error('Errro in creating', err);
        next(err);
    }
}

exports.getGuide = async(req, res, next) => {
    try{
        const guides = await Guide.find();
        res.status(200).json(guides);
    }catch(e){
        console.error('Error in getting guide', e)
    }
}

exports.deleteGuide = async(req, res, next) => {
    try{
        const {id} = req.params;
        const guide = await Guide.findByIdAndDelete(id);
        if(guide){
            res.status(200).json({message : 'Guide deleted successfully'});
        }
    }catch(e){
        console.error('Error in deleting guide', e);
    }
};



//=------------------Countries --------------------------------

exports.createCountry = async(req, res, next) => {
    try{
        const newCountry = await Country.create(req.body);
        res.status(200).json({message : 'Country created successfully'});
    }catch (err) {
        console.error('Errro in creating', err);
        next(err);
    }
}

exports.getCountries = async(req, res, next) => {
    try{
        const countries = await Country.find();
        res.status(200).json(countries);
    }catch(e){
        console.error('Error in getting countries', e)
    }
}

exports.deleteCountry = async(req, res, next) => {
    try{
        const {id} = req.params;
        const country = await Country.findByIdAndDelete(id);
        if(country){
            res.status(200).json({message : 'Country deleted successfully'});
        }
    }catch(e){
        console.error('Error in deleting country', e);
    }
}


