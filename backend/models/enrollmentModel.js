const db = require("../config/db");

const Enrollment = {
  async create(studentId, courseId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [courseRows] = await connection.execute(
        `SELECT id
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [courseId]
      );

      if (courseRows.length === 0) {
        await connection.rollback();
        return { success: false, reason: "COURSE_NOT_FOUND" };
      }

      const [existingRows] = await connection.execute(
        `SELECT id, status
         FROM enrollments
         WHERE student_id = ?
           AND course_id = ?
         LIMIT 1
         FOR UPDATE`,
        [studentId, courseId]
      );

      if (existingRows.length > 0) {
        const existing = existingRows[0];

        if (existing.status !== "rejected") {
          await connection.rollback();
          return { success: false, reason: "REQUEST_EXISTS" };
        }

        const [result] = await connection.execute(
          `UPDATE enrollments
           SET status = 'pending',
               enrolled_at = CURRENT_TIMESTAMP,
               reviewed_by = NULL,
               reviewed_at = NULL,
               decision_note = NULL
           WHERE id = ?
             AND status = 'rejected'`,
          [existing.id]
        );

        if (result.affectedRows !== 1) {
          await connection.rollback();
          return { success: false, reason: "REQUEST_EXISTS" };
        }

        await connection.commit();
        return {
          success: true,
          enrollmentId: existing.id,
          status: "pending",
          resubmitted: true,
        };
      }

      const [result] = await connection.execute(
        `INSERT INTO enrollments (student_id, course_id, status)
         VALUES (?, ?, 'pending')`,
        [studentId, courseId]
      );

      await connection.commit();

      return {
        success: true,
        enrollmentId: result.insertId,
        status: "pending",
        resubmitted: false,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, status, reviewerId, decisionNote) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [enrollmentRows] = await connection.execute(
        `SELECT course_id
         FROM enrollments
         WHERE id = ?`,
        [id]
      );

      if (enrollmentRows.length === 0) {
        await connection.rollback();
        return { success: false, reason: "ENROLLMENT_NOT_FOUND" };
      }

      const courseId = enrollmentRows[0].course_id;
      const [courseRows] = await connection.execute(
        `SELECT id, max_students
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [courseId]
      );

      if (courseRows.length === 0) {
        await connection.rollback();
        return { success: false, reason: "COURSE_NOT_FOUND" };
      }

      const [lockedRows] = await connection.execute(
        `SELECT id, student_id, course_id, status
         FROM enrollments
         WHERE id = ?
         FOR UPDATE`,
        [id]
      );

      if (lockedRows.length === 0) {
        await connection.rollback();
        return { success: false, reason: "ENROLLMENT_NOT_FOUND" };
      }

      const enrollment = lockedRows[0];
      if (enrollment.status !== "pending") {
        await connection.rollback();
        return { success: false, reason: "NOT_PENDING" };
      }

      if (status === "approved") {
        const [duplicateRows] = await connection.execute(
          `SELECT id
           FROM enrollments
           WHERE student_id = ?
             AND course_id = ?
             AND status = 'approved'
             AND id <> ?
           LIMIT 1
           FOR UPDATE`,
          [enrollment.student_id, courseId, id]
        );

        if (duplicateRows.length > 0) {
          await connection.rollback();
          return { success: false, reason: "ALREADY_ENROLLED" };
        }

        const [approvedRows] = await connection.execute(
          `SELECT id
           FROM enrollments
           WHERE course_id = ?
             AND status = 'approved'
           FOR UPDATE`,
          [courseId]
        );

        const maxStudents = courseRows[0].max_students;
        if (
          maxStudents !== null &&
          approvedRows.length >= Number(maxStudents)
        ) {
          await connection.rollback();
          return { success: false, reason: "COURSE_FULL" };
        }
      }

      await connection.execute(
        `UPDATE enrollments
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP,
             decision_note = ?
         WHERE id = ?
           AND status = 'pending'`,
        [status, reviewerId, decisionNote, id]
      );

      await connection.commit();

      return {
        success: true,
        enrollmentId: id,
        status,
        reviewedBy: reviewerId,
        decisionNote,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          e.status,
          e.reviewed_by,
          e.reviewed_at,
          e.decision_note,
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
              AND e2.status = 'approved'
          ) AS enrolled_count,
          CASE
            WHEN c.max_students IS NULL THEN NULL
            ELSE c.max_students - (
              SELECT COUNT(*)
              FROM enrollments e3
              WHERE e3.course_id = c.id
                AND e3.status = 'approved'
            )
          END AS seats_remaining,
          CASE
            WHEN c.max_students IS NULL THEN FALSE
            WHEN (
              SELECT COUNT(*)
              FROM enrollments e4
              WHERE e4.course_id = c.id
                AND e4.status = 'approved'
            ) >= c.max_students THEN TRUE
            ELSE FALSE
          END AS is_full
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    return rows;
  },

  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          e.status,
          e.reviewed_by,
          e.reviewed_at,
          e.decision_note,
          u.id AS student_id,
          u.username,
          u.full_name
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );

    return rows;
  },

  async getPage({
    search,
    courseId,
    from,
    to,
    status,
    sort,
    order,
    limit,
    offset,
  }) {
    const conditions = [];
    const values = [];

    if (search) {
      const escapedSearch = search.replace(/[!%_]/g, "!$&");
      const searchPattern = `%${escapedSearch}%`;
      conditions.push(
        "(u.full_name LIKE ? ESCAPE '!' OR u.username LIKE ? ESCAPE '!')"
      );
      values.push(searchPattern, searchPattern);
    }

    if (courseId !== undefined) {
      conditions.push("e.course_id = ?");
      values.push(courseId);
    }

    if (from) {
      conditions.push("e.enrolled_at >= ?");
      values.push(from);
    }

    if (to) {
      conditions.push("e.enrolled_at < DATE_ADD(?, INTERVAL 1 DAY)");
      values.push(to);
    }

    if (status) {
      conditions.push("e.status = ?");
      values.push(status);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sortColumns = {
      date: "e.enrolled_at",
      student: "u.full_name",
      course: "c.title",
    };

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       ${whereClause}`,
      values
    );

    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          e.status,
          e.reviewed_by,
          e.reviewed_at,
          e.decision_note,
          u.id AS student_id,
          u.username,
          u.full_name,
          c.id AS course_id,
          c.title,
          c.category,
          c.level
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       ${whereClause}
       ORDER BY ${sortColumns[sort]} ${order}, e.id ASC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return {
      enrollments: rows,
      total: Number(countRows[0].total),
    };
  },

  async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return result;
  },

  async deleteByStudent(id, studentId) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?
         AND student_id = ?
         AND status = 'pending'`,
      [id, studentId]
    );

    return result;
  },

  async findByStudentAndId(id, studentId) {
    const [rows] = await db.execute(
      `SELECT id, status
       FROM enrollments
       WHERE id = ?
         AND student_id = ?
       LIMIT 1`,
      [id, studentId]
    );

    return rows[0];
  },
};

module.exports = Enrollment;
