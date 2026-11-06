import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBook, FaChartBar, FaSearch, FaUsers } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const emptyReport = {
  summary: {
    total_courses: 0,
    total_students: 0,
    total_enrollments: 0,
    pending_enrollments: 0,
    students_with_enrollments: 0,
    enrollments_last_30_days: 0,
    courses_without_enrollments: 0,
  },
  enrollmentsByCategory: [],
  topCourses: [],
};

function AdminDashboard() {
  const [report, setReport] = useState(emptyReport);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [enrollmentError, setEnrollmentError] = useState("");
  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      const [reportResult, enrollmentResult] = await Promise.allSettled([
        api.get("/reports/overview"),
        api.get("/enrollments", { params: { limit: 20, sort: "date", order: "desc" } }),
      ]);

      if (reportResult.status === "fulfilled") {
        setReport({ ...emptyReport, ...reportResult.value.data });
      } else {
        setReportError(
          reportResult.reason.response?.data?.message ||
          "Report statistics could not be loaded. You can still use the other dashboard sections."
        );
      }

      if (enrollmentResult.status === "fulfilled") {
        setEnrollments(enrollmentResult.value.data.enrollments || []);
      } else {
        setEnrollmentError(
          enrollmentResult.reason.response?.data?.message ||
          "Recent enrollments could not be loaded."
        );
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const summary = report.summary || emptyReport.summary;
  const recentEnrollments = enrollments.slice(0, 6);
  const maxCategoryCount = Math.max(
    0,
    ...report.enrollmentsByCategory.map((item) => Number(item.enrollmentCount) || 0)
  );

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const cards = [
    ["Total Courses", summary.total_courses],
    ["Total Students", summary.total_students],
    ["Total Enrollments", summary.total_enrollments],
    ["Pending Requests", summary.pending_enrollments],
    ["Students with Enrollments", summary.students_with_enrollments],
    ["Enrollments in Last 30 Days", summary.enrollments_last_30_days],
    ["Courses without Enrollments", summary.courses_without_enrollments],
  ];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}. Here is an overview of the system.
            </p>
          </div>
          <Link to="/admin/courses" className="btn btn-primary">
            <FaChartBar /> Manage Courses
          </Link>
        </div>

        {reportError && <p className="error">{reportError}</p>}
        <div className="dashboard-grid">
          {cards.map(([label, value]) => (
            <div className="dashboard-card" key={label}>
              <span className="dashboard-card-value">{loading ? "..." : Number(value) || 0}</span>
              <span className="dashboard-card-label">{label}</span>
            </div>
          ))}
        </div>

        <section className="section-card">
          <div className="section-card-header"><h2>Enrollments by Category</h2></div>
          {loading && <p className="loading">Loading...</p>}
          {!loading && report.enrollmentsByCategory.length === 0 && (
            <p className="empty">No course categories to report yet.</p>
          )}
          {!loading && report.enrollmentsByCategory.length > 0 && (
            <div className="report-category-list">
              {report.enrollmentsByCategory.map((item) => {
                const count = Number(item.enrollmentCount) || 0;
                const width = maxCategoryCount ? (count / maxCategoryCount) * 100 : 0;
                return (
                  <div className="report-category-row" key={item.category}>
                    <span>{item.category}</span>
                    <div className="report-bar-track" aria-label={`${count} enrollments`}>
                      <span className="report-bar" style={{ width: `${width}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-card-header"><h2>Top Courses by Enrollment</h2></div>
          {loading && <p className="loading">Loading...</p>}
          {!loading && report.topCourses.length === 0 && (
            <p className="empty">No courses to report yet.</p>
          )}
          {!loading && report.topCourses.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Course</th><th>Category</th><th>Enrollments</th></tr></thead>
                <tbody>
                  {report.topCourses.map((course) => (
                    <tr key={course.courseId}>
                      <td>{course.title}</td>
                      <td>{course.category}</td>
                      <td>{Number(course.enrollmentCount) || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Recent Enrollments</h2>
            <Link to="/admin/enrollments" className="link-inline">Manage enrollments</Link>
          </div>
          {enrollmentError && <p className="error">{enrollmentError}</p>}
          {loading && <p className="loading">Loading...</p>}
          {!loading && !enrollmentError && recentEnrollments.length === 0 && (
            <p className="empty">No enrollments have been made yet.</p>
          )}
          {!loading && recentEnrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Student</th><th>Username</th><th>Course</th><th>Category</th><th>Level</th><th>Status</th><th>Requested On</th></tr></thead>
                <tbody>
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.full_name}</td><td>{enrollment.username}</td>
                      <td>{enrollment.title}</td><td>{enrollment.category}</td>
                      <td><span className="tag tag-level">{enrollment.level}</span></td>
                      <td><span className={`tag tag-status tag-status-${enrollment.status}`}>{enrollment.status}</span></td>
                      <td>{formatDate(enrollment.enrolled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-card-header"><h2>Administration</h2></div>
          <div className="quick-actions">
            <Link to="/admin/courses" className="quick-action"><span className="quick-action-icon"><FaBook /></span><span>Add, edit and delete courses</span></Link>
            <Link to="/admin/enrollments" className="quick-action"><span className="quick-action-icon"><FaUsers /></span><span>Review requests and manage enrollments</span></Link>
            <Link to="/courses" className="quick-action"><span className="quick-action-icon"><FaSearch /></span><span>See the public course list</span></Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default AdminDashboard;
