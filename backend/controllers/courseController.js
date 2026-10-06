const Course = require("../models/courseModel");
const User = require("../models/userModel");
const validateCourse = require("../helpers/validateCourse");


// Validate max_students
const validateMaxStudents = (value) => {

  // Blank value means unlimited
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return {
      isValid: true,
      value: null,
    };
  }


  // Must be a positive integer
  if (
    !Number.isInteger(Number(value)) ||
    Number(value) <= 0
  ) {
    return {
      isValid: false,
      message: "Maximum students must be a positive integer",
    };
  }


  return {
    isValid: true,
    value: Number(value),
  };
};



// Get all courses
const getAllCourses = async (req, res) => {

  try {

    const courses = await Course.getAll();

    res.status(200).json({
      message: "Courses retrieved successfully",
      courses,
    });

  } catch (error) {

    console.error(
      "Error getting courses:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Get one course
const getCourseById = async (req, res) => {

  try {

    const { id } = req.params;

    const course = await Course.getById(id);

    if (!course) {

      return res.status(404).json({
        message: "Course not found",
      });
    }


    res.status(200).json({
      message: "Course retrieved successfully",
      course,
    });

  } catch (error) {

    console.error(
      "Error getting course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Create course
// Expected middleware order:
// auth -> isAdmin -> createCourse
const createCourse = async (req, res) => {

  try {

    // ---------- Existing course validation ----------
    const validation = validateCourse(req.body);

    if (!validation.isValid) {

      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }


    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
    } = validation.data;


    // ---------- CR-007: Validate max_students ----------
    const maxStudentsValidation =
      validateMaxStudents(req.body.max_students);


    if (!maxStudentsValidation.isValid) {

      return res.status(400).json({
        message: "Validation failed",
        errors: {
          max_students:
            maxStudentsValidation.message,
        },
      });
    }


    const max_students =
      maxStudentsValidation.value;


    // ---------- FR-009: duplicate title check ----------
    const duplicate =
      await Course.findByTitle(title);


    if (duplicate) {

      return res.status(400).json({
        message: "Validation failed",
        errors: {
          title:
            "A course with this title already exists",
        },
      });
    }


    // ---------- Create course ----------
    const courseId = await Course.create({

      title,
      category,
      level,
      duration,
      price,
      image,
      description,

      // CR-007
      max_students,
    });


    res.status(201).json({
      message: "Course created successfully",
      courseId,
    });

  } catch (error) {

    console.error(
      "Error creating course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Update course
// Expected middleware order:
// auth -> isAdmin -> updateCourse
const updateCourse = async (req, res) => {

  try {

    const { id } = req.params;


    // Check whether course exists
    const existingCourse =
      await Course.getById(id);


    if (!existingCourse) {

      return res.status(404).json({
        message: "Course not found",
      });
    }


    // ---------- Existing validation ----------
    const validation =
      validateCourse(req.body);


    if (!validation.isValid) {

      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }


    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
    } = validation.data;


    // ---------- CR-007: Validate max_students ----------
    const maxStudentsValidation =
      validateMaxStudents(req.body.max_students);


    if (!maxStudentsValidation.isValid) {

      return res.status(400).json({
        message: "Validation failed",
        errors: {
          max_students:
            maxStudentsValidation.message,
        },
      });
    }


    const max_students =
      maxStudentsValidation.value;


    // ---------- FR-009: duplicate title check ----------
    const duplicate =
      await Course.findByTitle(title);


    if (
      duplicate &&
      String(duplicate.id) !== String(id)
    ) {

      return res.status(400).json({
        message: "Validation failed",
        errors: {
          title:
            "A course with this title already exists",
        },
      });
    }


    /*
     * CR-007
     *
     * Update capacity safely.
     *
     * The model method locks the course row,
     * checks the current enrollment count,
     * and updates the course inside one transaction.
     */
    const updateResult =
      await Course.updateWithCapacityCheck(
        id,
        {
          title,
          category,
          level,
          duration,
          price,
          image,
          description,
          max_students,
        }
      );


    // Capacity cannot be lower than current enrollment
    if (
      !updateResult.success &&
      updateResult.reason ===
        "CAPACITY_BELOW_ENROLLMENT"
    ) {

      return res.status(400).json({
        message:
          "Maximum students cannot be less than the current number of enrolled students",
        errors: {
          max_students:
            `Current enrolled students: ${updateResult.enrolledCount}`,
        },
      });
    }


    // Get updated course
    const updatedCourse =
      await Course.getById(id);


    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });

  } catch (error) {

    console.error(
      "Error updating course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Delete course
const deleteCourse = async (req, res) => {

  try {

    const { id } = req.params;


    // Check if course exists
    const existingCourse =
      await Course.getById(id);


    if (!existingCourse) {

      return res.status(404).json({
        message: "Course not found",
      });
    }


    await Course.delete(id);


    res.status(200).json({
      message: "Course deleted successfully",
    });

  } catch (error) {

    console.error(
      "Error deleting course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Get statistics (PUBLIC)
const getStats = async (req, res) => {

  try {

    const courses =
      await Course.getAll();

    const studentCount =
      await User.countByRole("student");


    res.status(200).json({
      message:
        "Statistics retrieved successfully",

      courseCount:
        courses.length,

      studentCount:
        studentCount,
    });

  } catch (error) {

    console.error(
      "Error getting statistics:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getStats,
};