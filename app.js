// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv/config");

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require("hbs");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// session configuration

const session = require('express-session');
const MongoStore = require('connect-mongo');
const DB_URL = process.env.MONGODB_URI; //this in dotenv

app.use(
	session({
		secret: process.env.SESSION_SECRET, //this in dotenv could be any string
		cookie: { maxAge: 1000 * 60 * 60 * 24 }, // one day
		resave: true,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: DB_URL
		})
	})
)
// end of session configuration

// passport config

const User = require('./models/User.model');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

passport.serializeUser((user, done) => {
	done(null, user._id);
});

passport.deserializeUser((id, done) => {
	User.findById(id)
		.then(userFromDB => {
			done(null, userFromDB);
		})
		.catch(err => {
			done(err);
		})
})

// register the local strategy (login with username and password)
passport.use(
	new LocalStrategy((username, password, done) => {
		User.findOne({ username: username })
			.then(userFromDB => {
				if (userFromDB === null) {
					done(null, false, { message: 'Wrong Credentials' });
				} 
                if (!bcrypt.compareSync(password, userFromDB.password)) { return done(null, false, { message: 'Wrong Credentials'}); }
                return done(null, userFromDB);
			})
	})
)

app.use(passport.initialize());
app.use(passport.session());

// end of passport config

// default value for title local
const projectName = "sport-events";
const capitalized = (string) => string[0].toUpperCase() + string.slice(1).toLowerCase();

app.locals.title = `${capitalized(projectName)} created with IronLauncher`;

// 👇 Start handling routes here
const index = require("./routes/index");
app.use("/", index);


const auth = require("./routes/auth");
app.use("/", auth);

const events = require("./routes/events");
app.use("/", events);

const search = require("./routes/search");
app.use("/", search);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
