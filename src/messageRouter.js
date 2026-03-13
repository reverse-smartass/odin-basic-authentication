const express = require('express');
const messageRouter = express.Router();

messageRouter.get("/", (req, res) =>
  res.render("new-message", { pages, memberPages }),
);

const validateNewMessage = [
  body("message")
    .notEmpty()
    .withMessage("Message can't be empty")
    .escape(),
];

messageRouter.post("/",validateNewMessage, async (req, res) => {
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

messageRouter.delete("/delete/:id", async (req, res) => {

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


module.exports = messageRouter;
