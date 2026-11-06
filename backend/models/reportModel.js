const db = require("../config/db");

const Report = {
  async getAdminOverview() {
    const [summaryRows] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM courses) AS total_courses,
         (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
         COUNT(CASE WHEN e.status = 'approved' THEN e.id END) AS total_enrollments,
         COUNT(DISTINCT CASE WHEN e.status = 'approved' THEN e.student_id END)
           AS students_with_enrollments,
         COALESCE(SUM(CASE WHEN e.status = 'pending' THEN 1 ELSE 0 END), 0)
           AS pending_enrollments,
         COALESCE(SUM(
           CASE
             WHEN e.status = 'approved'
               AND e.enrolled_at >= NOW() - INTERVAL 30 DAY
             THEN 1
             ELSE 0
           END
         ), 0) AS enrollments_last_30_days,
         (SELECT COUNT(*)
          FROM courses c
          WHERE NOT EXISTS (
            SELECT 1
            FROM enrollments e2
            WHERE e2.course_id = c.id
              AND e2.status = 'approved'
          )) AS courses_without_enrollments
       FROM enrollments e`
    );

    const [categoryRows] = await db.execute(
      `SELECT c.category, COUNT(e.id) AS enrollment_count
       FROM courses c
       LEFT JOIN enrollments e
         ON e.course_id = c.id
        AND e.status = 'approved'
       GROUP BY c.category
       ORDER BY enrollment_count DESC, c.category ASC`
    );

    const [topCourseRows] = await db.execute(
      `SELECT c.id AS course_id, c.title, c.category,
              COUNT(e.id) AS enrollment_count
       FROM courses c
      LEFT JOIN enrollments e
        ON e.course_id = c.id
       AND e.status = 'approved'
       GROUP BY c.id, c.title, c.category
       ORDER BY enrollment_count DESC, c.title ASC, c.id ASC
       LIMIT 5`
    );

    const summary = Object.fromEntries(
      Object.entries(summaryRows[0]).map(([key, value]) => [key, Number(value) || 0])
    );

    return {
      summary,
      enrollmentsByCategory: categoryRows.map((row) => ({
        category: row.category,
        enrollmentCount: Number(row.enrollment_count) || 0,
      })),
      topCourses: topCourseRows.map((row) => ({
        courseId: Number(row.course_id),
        title: row.title,
        category: row.category,
        enrollmentCount: Number(row.enrollment_count) || 0,
      })),
    };
  },

  async getStudentReport(studentId) {
    const [summaryRows] = await db.execute(
      `SELECT
         COUNT(DISTINCT CASE WHEN e.status = 'approved' THEN e.course_id END)
           AS enrolled_courses,
         COUNT(DISTINCT CASE WHEN e.status = 'approved' THEN c.category END)
           AS distinct_categories,
         MIN(CASE WHEN e.status = 'approved' THEN e.enrolled_at END)
           AS earliest_enrollment,
         MAX(CASE WHEN e.status = 'approved' THEN e.enrolled_at END)
           AS latest_enrollment,
         COALESCE(SUM(CASE WHEN e.status = 'pending' THEN 1 ELSE 0 END), 0)
           AS pending_requests,
         COALESCE(SUM(CASE WHEN e.status = 'rejected' THEN 1 ELSE 0 END), 0)
           AS rejected_requests
       FROM enrollments e
       LEFT JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?`,
      [studentId]
    );

    const [recentRows] = await db.execute(
      `SELECT e.id, e.course_id, c.title, c.category, c.level,
              e.enrolled_at, e.status, e.reviewed_at, e.decision_note
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC, e.id DESC
       LIMIT 5`,
      [studentId]
    );

    const row = summaryRows[0];
    return {
      summary: {
        enrolledCourses: Number(row.enrolled_courses) || 0,
        distinctCategories: Number(row.distinct_categories) || 0,
        pendingRequests: Number(row.pending_requests) || 0,
        rejectedRequests: Number(row.rejected_requests) || 0,
        earliestEnrollment: row.earliest_enrollment,
        latestEnrollment: row.latest_enrollment,
      },
      recentEnrollments: recentRows,
    };
  },
};

module.exports = Report;
