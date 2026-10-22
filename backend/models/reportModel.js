const db = require("../config/db");

const Report = {
  async getAdminOverview() {
    const [summaryRows] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM courses) AS total_courses,
         (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
         COUNT(e.id) AS total_enrollments,
         COUNT(DISTINCT e.student_id) AS students_with_enrollments,
         COALESCE(SUM(
           CASE WHEN e.enrolled_at >= NOW() - INTERVAL 30 DAY THEN 1 ELSE 0 END
         ), 0) AS enrollments_last_30_days,
         (SELECT COUNT(*)
          FROM courses c
          WHERE NOT EXISTS (
            SELECT 1 FROM enrollments e2 WHERE e2.course_id = c.id
          )) AS courses_without_enrollments
       FROM enrollments e`
    );

    const [categoryRows] = await db.execute(
      `SELECT c.category, COUNT(e.id) AS enrollment_count
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       GROUP BY c.category
       ORDER BY enrollment_count DESC, c.category ASC`
    );

    const [topCourseRows] = await db.execute(
      `SELECT c.id AS course_id, c.title, c.category,
              COUNT(e.id) AS enrollment_count
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
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
         COUNT(DISTINCT e.course_id) AS enrolled_courses,
         COUNT(DISTINCT c.category) AS distinct_categories,
         MIN(e.enrolled_at) AS earliest_enrollment,
         MAX(e.enrolled_at) AS latest_enrollment
       FROM enrollments e
       LEFT JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?`,
      [studentId]
    );

    const [recentRows] = await db.execute(
      `SELECT e.id, e.course_id, c.title, c.category, c.level, e.enrolled_at
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
        earliestEnrollment: row.earliest_enrollment,
        latestEnrollment: row.latest_enrollment,
      },
      recentEnrollments: recentRows,
    };
  },
};

module.exports = Report;
