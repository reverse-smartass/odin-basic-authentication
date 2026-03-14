const express = require("express");
const messageRouter = express.Router();
const { body, validationResult } = require("express-validator");
const pool = require("./db");
messageRouter.get("/", (req, res) => {
  if (req.user) {
    res.render("new-message");
  } else {
    return res.render("index", {
      errors: [{ msg: "You're not signed in!" }],
    });
  }
});

const validateNewMessage = [
  body("message").notEmpty().withMessage("Message can't be empty").escape(),
];

messageRouter.post("/", validateNewMessage, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("new-message", {
      errors: errors.array(),
      previousData: req.body,
    });
  }
  try {
    const {message} = req.body;
    await pool.query(
      "insert into messages (message, username) values ($1, $2) returning *",
      [message, req.user.username],
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
});

messageRouter.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM messages where id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(400).send("Item not found");
    }

    return res.status(200).send("Item deleted");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = messageRouter;
