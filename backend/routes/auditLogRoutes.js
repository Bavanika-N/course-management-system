const express = require("express");

const router = express.Router();
const roleMiddleware = require("../middleware/roleMiddleware");
const { getAuditLogs } = require("../controllers/auditLogController");

router.get("/", roleMiddleware(["admin"]), getAuditLogs);

module.exports = router;
