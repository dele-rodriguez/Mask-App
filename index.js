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

maskUserSchema.plugin(passportLocalMongoose);
maskUserSchema.plugin(findOrCreate);

// collection creation
const User = mongoose.model('MaskUser' , maskUserSchema);


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
    console.log(req.body.password);
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
                res.redirect("/userhome");
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
                    return res.redirect('/userhome');
                  });
            }
        })(req, res, next);
});

app.route("/userhome")
.get((req , res) => {
    if (req.isAuthenticated()) {
        console.log("user is authenticated");
        res.render("userhome");
    } else {
        console.log("User is not authenticated");
        res.redirect("/register");
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