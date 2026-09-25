import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);

  const [sortOption, setSortOption] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();


  // ---------- Load the logged-in student's enrollments ----------
  useEffect(() => {

    const getEnrollments = async () => {

      try {

        const response = await api.get("/enrollments/my");

        setEnrollments(response.data.enrollments || []);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load your enrollments"
        );

      } finally {

        setLoading(false);

      }
    };

    getEnrollments();

  }, []);


  // ---------- Safe price conversion ----------
  const getPrice = (price) => {

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice
      : 0;

  };


  // ---------- Enrollment summary ----------
  const totalEnrolledCourses = enrollments.length;

  const totalEnrollmentValue = enrollments.reduce(
    (total, enrollment) => {
      return total + getPrice(enrollment.price);
    },
    0
  );


  const averageCoursePrice =
    enrollments.length > 0
      ? totalEnrollmentValue / enrollments.length
      : 0;


  const distinctCategories = new Set(
    enrollments
      .map((enrollment) => enrollment.category)
      .filter((category) => category)
  ).size;


  // ---------- Sort enrollments ----------
  const sortedEnrollments = useMemo(() => {

    const sorted = [...enrollments];

    switch (sortOption) {

      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.enrolled_at) - new Date(a.enrolled_at)
        );
        break;


      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.enrolled_at) - new Date(b.enrolled_at)
        );
        break;


      case "price-high":
        sorted.sort(
          (a, b) =>
            getPrice(b.price) - getPrice(a.price)
        );
        break;


      case "price-low":
        sorted.sort(
          (a, b) =>
            getPrice(a.price) - getPrice(b.price)
        );
        break;


      case "title":
        sorted.sort(
          (a, b) =>
            String(a.title || "").localeCompare(
              String(b.title || ""),
              undefined,
              { sensitivity: "base" }
            )
        );
        break;


      default:
        break;

    }

    return sorted;

  }, [enrollments, sortOption]);


  // ---------- Format price ----------
  const formatPrice = (price) => {

    return getPrice(price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  };


  // ---------- Format date ----------
  const formatDate = (value) => {

    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();

  };


  return (

    <>
      <Navbar />

      <div className="container">

        {/* ---------- Page header ---------- */}

        <div className="page-header">

          <div>

            <h1>My Enrollments</h1>

            <p className="page-subtitle">
              {user?.full_name
                ? `${user.full_name}, these are the courses you are enrolled in.`
                : "These are the courses you are enrolled in."}
            </p>

          </div>


          <Link to="/courses" className="btn btn-primary">

            <FaSearch />

            Browse More Courses

          </Link>

        </div>


        {/* ---------- Loading ---------- */}

        {loading && (
          <p className="loading">
            Loading your enrollments...
          </p>
        )}


        {/* ---------- Error ---------- */}

        {error && !loading && (
          <p className="error">
            {error}
          </p>
        )}


        {/* ---------- Enrollment content ---------- */}

        {!loading && !error && enrollments.length > 0 && (

          <>

            {/* ---------- Enrollment Summary ---------- */}

            <div className="enrollment-summary">

              <div className="enrollment-summary-card">

                <span className="enrollment-summary-value">
                  {totalEnrolledCourses}
                </span>

                <span className="enrollment-summary-label">
                  Total Enrolled Courses
                </span>

              </div>


              <div className="enrollment-summary-card">

                <span className="enrollment-summary-value">
                  Rs. {formatPrice(totalEnrollmentValue)}
                </span>

                <span className="enrollment-summary-label">
                  Total Course Value
                </span>

              </div>


              <div className="enrollment-summary-card">

                <span className="enrollment-summary-value">
                  Rs. {formatPrice(averageCoursePrice)}
                </span>

                <span className="enrollment-summary-label">
                  Average Course Price
                </span>

              </div>


              <div className="enrollment-summary-card">

                <span className="enrollment-summary-value">
                  {distinctCategories}
                </span>

                <span className="enrollment-summary-label">
                  Course Categories
                </span>

              </div>

            </div>


            {/* ---------- Sorting ---------- */}

            <div className="enrollment-sort-bar">

              <label htmlFor="enrollment-sort">
                Sort Enrollments:
              </label>


              <select
                id="enrollment-sort"
                className="input enrollment-sort-select"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value)
                }
              >

                <option value="newest">
                  Newest Enrolled
                </option>

                <option value="oldest">
                  Oldest Enrolled
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="title">
                  Course Title: A to Z
                </option>

              </select>

            </div>


            {/* ---------- Enrollment cards ---------- */}

            <div className="course-grid">

              {sortedEnrollments.map((enrollment) => (

                <article
                  className="course-card"
                  key={enrollment.id}
                >

                  <img
                    src={enrollment.image}
                    alt={enrollment.title}
                    className="course-card-image"
                    loading="lazy"
                  />


                  <div className="course-card-body">

                    <div className="course-card-tags">

                      <span className="tag tag-category">
                        {enrollment.category}
                      </span>

                      <span className="tag tag-level">
                        {enrollment.level}
                      </span>

                    </div>


                    <h3 className="course-card-title">
                      {enrollment.title}
                    </h3>


                    <p className="course-card-summary">

                      {enrollment.description?.slice(0, 100)}

                      {enrollment.description?.length > 100
                        ? "..."
                        : ""}

                    </p>


                    <ul className="course-card-meta">

                      <li>
                        <strong>Duration:</strong>{" "}
                        {enrollment.duration}
                      </li>

                      <li>
                        <strong>Price:</strong>{" "}
                        Rs. {formatPrice(enrollment.price)}
                      </li>

                      <li>
                        <strong>Enrolled on:</strong>{" "}
                        {formatDate(enrollment.enrolled_at)}
                      </li>

                    </ul>


                    <Link
                      to={`/courses/${enrollment.course_id}`}
                      className="btn btn-outline btn-block"
                    >
                      View Course
                    </Link>

                  </div>

                </article>

              ))}

            </div>

          </>

        )}


        {/* ---------- Empty state ---------- */}

        {!loading && !error && enrollments.length === 0 && (

          <div className="empty-box">

            <p className="empty">
              You have not enrolled in any courses yet.
            </p>

            <Link
              to="/courses"
              className="btn btn-primary"
            >

              <FaSearch />

              Find a Course

            </Link>

          </div>

        )}

      </div>

      <Footer />

    </>

  );

}


export default MyEnrollments;