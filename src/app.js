/////// app.js
const bcrypt = require("bcryptjs");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { name } = require("ejs");
const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config();
const indexRouter = require("./indexRouter");
const messageRouter = require("./messageRouter");
const signupRouter = require("./signupRouter");
const memberRouter = require("./memberRouter");
const pool = require("./db");
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username],
      );
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;

  res.locals.pages = [
    { name: "Home", path: "/" },
    { name: "New User", path: "/sign-up" },
  ];

  res.locals.memberPages = [
    { name: "Become Member", path: "/member" },
    { name: "New Message", path: "/message" }
  ];

  next();
});

app.use('/', indexRouter);
app.use('/message', messageRouter);
app.use('/sign-up', signupRouter);
app.use('/member', memberRouter); 

app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  }),
);

app.listen(3000, (error) => {
  if (error) {
    throw error;
  }
  console.log("app listening on port 3000!");
});
