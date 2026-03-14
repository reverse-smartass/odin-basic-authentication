const express = require('express');
const indexRouter = express.Router();
const pool = require('./db');
indexRouter.get("/", async (req, res) => {

  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY created_at DESC",
    );

    return res.render("index", {messages: result.rows})
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  } 
});


module.exports = indexRouter;
