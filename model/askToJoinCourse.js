//tabela relacja nauczyciel - uczen - kurs
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var askSchema = mongoose.Schema({
    teacher: String,
    student: String,
    courseId: Number
});


module.exports = mongoose.model('AskToJoin', askSchema);
