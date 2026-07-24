const express = require("express");

const router = express.Router();

const {
  getDashboardExport,
} = require("../controllers/exportController");

router.get("/dashboard", getDashboardExport);

module.exports = router;