const db = require("../config/db");

const Course = {

  // Get all courses with availability
  async getAll() {

    const [rows] = await db.execute(`
      SELECT
        c.*,

        COUNT(e.id) AS enrolled_count,

        CASE
          WHEN c.max_students IS NULL THEN NULL
          ELSE c.max_students - COUNT(e.id)
        END AS seats_remaining,

        CASE
          WHEN c.max_students IS NULL THEN FALSE
          WHEN COUNT(e.id) >= c.max_students THEN TRUE
          ELSE FALSE
        END AS is_full

      FROM courses c

      LEFT JOIN enrollments e
        ON c.id = e.course_id

      GROUP BY c.id

      ORDER BY c.id ASC
    `);

    return rows;
  },


  // Get one course with availability
  async getById(id) {

    const [rows] = await db.execute(`
      SELECT
        c.*,

        COUNT(e.id) AS enrolled_count,

        CASE
          WHEN c.max_students IS NULL THEN NULL
          ELSE c.max_students - COUNT(e.id)
        END AS seats_remaining,

        CASE
          WHEN c.max_students IS NULL THEN FALSE
          WHEN COUNT(e.id) >= c.max_students THEN TRUE
          ELSE FALSE
        END AS is_full

      FROM courses c

      LEFT JOIN enrollments e
        ON c.id = e.course_id

      WHERE c.id = ?

      GROUP BY c.id
    `, [id]);

    return rows[0];
  },


  // Find a course by exact title
  async findByTitle(title) {

    const [rows] = await db.execute(
      `SELECT id, title
       FROM courses
       WHERE title = ?
       LIMIT 1`,
      [title]
    );

    return rows[0];
  },


  // Create course
  async create(course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students
    } = course;


    const [result] = await db.execute(
      `INSERT INTO courses
       (
         title,
         category,
         level,
         duration,
         price,
         image,
         description,
         max_students
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students
      ]
    );

    return result.insertId;
  },


  // Update course
  async update(id, course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students
    } = course;


    const [result] = await db.execute(
      `UPDATE courses
       SET
         title = ?,
         category = ?,
         level = ?,
         duration = ?,
         price = ?,
         image = ?,
         description = ?,
         max_students = ?
       WHERE id = ?`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students,
        id
      ]
    );

    return result;
  },


  // Update course with capacity check
  // CR-007:
  // Admin cannot reduce max_students below
  // the current number of enrollments.
  async updateWithCapacityCheck(id, course) {

    const connection = await db.getConnection();

    try {

      // Start transaction
      await connection.beginTransaction();


      // Lock the course row
      const [courseRows] = await connection.execute(
        `SELECT
            id,
            max_students
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [id]
      );


      // Course not found
      if (courseRows.length === 0) {

        await connection.rollback();

        return {
          success: false,
          reason: "COURSE_NOT_FOUND"
        };
      }


      // Get current enrollment count
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) AS enrolled_count
         FROM enrollments
         WHERE course_id = ?`,
        [id]
      );


      const enrolledCount =
        Number(countRows[0].enrolled_count);


      const newMaxStudents =
        course.max_students;


      /*
       * CR-007:
       *
       * NULL = Unlimited
       *
       * If a capacity is provided, it cannot be
       * lower than the current enrollment count.
       *
       * Equal is allowed.
       */
      if (
        newMaxStudents !== null &&
        Number(newMaxStudents) < enrolledCount
      ) {

        await connection.rollback();

        return {
          success: false,
          reason: "CAPACITY_BELOW_ENROLLMENT",
          enrolledCount
        };
      }


      // Update course
      const [result] = await connection.execute(
        `UPDATE courses
         SET
           title = ?,
           category = ?,
           level = ?,
           duration = ?,
           price = ?,
           image = ?,
           description = ?,
           max_students = ?
         WHERE id = ?`,
        [
          course.title,
          course.category,
          course.level,
          course.duration,
          course.price,
          course.image,
          course.description,
          newMaxStudents,
          id
        ]
      );


      // Commit transaction
      await connection.commit();


      return {
        success: true,
        result
      };

    } catch (error) {

      // Rollback if an error occurs
      await connection.rollback();

      throw error;

    } finally {

      // Release connection
      connection.release();
    }
  },


  // Delete course
  async delete(id) {

    const [result] = await db.execute(
      `DELETE FROM courses
       WHERE id = ?`,
      [id]
    );

    return result;
  },


  // Get current enrollment count
  async getEnrollmentCount(courseId) {

    const [rows] = await db.execute(
      `SELECT COUNT(*) AS enrolled_count
       FROM enrollments
       WHERE course_id = ?`,
      [courseId]
    );

    return Number(rows[0].enrolled_count);
  },


  // Get course for update with row lock
  async getByIdForUpdate(connection, id) {

    const [rows] = await connection.execute(
      `SELECT *
       FROM courses
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    return rows[0];
  }

};


module.exports = Course;