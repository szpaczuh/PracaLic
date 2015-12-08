var path = require('path');
var fs = require('fs');
var multiparty = require('multiparty');
var aws = require('aws-sdk');
aws.config.loadFromPath('./config/awsConfig.json');
var S3_BUCKET = 'pracalicencjacka';
var courses = [];

var crs = require('../model/course');
var usrs = require('../model/user');
var opinion = require('../model/opinions');
var askToJoin = require('../model/askToJoinCourse');

module.exports = function (app, passport) {

    app.get('/', function (req, res) {
        if (req.isAuthenticated()) {
            if (req.user.local.role === 'student') {
                res.render('indexStudent', {
                    data: 'Zalogowano jako ' + req.user.local.email,
                    user: req.user,
                    news: req.news

                });
            } else {

                res.render('indexTeacher', {
                    data: 'Zalogowano jako ' + req.user.local.email,
                    user: req.user
                });
            }
        } else {
            res.render('index', {
                user: undefined,
                data: 'Nie zalogowano'
            });
        }
    });

    app.get('/notloggedOpinions', function (req, res) {
        res.render('notloggedOpinions');


    });


    app.get('/login', function (req, res) {
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });

    app.get('/contact', function (req, res) {
        res.render('contact', {
            user: req.user
        });
    });

    app.get('/joinedcourses', function (req, res) {
        var resend = function (req, res) {
            var sendInfo = [];
            var dataToSend;
            courses.forEach(function (curs, i) {
                var joined = 0;
                curs.courseUsers.forEach(function (user) {
                    if (user.name == req.user.local.email) joined = 1;
                });
                if (joined) {
                    sendInfo.push(curs);
                }
            });
            if (sendInfo.length > 0) {
                dataToSend = "Twoje kursy :";
            } else {
                dataToSend = "Nie jestes zapisany do żadnego kursu";
            }
            res.render('joinedcourses', {
                user: req.user,
                courses: sendInfo.sort(sortCurses),
                data: dataToSend
            });
        };
        reorganizeUsers(resend, req, res);
    });

    app.get('/joined/:id', function (req, res) {
        crs.findOne({
            'id': req.params.id
        }, function (err, course) {

            if (err) {
                console.log('error loading course');
            }
            res.render('displayCourse', {
                user: req.user,
                courses: course
            });

        });

    });

    app.get('/contactTeacher', function (req, res) {
        res.render('contactTeacher', {
            user: req.user
        });
    });

    app.get('/studentaccount', function (req, res) {
        res.render('studentaccount', {
            user: req.user
        });
    });

    app.post('/login', passport.authenticate('login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.post('/autenticate', function (req, res) {
        resCourse = [];
        crs.findOne({
            'id': req.body.courseId
        }, function (err, course) {
            if (err) {
                console.log('Wystąpił błąd');
            } else {
                resCourse.push(course);
            }
        });
        usrs.findOne({
            'local.email': req.user.local.email
        }, function (err, user) {
            if (err) {
                console.log('error autenticating');
            } else if (!user) {
                res.render('details', {
                    message: 'Użytkownik z takim emailem juz istenieje!',
                    courses: resCourse,
                    user: req.user
                });
            } else if (!user.validPassword(req.body.pwd)) {
                res.render('details', {
                    message: 'Złe hasło!',
                    courses: resCourse,
                    user: req.user
                });
            } else {
                res.redirect('/usun/' + req.body.courseId);
            }

        });
    });

    app.post('/dodajNewsa', function (req, res) {
        crs.findOne({
            'id': req.body.courseId
        }, function (err, course) {
            if (err) {
                console.log('Wystąpił błąd');
            } else {
                var d = new Date();
                var newsa = {
                    tittle: req.body.newsTittle,
                    message: req.body.newInfo,
                    to: "all",
                    url: "joined/" + course.id,
                    date: d.getTime()
                };
                course.news.unshift(newsa);
                course.save();
            }
        });
        res.redirect('mycourses');
    });

    app.get('/details/:id', function (req, res) {
        resCourse = [];
        var studentsWillingToJoin = [];
        crs.findOne({
            'id': req.params.id
        }, function (err, course) {
            if (err) {
                console.log('Wystąpił błąd');
            } else {
                var quest = {
                    name: '',
                    email: '',
                    id: 0
                };

                askToJoin.find({}, function (err, questions) {
                    questions.forEach(function (question) {
                        if (question.teacher == req.user.local.email) {
                            console.log("teacher się zgadza");
                            if (question.courseId == req.params.id) {
                                console.log("kurs się zgadza");
                                quest.name = course.courseInfo.name;
                                quest.email = question.student;
                                quest.id = req.params.id;
                                studentsWillingToJoin.push(quest);
                            }
                        }
                    });
                    resCourse.push(course);
                    res.render('details', {
                        message: '',
                        courses: resCourse,
                        user: req.user,
                        studentsToJoin: studentsWillingToJoin
                    });
                });

            }
        });


    });

    app.get('/register', function (req, res) {
        res.render('register', {
            message: req.flash('registerMessage')
        });
    });

    app.post('/register', passport.authenticate('register', {
        successRedirect: '/profile',
        failureRedirect: '/register',
        failureFlash: true
    }));

    app.get('/profile', isLoggedIn, function (req, res) {

        if (req.user.local.role == 'student') {
            var nws = [];
            var crsss = [];
            var notJoined = [];
            crs.find({}, function (err, crss) {
                crss.forEach(function (course) {

                    var joined = 0;
                    course.courseUsers.forEach(function (user) {
                        if (user.name == req.user.local.email) joined = 1;
                    });
                    if (joined) {
                        crsss.push(course);
                    } else {
                        notJoined.push(course);
                    }

                });
                crsss.forEach(function (course) {
                    course.news.forEach(function (neww, i) {

                        if ((i <= 10) && (((neww.to == "all")) || (neww.to == req.user.local.email))) {

                            nws.push(neww);
                            
                        }
                    });
                });

                notJoined.forEach(function (course) {
                    course.news.forEach(function (neww, i) {

                        if ((i <= 10) && (neww.to == req.user.local.email)) {

                            nws.push(neww);

                        }
                    });
                });


                res.render('student', {
                    user: req.user,
                    news: nws.sort(sortNews)
                });
            });

        } else {
            res.render('teacher', {
                user: req.user
            });
        }
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });


    app.post('/changeaccount', function (req, res) {
        var name = req.body.firstName;
        var surname = req.body.surname;
        var password = req.body.password;

        usrs.findOne({
            'local.email': req.user.local.email
        }, function (err, userToEdit) {
            if (err) {
                throw (err);
            } else {
                if (name !== "") {
                    userToEdit.local.name = name;
                }
                if (surname !== "") {
                    userToEdit.local.surname = surname;
                }
                if (password !== "") {
                    userToEdit.local.password = userToEdit.generateHash(password);
                }
            }
            userToEdit.save(function (err) {
                if (err) {
                    throw (err);
                }
            })
        });

        res.render('changeaccountStudent', {
            user: req.user
        });
    });

    app.post('/changeaccountTeacher', function (req, res) {
        var name = req.body.firstName;
        var surname = req.body.surname;
        var phone = req.body.phone;
        var password = req.body.password;
        var province = req.body.province;
        var cities = req.body.city;
        var flag = 0;

        usrs.findOne({
            'local.email': req.user.local.email
        }, function (err, userToEdit) {
            if (err) {
                throw (err);
            } else {
                if (name !== "") {
                    userToEdit.local.name = name;
                }
                if (surname !== "") {
                    userToEdit.local.surname = surname;
                }
                if (phone !== "") {
                    userToEdit.local.phone = phone;
                }
                if (password !== "") {
                    userToEdit.local.password = userToEdit.generateHash(password);
                }
                if (province !== undefined) {
                    userToEdit.local.province = province;
                    flag = 1;
                }
                if (cities !== undefined) {
                    userToEdit.local.cities = cities;
                    flag = 2;
                }

                if(flag > 0) {
                    crs.find({ teacher: req.user.local.email}, function (err, courses) {
                       if(err){
                           throw (err);
                       } else {
                           if(flag === 1) {
                                for(i=0;i<courses.length;i++){
                                    courses[i].province = province;
                                    courses[i].save();
                                }
                           } else if (flag === 2) {
                                for(i=0;i<courses.length;i++){
                                    courses[i].province = province;
                                    courses[i].cities = cities;
                                    courses[i].save();
                                }
                           }
                       }
                    });
                }
            }
            userToEdit.save(function (err) {
                if (err) {
                    throw (err);
                }
            })
        });

        res.render('changeaccountTeacher', {
            user: req.user
        });
    });


    app.get('/teachers', function (req, res) {
        var renderTeacherData = [];

        usrs.find({}, function (err, teachers) {
            teachers.forEach(function (teacher) {

                if (teacher.local.role == 'teacher') {
                    renderTeacherData.push(teacher);
                }
            });
            res.render('teachers', {
                user: req.user,
                teachers: renderTeacherData
            });

        });

    });


    app.get('/teachersStudent', function (req, res) {
        var renderTeacherData = [];

        usrs.find({}, function (err, teachers) {
            teachers.forEach(function (teacher) {

                if (teacher.local.role == 'teacher') {
                    renderTeacherData.push(teacher);
                }
            });
            res.render('teachersStudent', {
                user: req.user,
                teachers: renderTeacherData
            });

        });

    });

    app.get('/teachersTeachers', function (req, res) {
        var renderTeacherData = [];

        usrs.find({}, function (err, teachers) {
            teachers.forEach(function (teacher) {

                if (teacher.local.role == 'teacher') {
                    renderTeacherData.push(teacher);
                }
            });
            res.render('teachersTeachers', {
                user: req.user,
                teachers: renderTeacherData
            });

        });

    });


    app.get('/student', function (req, res) {
        if (req.user.local.role == 'student') {
            res.redirect('/profile');
        } else {
            res.render('index');
        }

    });

    app.get('/teacher', function (req, res) {
        if (req.user.local.role == 'teacher') {
            res.render('teacher', {
                user: req.user
            });
        } else {
            res.render('index', {
                user: req.user
            });
        }


    });

    app.get('/searchall', function (req, res) {


        if (req.user.local.role == 'teacher') {
            res.redirect('/searchTeacher');

        } else if (req.user.local.role == 'student') {
            res.redirect('/searchStudent');
        }

        res.redirect('/search');


    });

    app.get('/opinion/:teacher', function (req, res) {
        var tchr = req.params.teacher;
        res.render('teacherOpinion', {
            user: req.user,
            teacher: tchr
        });

    });

    app.get('/search', function (req, res) {
        res.render('search');
    });

    app.get('/searchTeacher', function (req, res) {
        res.render('searchTeacher', {
            user: req.user
        });
    });

    app.get('/searchStudent', function (req, res) {
        res.render('searchStudent', {
            user: req.user
        });
    });

    app.get('/course', function (req, res) {
        var resend = function (req, res) {
            if (req.isAuthenticated()) {
                res.render('course', {
                    courses: courses.sort(sortCurses),
                    user: req.user
                });
            } else {
                res.render('courseNotLoggedIn', {
                    courses: courses.sort(sortCurses),
                    user: req.user
                });
                //funkcja do czyszczenia bazy danych z kursów - wywolywac ostroznie
                //                courses.forEach(function (id, course) {
                //                    console.log("beniz" + course);
                //                    crs.remove({
                //                        'id': course
                //                    }, function (err) {
                //                        console.log(err);
                //                    });
                //                });
            }
        };
        reorganizeUsers(resend, req, res);


    });

    app.get('/courseTeacher', function (req, res) {
        var resend = function (req, res) {
            if (req.isAuthenticated()) {
                res.render('courseTeacher', {
                    courses: courses.sort(sortCurses),
                    user: req.user
                });
            } else {
                res.render('courseNotLoggedIn', {
                    courses: courses.sort(sortCurses),
                    user: req.user
                });
                //funkcja do czyszczenia bazy danych z kursów - wywolywac ostroznie
                //                courses.forEach(function (id, course) {
                //                    console.log("beniz" + course);
                //                    crs.remove({
                //                        'id': course
                //                    }, function (err) {
                //                        console.log(err);
                //                    });
                //                });
            }
        };
        reorganizeUsers(resend, req, res);


    });


    app.get('/zapisz/:id', function (req, res) {
        if (req.user.local.role == 'student') {

            var ID = req.params.id;
            var question = new askToJoin();
            var join = true;


            crs.findOne({
                'id': ID
            }, function (err, course) {
                if (err) {
                    console.log('modafukin erro');
                } else {
                    askToJoin.find({
                        'teacher': course.teacher,
                        'student': req.user.local.email,
                        'courseId': req.params.id

                    }, function (err, questions) {

                        if (questions.length > 0) {

                            join = false;
                        }

                        if (join) {
                            question.teacher = course.teacher;
                            question.student = req.user.local.email;
                            question.courseId = ID;
                            question.save(function (err) {
                                if (err) {
                                    throw err;
                                }
                            });
                            var d = new Date();
                            var newsa = {
                                tittle: "Zgłoszenie na kurs",
                                message: "Zgłosiłeś się do kursu " + course.courseInfo.name,
                                to: req.user.local.email,
                                url: "/courseStatus",
                                date: d.getTime()
                            };

                            course.news.unshift(newsa);
                            course.save(function (err) {
                                if (err) {
                                    throw err;
                                }
                            });

                        } else {
                            console.log("exists");
                        }

                    });


                }

                res.redirect('/profile');
            });
        } else {
            res.redirect('/pageNotFound');
        }
    });

    app.get('/courseStatus', function (req, res) {
       
        var foundCourse = [];
        askToJoin.find({
            'student': req.user.local.email
        }, function (err, questions) {
            questions.forEach(function (question) {
                crs.findOne({
                    'id': question.courseId
                }, function (err, course) {
                     
                    if (err) {
                        console.log('modafukin erro');
                    } else {
                        
                        var crsToPush = {
                            tittle: course.courseInfo.name,
                            message: course.courseInfo.description
                        };
                        
                        foundCourse.unshift(crsToPush);
                        
                        
                    }

                });
            });
            
            setTimeout(function(){ res.render('courseStatus', {
                courses: foundCourse,
                user: req.user
            });}, 300);
           
        });
    });

    app.get('/zaakceptuj/:student/:courseId', function (req, res) {
        crs.findOne({
            'id': req.params.courseId
        }, function (err, course) {
            if (err) {
                console.log('modafukin erro');
            } else {
                var namee = {
                    name: req.params.student
                };
                var d = new Date();
                var newsa = {
                    tittle: "Zaakceptowano Zgłoszenie",
                    message: "Twoje zgłoszenie na kurs " + course.courseInfo.name + " zostało zaakceptowane",
                    to: req.params.student,
                    url: "/joined/" + course.id, 
                    date: d.getTime()
                };
                course.courseUsers.push(namee);
                course.news.unshift(newsa);

                course.save(function (err) {
                    if (err) {
                        throw err;
                    }
                });


                askToJoin.remove({
                    'teacher': req.user.local.email,
                    'student': req.params.student,
                    'courseId': req.params.courseId
                }, function (err) {
                    console.log(err);
                });

            }
        });
        res.redirect('/details/'+req.params.courseId);
    });

    app.get('/odrzuc/:student/:courseId', function (req, res) {

        crs.findOne({
            'id': req.params.courseId
        }, function (err, course) {
            if (err) {
                console.log('modafukin erro');
            } else {
                var d = new Date();

                var newsa = {
                    tittle: "Odrzucono Zgłoszenie",
                    message: "Twoje zgłoszenie na kurs " + course.courseInfo.name + " zostało odrzucone\nZobacz zamiast tego inne kursy",
                    to: req.params.courseId,
                    url: "/course",
                    date: d.getTime()
                };

                course.news.unshift(newsa);
                course.save(function (err) {
                    if (err) {
                        throw err;
                    }
                });


                askToJoin.remove({
                    'teacher': req.user.local.email,
                    'student': req.params.student,
                    'courseId': req.params.courseId
                }, function (err) {
                    console.log(err);
                });

            }
        });
        res.redirect('/details/' + req.params.courseId);
    });


    app.get('/wypisz/:id', function (req, res) {
        var ID = req.params.id;
        crs.findOne({
            'id': ID
        }, function (err, course) {
            if (err) {
                console.log('modafukin erro');
            } else {

                course.courseUsers.forEach(function (user, i) {
                    if (user.name == req.user.local.email) {
                        course.courseUsers.splice(i, 1);
                    }
                });

                course.save(function (err) {
                    if (err) {
                        console.log('error saving user');
                        throw err;
                    }
                });
            }
        });
        res.redirect('/joinedcourses');
    });

    app.get('/usun/:id', function (req, res) {
        var ID = req.params.id;

        crs.remove({
            'id': ID
        }, function (err) {
            console.log(err);
        });
        res.redirect('/mycourses');
    });


    app.get('/teacheraccount', function (req, res) {
        res.render('teacheraccount', {
            user: req.user,
            message: ""
        });
    });

    app.get('/addcourse', function (req, res) {
        res.render('addcourse', {
            user: req.user
        });
    });

    app.get('/index', function (req, res) {
        res.render('index', {
            user: req.user
        });
    });

    app.get('/mycourses', function (req, res) {
        var resnd = function (req, res) {
            var myCourses = [];
            courses.forEach(function (course) {
                if (course.teacher == req.user.local.email) {
                    myCourses.push(course);
                }
            });
            lastCourses = myCourses;
            res.render('myCourses', {
                data: "Kursy uzytkownika " + req.user.local.email,
                courses: myCourses.sort(sortCurses),
                user: req.user
            });
        };
        reorganizeUsers(resnd, req, res);
    });

    app.post('/newcourse', function (req, res) {

        if(req.user.local.province === ""){
            res.render('teacheraccount', {
                user: req.user,
                message: "Update"
            });
        } else {
            var resnd = function (req, res) {
                var newCourse = new crs();
                newCourse.id = courses.length;
                newCourse.teacher = req.user.local.email;
                newCourse.province = req.user.local.province;
                newCourse.cities = req.user.local.cities;
                newCourse.courseInfo.name = req.body.courseName;
                newCourse.courseInfo.subject = req.body.Subject;
                newCourse.courseInfo.description = req.body.courseDescription;
                newCourse.courseInfo.costPerHour = req.body.costPerHour;
                newCourse.files = [];
                newCourse.level = req.body.educationLevel;

                newCourse.save(function (err) {
                    if (err) {
                        throw err;
                    }
                });

                courses.push(newCourse);
                res.redirect('/mycourses');
            };
            reorganizeUsers(resnd, req, res);
        }
    });
    app.post('/opinion', function (req, res) {

        opinion.find({}, function (err, opn) {
            var newOpinion = new opinion();

            newOpinion.id = opn.length;
            newOpinion.teacher = req.body.teacher;
            newOpinion.opinion = req.body.opinion;
            newOpinion.student = req.user.local.email;

            newOpinion.save(function (err) {
                if (err) {
                    console.log('error saving opinion');
                    throw err;
                }
            });

            res.redirect('/opinions');

        });

    });
    app.get('/opinions', function (req, res) {
        var opinions = [];
        opinion.find({}, function (err, opn) {
            opn.forEach(function (opin) {
                opinions.push(opin);
            });
            res.render('opinions', {
                user: req.user,
                opinions: opinions
            });
        });

    });

    app.get('/usunOpinion/:id', function (req, res) {
        opinion.remove({
            'id': req.params.id
        }, function (err) {
            console.log(err);
        });
        res.redirect('/opinions');
    });


    app.get('/opinionsTeacher', function (req, res) {
        var opinions = [];
        opinion.find({}, function (err, opn) {
            opn.forEach(function (opin) {
                opinions.push(opin);
            });
            res.render('opinionsTeacher', {
                user: req.user,
                opinions: opinions
            });
        });

    });

    app.get('/cities/:id', function (req, res) {
        var id = req.params.id;
        res.sendFile(path.resolve('views/cities/' + id + '.html'));
    });

    app.get('/citiesCheck/:id', function (req, res) {
        var id = req.params.id;
        res.sendFile(path.resolve('views/cities/' + id + 'check.html'));
    });

    app.post('/upload', function (req, res) {
        var form = new multiparty.Form();
        form.parse(req, function (err, fields, files) {
            var image = files.imageUploader[0];
            req.user.local.avatar.data = fs.readFileSync(image.path);
            req.user.local.avatar.contentType = image.headers['content-type'];
            req.user.save();
            if (req.user.local.role === "student") {
                res.render('studentAccount', {
                    user: req.user
                });
            } else {
                res.render('teacherAccount', {
                    user: req.user,
                    message: ""
                });
            }
        });
    });

    app.post('/addFile', function (req, res) {
        var form = new multiparty.Form();
        form.parse(req, function (err, fields, files) {
            var file = files.fileUploader[0];
            var filename = file.originalFilename;

            crs.findOne({
                'id': fields.courseId[0]
            }, function (err, course) {
                if (err) {
                    console.log('modafukin erro');
                } else {
                    var urlString = "https://s3-eu-west-1.amazonaws.com/pracalicencjacka/" + filename;
                    var jsonFile = {
                        name: filename,
                        url: urlString
                    };
                    var d = new Date();
                    var newsa = {
                    tittle: "Nowy Materiał",
                    message: "Dodano nowy materiał naukowy do Twojego kursu",
                    to: "all",
                    url: "joined/" + course.id,
                    date: d.getTime()
                };
                    course.news.unshift(newsa);
                    course.files.push(jsonFile);
                    course.save();
                }
            });

            fs.readFile(file.path, function (err, data) {
                if (err) {
                    throw (err);
                }

                var s3 = new aws.S3();
                s3.putObject({
                    Bucket: S3_BUCKET,
                    Key: filename,
                    Body: data
                }, function (err) {
                    if (err) {
                        throw (err);
                    }
                });
                res.redirect('/mycourses');
            });
        });
    });

    app.post('/search', function (req, res) {
        var province = req.body.province;
        var city = req.body.city;
        var educationLevel = req.body.level;
        var subject = req.body.subject;
        var minimum = req.body.minimum;
        var maximum = req.body.maximum;
        var flag = true;
        var query = {};

        if (!(province === undefined)) {
            query.province = province;

            if (!(city === undefined)) {
                query.cities = {$in: [city]};
            }
        }

        if (!(educationLevel === undefined)) {
            query.level = {$in: [educationLevel]};
        }

        if (!(subject === undefined)) {
            query.subject = subject;
        }

        if (!(minimum === "")) {
            if (!(maximum === "")) {
                query["courseInfo.costPerHour"] = {$gt: parseInt(minimum, 10), $lt: parseInt(maximum, 10)};
                flag = false;
            } else {
                query["courseInfo.costPerHour"] = {$gt: parseInt(minimum, 10)};
            }
        }

        if (!(maximum === "") && flag) {
            query["courseInfo.costPerHour"] = {$lt: parseInt(maximum, 10)};
        }

        crs.find(query, function (err, courses) {
            if(req.user === undefined) {
                res.render('courseNotLoggedIn', {
                    courses: courses.sort(sortCurses),
                    user: req.user
                });
            } else {
                if(req.user.local.role === "student") {
                    res.render('course', {
                        courses: courses.sort(sortCurses),
                        user: req.user
                    });
                } else if(req.user.local.role === "teacher"){
                    res.render('courseTeacher', {
                        courses: courses.sort(sortCurses),
                        user: req.user
                    });
                }
            }
        });
    });


    //to musi być na końcu, zostawić to tutaj!!!
    app.get('*', function (req, res) {
        res.status(404);
        res.render('myFavouritePage', {
            tittle: "page not found",
            user: req.user
        });
    });

};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) { // jesli zalogowany - dalej
        return next();
    }

    res.redirect('/login'); // jesli nie - index
}

var reorganizeUsers = function (cb, req, res) {
    courses = [];
    crs.find({}, function (err, crss) {
        crss.forEach(function (course) {
            courses.push(course);
        });
        if (cb) cb(req, res);
    });

};

var sortCurses = function (a, b) {
    return a.id - b.id;
};
var sortNews = function (a, b) {
    return b.date - a.date;
};

var usunOpinie = function () {
    opinion.remove({}, function (err) {
        console.log(err);
    });
};
/*
 exports.nauczyciel = function(req, res) {

 var imieNazwisko = req.params.id;
 var imie = imieNazwisko.split('.');
 console.log(imie);
 var xml = '<?xml version="1.0" encoding="utf-8"?>\n';
 xml += '<response><ip>' + '</ip><tm>' + '</tm></response>';
 res.setHeader("Cache-Control", "no-cache, must-revalidate");
 res.setHeader("Pragma", "no-cache");
 res.setHeader("Content-Type", "text/xml; charset=utf-8");
 res.end(xml);

 };*/
