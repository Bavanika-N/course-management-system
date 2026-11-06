import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBook, FaEye, FaGraduationCap, FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const emptyReport = {
  summary: {
    enrolledCourses: 0,
    distinctCategories: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    earliestEnrollment: null,
    latestEnrollment: null,
  },
  recentEnrollments: [],
};

function StudentDashboard() {
  const [report, setReport] = useState(emptyReport);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({ courseCount: 0, studentCount: 0 });
  const [loading, setLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [supportingDataError, setSupportingDataError] = useState("");
  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      const [reportResult, enrollmentsResult, statsResult] = await Promise.allSettled([
        api.get("/reports/my"),
        api.get("/enrollments/my"),
        api.get("/courses/stats"),
      ]);

      const supportingErrors = [];
      if (reportResult.status === "fulfilled") {
        setReport({ ...emptyReport, ...reportResult.value.data });
      } else {
        setReportError(
          reportResult.reason.response?.data?.message ||
          "Your report could not be loaded. Other dashboard information is still available."
        );
      }

      if (enrollmentsResult.status === "fulfilled") {
        setEnrollments(enrollmentsResult.value.data.enrollments || []);
      } else {
        supportingErrors.push("Your enrollment details could not be loaded.");
      }

      if (statsResult.status === "fulfilled") {
        setStats({
          courseCount: Number(statsResult.value.data.courseCount) || 0,
          studentCount: Number(statsResult.value.data.studentCount) || 0,
        });
      } else {
        supportingErrors.push("Course catalog statistics could not be loaded.");
      }
      setSupportingDataError(supportingErrors.join(" "));
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const summary = report.summary || emptyReport.summary;
  const recentEnrollments = report.recentEnrollments.length
    ? report.recentEnrollments
    : enrollments.slice(0, 3);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const formatPrice = () => {
    const total = enrollments.reduce((sum, enrollment) => {
      if (enrollment.status !== "approved") return sum;
      const price = Number(enrollment.price);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
    return total.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const cards = [
    ["My Enrolled Courses", summary.enrolledCourses],
    ["Pending Requests", summary.pendingRequests],
    ["Rejected Requests", summary.rejectedRequests],
    ["Distinct Categories", summary.distinctCategories],
    ["Earliest Enrollment", formatDate(summary.earliestEnrollment)],
    ["Latest Enrollment", formatDate(summary.latestEnrollment)],
    ["Total Enrolled Course Value", `Rs. ${formatPrice()}`],
    ["Courses Available", stats.courseCount],
    ["Registered Students", stats.studentCount],
  ];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Student Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.full_name || user?.username}!</p>
          </div>
          <Link to="/courses" className="btn btn-primary"><FaSearch /> Browse Courses</Link>
        </div>

        {reportError && <p className="error">{reportError}</p>}
        {supportingDataError && <p className="error">{supportingDataError}</p>}

        <div className="dashboard-grid">
          {cards.map(([label, value]) => (
            <div className="dashboard-card" key={label}>
              <span className="dashboard-card-value">
                {loading ? "..." : typeof value === "number" ? Number(value) || 0 : value}
              </span>
              <span className="dashboard-card-label">{label}</span>
            </div>
          ))}
        </div>

        <section className="section-card">
          <div className="section-card-header">
            <h2>My Recent Enrollments</h2>
            <Link to="/my-enrollments" className="link-inline"><FaEye /> View all</Link>
          </div>
          {loading && <p className="loading">Loading...</p>}
          {!loading && recentEnrollments.length === 0 && (
            <p className="empty">
              You have no enrollment requests yet. Head over to the courses page to request a place.
            </p>
          )}
          {!loading && recentEnrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Course</th><th>Category</th><th>Level</th><th>Status</th><th>Requested On</th><th>Decision</th></tr></thead>
                <tbody>
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td><Link to={`/courses/${enrollment.course_id}`}>{enrollment.title}</Link></td>
                      <td>{enrollment.category}</td>
                      <td>{enrollment.level}</td>
                      <td><span className={`tag tag-status tag-status-${enrollment.status}`}>{enrollment.status === "pending" ? "Pending Approval" : enrollment.status}</span></td>
                      <td>{formatDate(enrollment.enrolled_at)}</td>
                      <td>
                        {enrollment.reviewed_at && formatDate(enrollment.reviewed_at)}
                        {enrollment.status === "rejected" && enrollment.decision_note && (
                          <div>{enrollment.decision_note}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-card-header"><h2>Quick Actions</h2></div>
          <div className="quick-actions">
            <Link to="/courses" className="quick-action"><span className="quick-action-icon"><FaBook /></span><span>Browse all courses</span></Link>
            <Link to="/my-enrollments" className="quick-action"><span className="quick-action-icon"><FaGraduationCap /></span><span>View my enrollments</span></Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default StudentDashboard;
