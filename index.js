require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const _ = require('lodash');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// passport authentications 
app.set('trust proxy', 1) // trust first proxy
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET) );
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


// connect to mongo Atlas
const localUrl = "mongodb://127.0.0.1:27017/maskUserDB"
const clusterUsername = process.env.CLUSTER_USERNAME;
const clusterPassword = process.env.CLUSTER_PASSWORD;
const atlasUrl = "mongodb+srv://" + clusterUsername + ":" + clusterPassword + "@cluster0.p0vhcs6.mongodb.net/maskUserDB";

// connect to mongoDB atlas
mongoose.connect(localUrl)
    .then (() => {
        console.log("connected");
    })
    .catch((err) => {
        console.log(err);
});


//Schema creation
const maskUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username already exists"],
    },
    password: { 
        type: String,
        // you can't set password to required while using passport
    },
});

const maskMessageSchema = new mongoose.Schema({
    recipientUsername: {
        type: String,
        unique: [true , "Username already in database"]
    },
    maskMessages: [{
        maskMessage: {
            type: String,
        },
        sentAt: {
            type: Date,
            default: Date.now,
        }
    }],
});

const storedIdSchema = new mongoose.Schema({
    username: {
        type: String , 
        unique: [true , "Username already exists!"]
    } , 
    savedId: {
        type: String ,
        unique: [true , "Id must be unique"]
    }
});

maskUserSchema.plugin(passportLocalMongoose);
maskUserSchema.plugin(findOrCreate);

// collection creation
const User = mongoose.model('MaskUser' , maskUserSchema);
const Mask = mongoose.model("MaskMessage" , maskMessageSchema);
const SavedId = mongoose.model("SavedId" , storedIdSchema);


passport.use(User.createStrategy());

// passport general quthentication method 
passport.serializeUser((user , done) => {
    done(null , user.id);
});
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then((user) => {
            done(null, user);
        })
        .catch ((err) => {
            done(err, null);
            console.log(err);
    });
});

app.route("/")
    .get((req , res) => {
        res.render("home" );
});

app.route("/register")
    .get((req , res) => {
        res.render("register" , { messages: req.flash() });
    })
    .post((req , res) => {
    User.register({username: req.body.username}, req.body.password , (err , user) => {
        if (err) {
            console.log("registration err");
            console.log("error message: " + err.message);
            if (err.message === "A user with the given username is already registered") {
                req.flash('error', 'Username already used');
                res.redirect("/register");
            } else if (err.message === "No username was given") {
                req.flash('error', 'Username field was empty!');
                res.redirect("/register");
            } else {
                req.flash('error', 'Password field was empty!');
                res.redirect("/register");
            }
        } else {
            console.log("registration successful");
            passport.authenticate("local")(req , res , () => {
                res.redirect("/users/" + req.body.username);
            });
        }
    });
});

app.route("/login")
    .get((req , res ) => {
        res.render("login" , {messages : req.flash() });
    })
    .post((req , res , next ) => {
        const user = new User({
            username: req.body.username ,
            password: req.body.password
        });

        passport.authenticate('local', (err, user, info) => {
            if (err) {
              return next(err);
            }
            if (!user) {
              // handle incorrect username or password
                if (info.name === "IncorrectPasswordError") {
                    req.flash("error" , "Incorrect password");
                    res.redirect("/login");
                } else {
                    req.flash("error" , "Username Does not exist");
                    res.redirect("/login");
                }
            } else {
                req.logIn(user, (err) => {
                    if (err) {
                      return next(err);
                    }
                    // handle successful login
                    return res.redirect('/users/' + user.username);
                  });
            }
        })(req, res, next);
});

app.route("/users/:username")
    .get((req , res) => {
        if (req.isAuthenticated()) {
            res.render( 
                "userhome" , 
                {
                    username: req.params.username,
                    messages: req.flash() ,
                }
            );
        } else {
            console.log("User is not authenticated");
            res.redirect("/register");
        }
});

app.route("/users/:username/sendmask")
    .get((req , res) => {
        res.render(
            "send-mask-messages" , 
            {   username: req.params.username,
                messages: req.flash() 
            }
        );
    })
    .post((req ,res) => {
        const maskMessage = req.body.maskMessage;
        const username = req.params.username;

        const message1 = new Mask ({
            recipientUsername: username,
            maskMessages: [{
                maskMessage: maskMessage
            }]
        });

        Mask.findOne({recipientUsername: req.params.username})
            .then((foundMask) => {
                if(!foundMask) {
                    if (req.body.maskMessage.length > 0) {
                        message1.save()
                            .then((savedMessage) => {
                                const usersInfo = new SavedId ({
                                    username: req.params.username,
                                    savedId: savedMessage._id
                                })
                                usersInfo.save();

                                req.flash("success" , "You are the first person to message this user");
                                res.redirect("/users/" + req.params.username + "/sendmask");
                            })
                            .catch((err) => {
                                console.log(err);
                        });
                    } else {
                        req.flash("error" , "you can't send an empty message!");
                        res.redirect("/users/" + req.params.username + "/sendmask");
                    }
                } else if (foundMask) {
                    if(foundMask.recipientUsername === req.params.username) {
                        if (req.body.maskMessage.length > 0) {
                            foundMask.maskMessages.push({maskMessage: req.body.maskMessage});
                            foundMask.save();
                            req.flash("success" , "Your new message has been sucessfully sent!");
                            res.redirect("/users/" + req.params.username + "/sendmask");
                        } else{
                            req.flash("error" , "you can't send an empty message!");
                            res.redirect("/users/" + req.params.username + "/sendmask");
                        }
                    } 
                }  else {
                    req.flash("error" , "There was an error sending your message!");
                    res.redirect("/users/" + req.params.username + "/sendmask");
                }
            })
            .catch((err) => {
                console.log(err);
                req.flash("error" , "There was an error sending your message!");
                res.redirect("/users/" + req.params.username + "/sendmask");
        });  
});

app.route("/users/:username/:usersmessages")
.get((req , res) => {
    if (req.isAuthenticated()) {
            SavedId.findOne({username: req.params.username})
                .then((foundInfo) => {
                    Mask.findById(foundInfo.savedId)
                        .then((foundMask) => {
                            res.render(
                                "view-mask-messages" ,
                                {
                                    userMessages: foundMask.maskMessages,
                                    username: req.params.username
                                }
                            );
                        })
                        .catch((err) => {
                            console.log(err);
                    });
                })
                .catch((err) => {
                    req.flash("error" , "Oops! 😅 No one has sent you a message in last 3 Days! Share your profile link and check back later again!");
                    res.redirect("/users/" + req.params.username);
                    console.log("there is no message  because there is no Id saved in the SavedId collection");
                    console.log(err);
            });
    } else {
        res.redirect("/");
    }
});

app.route("/logout")
.get((req , res) => {
    req.logout(() => {
        console.log("user logged out");
    });
    res.redirect("/");
});

app.listen(process.env.PORT , (req , res) => {
    console.log("server is up and running");
});