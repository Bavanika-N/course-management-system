import { useEffect, useState } from "react";
import { FaFilter, FaSyncAlt } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EMPTY_FILTERS = {
  entityType: "",
  entityId: "",
  actor: "",
  action: "",
  from: "",
  to: "",
};

const PAGE_SIZE = 20;

const ACTION_OPTIONS = [
  ["COURSE_CREATED", "Course created"],
  ["COURSE_UPDATED", "Course updated"],
  ["COURSE_DELETED", "Course deleted"],
  ["ENROLLMENT_APPROVED", "Enrollment approved"],
  ["ENROLLMENT_REJECTED", "Enrollment rejected"],
  ["ENROLLMENT_DELETED", "Enrollment deleted"],
];

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function renderAuditData(data) {
  if (data === null || data === undefined) {
    return <span className="audit-log-no-data">-</span>;
  }

  return (
    <details className="audit-log-details">
      <summary>View data</summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

function AdminAuditLogs() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadAuditLogs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/audit-logs", {
          params: {
            ...appliedFilters,
            page,
            limit: PAGE_SIZE,
          },
        });

        if (active) {
          setAuditLogs(response.data.auditLogs || []);
          setPagination(response.data.pagination);
        }
      } catch (requestError) {
        if (active) {
          setAuditLogs([]);
          setError(
            requestError.response?.data?.message ||
            "Audit logs could not be loaded."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAuditLogs();
    return () => {
      active = false;
    };
  }, [appliedFilters, page]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const totalPages = pagination?.totalPages || 0;

  return (
    <>
      <Navbar />
      <main className="container">
        <div className="page-header">
          <div>
            <h1>Administrative Audit Logs</h1>
            <p className="page-subtitle">
              Review administrative changes and their before-and-after data.
            </p>
          </div>
        </div>

        <form className="filter-bar audit-log-filters" onSubmit={applyFilters}>
          <div className="form-group">
            <label htmlFor="audit-entity-type">Entity type</label>
            <select
              id="audit-entity-type"
              className="input"
              name="entityType"
              value={filters.entityType}
              onChange={updateFilter}
            >
              <option value="">All entities</option>
              <option value="course">Course</option>
              <option value="enrollment">Enrollment</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="audit-entity-id">Entity ID</label>
            <input
              id="audit-entity-id"
              className="input"
              name="entityId"
              type="number"
              min="1"
              value={filters.entityId}
              onChange={updateFilter}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audit-actor">Actor</label>
            <input
              id="audit-actor"
              className="input"
              name="actor"
              type="search"
              maxLength="100"
              value={filters.actor}
              onChange={updateFilter}
              placeholder="Username or ID"
            />
          </div>

          <div className="form-group">
            <label htmlFor="audit-action">Action</label>
            <select
              id="audit-action"
              className="input"
              name="action"
              value={filters.action}
              onChange={updateFilter}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="audit-from">From</label>
            <input
              id="audit-from"
              className="input"
              name="from"
              type="date"
              value={filters.from}
              onChange={updateFilter}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audit-to">To</label>
            <input
              id="audit-to"
              className="input"
              name="to"
              type="date"
              value={filters.to}
              onChange={updateFilter}
            />
          </div>

          <div className="audit-log-filter-actions">
            <button type="submit" className="btn btn-primary">
              <FaFilter /> Apply filters
            </button>
            <button type="button" className="btn btn-outline" onClick={clearFilters}>
              <FaSyncAlt /> Clear
            </button>
          </div>
        </form>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Audit trail</h2>
            {!loading && (
              <span className="result-count">
                {pagination.total} record{pagination.total === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {error && <p className="error">{error}</p>}
          {loading && <p className="loading">Loading audit logs...</p>}
          {!loading && !error && auditLogs.length === 0 && (
            <p className="empty">No audit records match these filters.</p>
          )}

          {!loading && !error && auditLogs.length > 0 && (
            <>
              <div className="table-wrapper">
                <table className="table audit-log-table">
                  <thead>
                    <tr>
                      <th>Date and time</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>IP address</th>
                      <th>Before</th>
                      <th>After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.created_at)}</td>
                        <td>
                          <strong>{entry.actor_username}</strong>
                          <br />
                          <span className="audit-log-secondary">
                            ID {entry.actor_id} · {entry.actor_role}
                          </span>
                        </td>
                        <td>{entry.action.replaceAll("_", " ")}</td>
                        <td>
                          {entry.entity_type} #{entry.entity_id}
                        </td>
                        <td>{entry.ip_address || "-"}</td>
                        <td>{renderAuditData(entry.previous_data)}</td>
                        <td>{renderAuditData(entry.new_data)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="enrollment-pagination">
                <p>
                  Page {pagination.page} of {totalPages} ({pagination.total} records)
                </p>
                <div className="enrollment-pagination-controls">
                  <button
                    type="button"
                    className="btn btn-outline btn-small"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-small"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AdminAuditLogs;
