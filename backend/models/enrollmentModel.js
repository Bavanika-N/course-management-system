const db = require("../config/db");

const Enrollment = {

  // Create enrollment with atomic capacity check
  async create(studentId, courseId) {

    const connection = await db.getConnection();

    try {

      // Start transaction
      await connection.beginTransaction();


      // Lock the course row.
      // This prevents two students from enrolling at the same time
      // and exceeding the course capacity.
      const [courseRows] = await connection.execute(
        `SELECT
            id,
            max_students
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [courseId]
      );


      // Course does not exist
      if (courseRows.length === 0) {

        await connection.rollback();

        return {
          success: false,
          reason: "COURSE_NOT_FOUND"
        };
      }


      const course = courseRows[0];


      // Check whether student is already enrolled
      const [existingRows] = await connection.execute(
        `SELECT id
         FROM enrollments
         WHERE student_id = ?
         AND course_id = ?
         LIMIT 1`,
        [studentId, courseId]
      );


      if (existingRows.length > 0) {

        await connection.rollback();

        return {
          success: false,
          reason: "ALREADY_ENROLLED"
        };
      }


      // Count current enrollments
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) AS enrolled_count
         FROM enrollments
         WHERE course_id = ?`,
        [courseId]
      );


      const enrolledCount =
        Number(countRows[0].enrolled_count);


      // If max_students is NULL, course is unlimited
      if (
        course.max_students !== null &&
        enrolledCount >= Number(course.max_students)
      ) {

        await connection.rollback();

        return {
          success: false,
          reason: "COURSE_FULL"
        };
      }


      // Create enrollment
      const [result] = await connection.execute(
        `INSERT INTO enrollments
         (student_id, course_id)
         VALUES (?, ?)`,
        [studentId, courseId]
      );


      // Commit transaction
      await connection.commit();


      return {
        success: true,
        enrollmentId: result.insertId
      };

    } catch (error) {

      // Rollback if anything fails
      await connection.rollback();

      throw error;

    } finally {

      // Release database connection
      connection.release();
    }
  },


  // Check if student is already enrolled
  async findByStudentAndCourse(studentId, courseId) {

    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ?
       AND course_id = ?`,
      [studentId, courseId]
    );

    return rows[0];
  },


  // Get all courses enrolled by a student
  async getByStudent(studentId) {

    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,

          c.id AS course_id,
          c.title,
          c.category,
          c.level,
          c.duration,
          c.price,
          c.image,
          c.description,

          c.max_students,

          (
            SELECT COUNT(*)
            FROM enrollments e2
            WHERE e2.course_id = c.id
          ) AS enrolled_count,

          CASE
            WHEN c.max_students IS NULL THEN NULL
            ELSE c.max_students -
              (
                SELECT COUNT(*)
                FROM enrollments e3
                WHERE e3.course_id = c.id
              )
          END AS seats_remaining,

          CASE
            WHEN c.max_students IS NULL THEN FALSE
            WHEN
              (
                SELECT COUNT(*)
                FROM enrollments e4
                WHERE e4.course_id = c.id
              ) >= c.max_students
            THEN TRUE
            ELSE FALSE
          END AS is_full

       FROM enrollments e

       JOIN courses c
         ON e.course_id = c.id

       WHERE e.student_id = ?

       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    return rows;
  },


  // Get all students enrolled in a course
  async getByCourse(courseId) {

    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,

          u.id AS student_id,
          u.username,
          u.full_name

       FROM enrollments e

       JOIN users u
         ON e.student_id = u.id

       WHERE e.course_id = ?

       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );

    return rows;
  },


  // Get all enrollments
  async getAll() {

    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,

          u.id AS student_id,
          u.username,
          u.full_name,

          c.id AS course_id,
          c.title,
          c.category,
          c.level

       FROM enrollments e

       JOIN users u
         ON e.student_id = u.id

       JOIN courses c
         ON e.course_id = c.id

       ORDER BY e.enrolled_at DESC`
    );

    return rows;
  },


  // Delete enrollment
  async delete(id) {

    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return result;
  },


  // Student can delete only their own enrollment
  async deleteByStudent(id, studentId) {

    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?
       AND student_id = ?`,
      [id, studentId]
    );

    return result;
  },

};


module.exports = Enrollment;