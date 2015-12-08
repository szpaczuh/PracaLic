var mongoose = require('mongoose');

var opinionSchema = mongoose.Schema({
    
       id : Number,
       teacher : String,
       student : String,
       opinion : String
});


module.exports = mongoose.model('Opinion', opinionSchema);
