const express = require("express");
const router = express.Router();

const {
  saveQuestions,
} = require("../controllers/questionController");

router.post("/save", saveQuestions);

module.exports = router;