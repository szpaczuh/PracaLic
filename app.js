var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var configDB = require('./config/database.js');
var routes = require('./routes');
var path = require('path');
var static = require('serve-static');

mongoose.connect(configDB.url);

require('./config/passport')(passport);

app.use('/js/jquery.min.js', static(__dirname + '/bower_components/jquery/dist/jquery.min.js'));
app.use('/js/jquery.min.map', static(__dirname + '/bower_components/jquery/dist/jquery.min.map'));
app.use(express.static(path.join(__dirname)));
// express
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json()); // html formsy
app.use(bodyParser.urlencoded({ extended:true }));

app.set('view engine', 'ejs');

// passport
app.use(session({ secret: '5Tnc0Sv2bMt0D536Jv69MQg5j5sT3tXd' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes
require('./routes/index.js')(app, passport);

app.listen(port, function () {
	console.log('Serwer oczekuje na połączenia na porcie ' + port);
});