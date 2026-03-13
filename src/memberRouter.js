const express = require('express');
const memberRouter = express.Router();
memberRouter.get("/", (req, res) => {
  if (req.user) {
    res.render("member-form");
  } else {
    return res.render("index", {
      pages,
      memberPages,
      errors: [{ msg: "You're not signed in!" }],
    });
  }
});

const validateMember = [
  body("password").custom((value) => {
    if (value !== process.env.MEMBER_PASSWORD) {
      throw new Error("Incorrect member password");
    }
    return true;
  }),
];

memberRouter.post("/", validateMember, async (req, res, next) => {
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

module.exports = memberRouter;
