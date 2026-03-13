/////// app.js
const bcrypt = require("bcryptjs");
const path = require("node:path");
const { Pool, Result } = require("pg");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { name } = require("ejs");
const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const pool = new Pool({
  database: process.env.DB_INVENTORY_DATABASE,
  user: process.env.DB_LOCAL_USER,
  password: process.env.DB_LOCAL_PASSWORD,
  host: process.env.DB_LOCAL_HOST,
  port: process.env.DB_PORT,
});

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
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




const validateMember = [
  body("password").custom((value) => {
    if (value !== process.env.MEMBER_PASSWORD) {
      throw new Error("Incorrect member password");
    }
    return true;
  }),
];

app.post("/member", validateMember, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("member-form", {
      pages,
      memberPages,
      errors: errors.array(),
      previousData: req.body,
    });
  }

  try {
    let member = await pool.query(
      "select member_status from users where username = $1",
      [req.user.username],
    );
    if (member.rows.length > 0 && member.rows[0].member_status === true) {
      return res.render("index", {
        pages,
        memberPages,
        errors: [{ msg: "You're already a member!" }]
      });
    }
    await pool.query(
      "UPDATE users SET member_status = TRUE WHERE username = $1",
      [req.user.username],
    );
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

app.get("/message", (req, res) =>
  res.render("new-message", { pages, memberPages }),
);

const validateNewMessage = [
  body("message")
    .notEmpty()
    .withMessage("Message can't be empty")
    .escape(),
];

app.post("/message",validateNewMessage, async (req, res) => {
  const {text} = req.body;
  if (text) {
    try {
      
      await pool.query(
        "insert into messages (message, username) values ($1, $2) returning *",
        [text, req.user.username],
      );
      res.redirect("/");

    } catch (err) {
      console.error(err);
      res.status(500).send("Database Error");
    }
  } else {
    return res.status(400).send("Both text and user are required.");
  }
});

app.delete("/delete/:id", async (req, res) => {

  try {
    const {id} = req.params;
    const result = await pool.query('DELETE FROM messages where id = $1', [id]);

    if (result.rowCount === 0){
      return res.status(400).send('Item not found');
    }

    return res.status(200).send('Item deleted');
  } catch (error) {
    res.status(500).send(error.message);
  }

});

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
