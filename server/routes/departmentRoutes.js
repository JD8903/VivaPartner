const express = require("express");

const router = express.Router();

const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentCount,
} = require("../controllers/departmentController");

router.post("/", createDepartment);

router.get("/count/all", getDepartmentCount);

router.get("/", getDepartments);

router.get("/:id", getDepartmentById);

router.put("/:id", updateDepartment);

router.delete("/:id", deleteDepartment);

module.exports = router;