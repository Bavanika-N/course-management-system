import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function ManageEnrollments() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseError, setCourseError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);


  useEffect(() => {
    const loadCourseOptions = async () => {
      try {
        const response = await api.get("/courses");
        setCourses(response.data.courses);
      } catch (error) {
        setCourseError(
          error.response?.data?.message || "Could not load course options."
        );
      }
    };

    loadCourseOptions();
  }, []);


  useEffect(() => {
    let cancelled = false;
    const loadEnrollments = async () => {
      setLoading(true);
      setError("");

      try {
        const params = { page, limit, sort, order };
        if (search.trim()) params.q = search.trim();
        if (selectedCourseId) params.courseId = selectedCourseId;
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;

        const response = await api.get("/enrollments", { params });
        if (cancelled) return;

        setEnrollments(response.data.enrollments);
        setPagination(response.data.pagination);
      } catch (error) {
        if (cancelled) return;
        setError(
          error.response?.data?.message ||
          "Failed to load enrollments"
        );
        setEnrollments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(loadEnrollments, search.trim() ? 300 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [search, selectedCourseId, fromDate, toDate, sort, order, page, limit, reloadKey]);


  const handleDelete = async (enrollment) => {
    const confirmed = window.confirm(
      `Remove ${enrollment.full_name || enrollment.username}${
        enrollment.title ? ` from "${enrollment.title}"` : ""
      }?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      const response = await api.delete(`/enrollments/${enrollment.id}`);
      setSuccess(response.data.message);

      if (enrollments.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Could not delete the enrollment."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCourseId("");
    setFromDate("");
    setToDate("");
    setSort("date");
    setOrder("desc");
    setLimit(20);
    setPage(1);
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Manage Enrollments</h1>
            <p className="page-subtitle">
              Search, filter, and manage student enrollments.
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label htmlFor="studentSearch">Search student</label>
            <input
              id="studentSearch"
              className="input"
              type="search"
              placeholder="Name or username"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                setSuccess("");
              }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="courseFilter">Course</label>
            <select
              id="courseFilter"
              className="input"
              value={selectedCourseId}
              onChange={(event) => {
                setSuccess("");
                setSelectedCourseId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="fromDate">Enrolled from</label>
            <input
              id="fromDate"
              className="input"
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
                setSuccess("");
              }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="toDate">Enrolled to</label>
            <input
              id="toDate"
              className="input"
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
                setSuccess("");
              }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="enrollmentSort">Sort by</label>
            <select
              id="enrollmentSort"
              className="input"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              <option value="date">Enrollment date</option>
              <option value="student">Student name</option>
              <option value="course">Course name</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="sortOrder">Order</label>
            <select
              id="sortOrder"
              className="input"
              value={order}
              onChange={(event) => {
                setOrder(event.target.value);
                setPage(1);
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pageSize">Rows per page</label>
            <select
              id="pageSize"
              className="input"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={resetFilters}
          >
            Clear filters
          </button>
        </div>

        {courseError && <p className="error">{courseError}</p>}
        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}

        <section className="section-card">
          <div className="section-card-header">
            <h2>All Enrollments ({pagination.total})</h2>
          </div>

          {loading && <p className="loading">Loading enrollments...</p>}

          {!loading && !error && enrollments.length === 0 && (
            <p className="empty">
              No enrollments match the selected criteria.
            </p>
          )}

          {!loading && enrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Enrolled On</th>
                    <th className="table-actions-column">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.full_name}</td>
                      <td>{enrollment.username}</td>
                      <td>{enrollment.title}</td>
                      <td>{enrollment.category}</td>
                      <td>
                        <span className="tag tag-level">
                          {enrollment.level}
                        </span>
                      </td>
                      <td>{formatDate(enrollment.enrolled_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(enrollment)}
                        >
                          <FaTrash />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && (
            <div className="enrollment-pagination">
              <p aria-live="polite">
                Showing {pagination.total === 0 ? 0 : (page - 1) * limit + 1}
                {"–"}
                {Math.min(page * limit, pagination.total)} of {pagination.total}
              </p>
              <div className="enrollment-pagination-controls">
                <button
                  type="button"
                  className="btn btn-outline-dark btn-small"
                  onClick={() => setPage(1)}
                  disabled={page === 1 || pagination.totalPages === 0}
                  aria-label="First page"
                >
                  First
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-small"
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                  disabled={page === 1 || pagination.totalPages === 0}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-small"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  disabled={page >= pagination.totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-small"
                  onClick={() => setPage(pagination.totalPages)}
                  disabled={page >= pagination.totalPages}
                  aria-label="Last page"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}

export default ManageEnrollments;
