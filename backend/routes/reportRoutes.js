const express = require("express");

const router = express.Router();
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getAdminOverview,
  getStudentReport,
} = require("../controllers/reportController");

router.get("/overview", roleMiddleware(["admin"]), getAdminOverview);
router.get("/my", roleMiddleware(["student"]), getStudentReport);

module.exports = router;
