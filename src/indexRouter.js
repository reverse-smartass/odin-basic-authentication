import { Router } from 'express';
const indexRouter = Router();


indexRouter.get("/", (req, res) =>async (req, res) => {

  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY created_at DESC",
    );

    res.render("index", {messages: result.rows})
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  } 
});


export default indexRouter;
