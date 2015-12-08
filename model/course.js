var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var courseSchema = mongoose.Schema({
    id: Number,
    teacher: String,
    courseInfo: {
        name: String,
        subject: String,
        description: String,
        costPerHour: Number
    },
    courseUsers: [{ name: String}],
    level: [String],
    news: [{ tittle: String, message: String, to: String, url: String, date:Number }],
    files: [{ name: String, url: String }],
    province: String,
    cities: [String]
});


module.exports = mongoose.model('Course', courseSchema);
