var LocalStrategy = require('passport-local').Strategy;

var User = require('../model/user');

module.exports = function (passport) {

    // zarzadzanie sesja
    passport.serializeUser(function(user, done){
       done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
       User.findById(id, function(err, user){
           done(err, user);
       });
    });

    passport.use('register', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        process.nextTick(function(){
            User.findOne({ 'local.email' : email }, function(err, user) {
                if (err) {
                    return done(err);
                }

                if(user){
                    return done(null, false, req.flash('registerMessage', 'This email is already taken!'));
                } else {
                    var newUser = new User();
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.role = req.body.role;
                    newUser.local.name = "";
                    newUser.local.surname = "";
                    newUser.local.province = "";
                    newUser.local.cities = [];
                    newUser.local.phone = "";

                    newUser.save(function(err){
                        if(err){
                            throw err;
                        }
                        return done(null, newUser);
                    });
                }
            });
        });
    }));

    passport.use('login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
        function (req, email, password, done) {
            User.findOne({ 'local.email' : email}, function (err, user) {
                if(err) {
                    return done(err);
                }

                if(!user) {
                    return done(null, false, req.flash('loginMessage', 'User with this email doesnt exist!'));
                }

                if(!user.validPassword(password)) {
                    return done(null, false, req.flash('loginMessage', 'Wrong password!'));
                }

                return done(null, user);
            });
        }));
};