const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");


// Enroll in a course
const enrollInCourse = async (req, res) => {

  try {

    const courseId = Number(req.body?.courseId);
    const studentId = req.user.id;

    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        message: "A valid course ID is required",
      });
    }

    const result = await Enrollment.create(studentId, courseId);
    if (!result.success && result.reason === "COURSE_NOT_FOUND") {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    if (!result.success && result.reason === "REQUEST_EXISTS") {
      return res.status(409).json({
        message: "You already have a pending request or approved enrollment for this course",
      });
    }

    return res.status(201).json({
      message: result.resubmitted
        ? "Your rejected request has been submitted again and is pending approval"
        : "Enrollment request submitted and pending approval",
      enrollmentId: result.enrollmentId,
      status: result.status,
    });
  } catch (error) {
    console.error("Error submitting enrollment request:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Get logged-in student's courses
const getMyEnrollments = async (req, res) => {

  try {

    const studentId = req.user.id;

    const enrollments =
      await Enrollment.getByStudent(studentId);

    res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments,
    });

  } catch (error) {

    console.error(
      "Error getting student enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Get students enrolled in a course
const getCourseEnrollments = async (req, res) => {

  try {

    const { courseId } = req.params;


    // Check whether course exists
    const course = await Course.getById(courseId);

    if (!course) {

      return res.status(404).json({
        message: "Course not found",
      });
    }


    const enrollments =
      await Enrollment.getByCourse(courseId);


    res.status(200).json({
      message: "Course enrollments retrieved successfully",
      course,
      enrollments,
    });

  } catch (error) {

    console.error(
      "Error getting course enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Get all enrollments
const getAllEnrollments = async (req, res) => {

  try {

    const query = req.query;
    const readString = (name) => {
      const value = query[name];
      return value === undefined || typeof value === "string"
        ? value
        : null;
    };

    const q = readString("q");
    const courseIdValue = readString("courseId");
    const from = readString("from");
    const to = readString("to");
    const statusValue = readString("status");
    const sortValue = readString("sort");
    const orderValue = readString("order");
    const pageValue = readString("page");
    const limitValue = readString("limit");

    if (
      q === null ||
      courseIdValue === null ||
      from === null ||
      to === null ||
      statusValue === null ||
      sortValue === null ||
      orderValue === null ||
      pageValue === null ||
      limitValue === null
    ) {
      return res.status(400).json({
        message: "Query parameters must be provided once as strings",
      });
    }

    const parsePositiveInteger = (value) => {
      if (value === undefined || !/^[1-9]\d*$/.test(value)) {
        return null;
      }

      const parsed = Number(value);
      return Number.isSafeInteger(parsed) ? parsed : null;
    };

    const courseId = courseIdValue === undefined
      ? undefined
      : parsePositiveInteger(courseIdValue);
    const page = pageValue === undefined ? 1 : parsePositiveInteger(pageValue);
    const limit = limitValue === undefined ? 20 : parsePositiveInteger(limitValue);

    if (
      (courseIdValue !== undefined && courseId === null) ||
      page === null ||
      limit === null ||
      limit > 100
    ) {
      return res.status(400).json({
        message: "Course ID, page, or limit is invalid",
      });
    }

    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
    };

    if (
      (from !== undefined && !isValidDate(from)) ||
      (to !== undefined && !isValidDate(to)) ||
      (from !== undefined && to !== undefined && from > to)
    ) {
      return res.status(400).json({
        message: "Enrollment date range is invalid",
      });
    }

    const sort = (sortValue === undefined ? "date" : sortValue).toLowerCase();
    const sortAliases = {
      date: "date",
      enrolled_at: "date",
      student: "student",
      course: "course",
    };
    const normalizedSort = Object.prototype.hasOwnProperty.call(sortAliases, sort)
      ? sortAliases[sort]
      : undefined;
    const order = (orderValue === undefined ? "desc" : orderValue).toLowerCase();
    const orderAliases = {
      asc: "ASC",
      ascending: "ASC",
      desc: "DESC",
      descending: "DESC",
    };
    const normalizedOrder = Object.prototype.hasOwnProperty.call(orderAliases, order)
      ? orderAliases[order]
      : undefined;
    const status = statusValue === undefined || statusValue === "all"
      ? undefined
      : statusValue;

    if (
      !normalizedSort ||
      !normalizedOrder ||
      (status !== undefined && !["pending", "approved", "rejected"].includes(status))
    ) {
      return res.status(400).json({
        message: "Sort field, order, or enrollment status is invalid",
      });
    }

    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) {
      return res.status(400).json({
        message: "Page is too large",
      });
    }

    const result = await Enrollment.getPage({
      search: q || "",
      courseId,
      from,
      to,
      status,
      sort: normalizedSort,
      order: normalizedOrder,
      limit,
      offset,
    });

    res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments: result.enrollments,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });

  } catch (error) {

    console.error(
      "Error getting all enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


const updateEnrollmentStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: "A valid enrollment ID is required" });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { status } = body;
    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({
        message: "Status must be either approved or rejected",
      });
    }

    const reason = body.reason ?? body.decision_note ?? "";
    if (typeof reason !== "string") {
      return res.status(400).json({ message: "Decision reason must be text" });
    }

    const decisionNote = reason.trim();
    if (status === "rejected" && !decisionNote) {
      return res.status(400).json({
        message: "A reason is required when rejecting an enrollment request",
      });
    }

    const result = await Enrollment.updateStatus(
      id,
      status,
      req.user.id,
      decisionNote || null
    );

    if (!result.success) {
      const failures = {
        ENROLLMENT_NOT_FOUND: [404, "Enrollment request not found"],
        COURSE_NOT_FOUND: [404, "Course not found"],
        NOT_PENDING: [409, "Only pending enrollment requests can be reviewed"],
        COURSE_FULL: [409, "Course is full; the request cannot be approved"],
        ALREADY_ENROLLED: [409, "The student is already enrolled in this course"],
      };
      const [statusCode, message] = failures[result.reason];
      return res.status(statusCode).json({ message });
    }

    return res.status(200).json({
      message: `Enrollment request ${status}`,
      enrollmentId: result.enrollmentId,
      status: result.status,
    });
  } catch (error) {
    console.error("Error reviewing enrollment request:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Delete enrollment
const deleteEnrollment = async (req, res) => {

  try {

    const { id } = req.params;

    const result =
      await Enrollment.delete(id);


    if (result.affectedRows === 0) {

      return res.status(404).json({
        message: "Enrollment not found",
      });
    }


    /*
     * Deleting the enrollment automatically frees
     * one seat because enrolled_count is calculated
     * from the enrollments table.
     */

    res.status(200).json({
      message: "Enrollment deleted successfully",
    });

  } catch (error) {

    console.error(
      "Error deleting enrollment:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Student cancels own enrollment
const cancelMyEnrollment = async (req, res) => {

  try {

    const { id } = req.params;

    const studentId = req.user.id;


    const result = await Enrollment.deleteByStudent(id, studentId);

    if (result.affectedRows === 0) {
      const enrollment = await Enrollment.findByStudentAndId(id, studentId);
      if (enrollment && enrollment.status !== "pending") {
        return res.status(409).json({
          message: "Only pending enrollment requests may be cancelled",
        });
      }

      return res.status(404).json({
        message: "Enrollment request not found",
      });
    }


    res.status(200).json({
      message: "Enrollment cancelled successfully",
    });

  } catch (error) {

    console.error(
      "Error cancelling enrollment:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment,
  cancelMyEnrollment
};