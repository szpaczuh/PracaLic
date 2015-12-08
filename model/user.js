var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
   local            : {
       email        : String,
       password     : String,
       courses      : [{ id : Number }],
       role         : String,
       province     : String,
       cities       : [String],
       avatar       : { data: Buffer, contentType: String },
       name         : String,
       surname      : String,
       phone        : String
   }
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);