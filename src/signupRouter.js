const express = require('express');
const signupRouter = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const pool = require('./db');
signupRouter.get("/", (req, res) =>
  res.render("sign-up-form")
);

const validateSignUp = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .escape(),
  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .escape(),
  body("username")
    .trim()
    .isEmail()
    .withMessage("Username must be a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  // Custom validator to check if passwords match
  body("password_confirm").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

signupRouter.post("/", validateSignUp, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("sign-up-form", {
      errors: errors.array(),
      previousData: req.body,
    });
  }
  const { first_name, last_name, username, password, password_confirm, is_admin } =
    req.body;
  if (first_name && last_name && username && password && password_confirm && is_admin) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = is_admin === "ok";
      await pool.query(
        "INSERT INTO users (first_name, last_name, username, password, is_admin) VALUES ($1, $2, $3, $4, $5)",
        [first_name, last_name, username, hashedPassword, admin],
      );
      res.redirect("/");
    } catch (err) {
      return next(err);
    }
  }
});



module.exports = signupRouter;
