const Report = require("../models/reportModel");

const getAdminOverview = async (req, res) => {
  try {
    const overview = await Report.getAdminOverview();

    res.status(200).json({
      message: "Admin report retrieved successfully",
      ...overview,
    });
  } catch (error) {
    console.error("Error getting admin report:", error.message);
    res.status(500).json({ message: "Unable to load the admin report" });
  }
};

const getStudentReport = async (req, res) => {
  try {
    const report = await Report.getStudentReport(req.user.id);

    res.status(200).json({
      message: "Student report retrieved successfully",
      ...report,
    });
  } catch (error) {
    console.error("Error getting student report:", error.message);
    res.status(500).json({ message: "Unable to load the student report" });
  }
};

module.exports = { getAdminOverview, getStudentReport };
