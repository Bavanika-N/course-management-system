import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FaChartBar,
  FaGraduationCap,
  FaShoppingCart,
  FaSignInAlt,
} from "react-icons/fa";

import api from "../services/api";
import { isLoggedIn, isStudent, isAdmin } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function CourseDetails() {

  const { id } = useParams();
  const location = useLocation();

  const [course, setCourse] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [enrolling, setEnrolling] = useState(false);

  const [currentEnrollment, setCurrentEnrollment] = useState(null);

  const [checkingEnrollment, setCheckingEnrollment] =
    useState(false);


  // Read login state from localStorage
  const loggedIn = isLoggedIn();
  const studentLoggedIn = isStudent();
  const adminLoggedIn = isAdmin();


  // ---------- CR-007: Availability ----------

  const isUnlimited =
    course?.max_students === null ||
    course?.max_students === undefined;


  const isFull =
    course?.is_full === true ||
    Number(course?.is_full) === 1;


  const enrolledCount =
    Number(course?.enrolled_count || 0);


  const maxStudents =
    Number(course?.max_students || 0);


  const seatsRemaining =
    course?.seats_remaining === null ||
    course?.seats_remaining === undefined
      ? null
      : Number(course.seats_remaining);


  // ---------- Load the course ----------

  useEffect(() => {

    const getCourse = async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await api.get(`/courses/${id}`);

        setCourse(response.data.course);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load course"
        );

      } finally {

        setLoading(false);

      }
    };

    getCourse();

  }, [id]);


  // ---------- Check student's enrollment ----------

  useEffect(() => {

    const checkEnrollment = async () => {

      // Only students need enrollment status
      if (!studentLoggedIn) {
        setCurrentEnrollment(null);

        return;
      }


      try {

        setCheckingEnrollment(true);
        setError("");

        const response =
          await api.get("/enrollments/my");


        const enrollments =
          response.data.enrollments || [];


        const enrollment = enrollments.find(
          (item) => String(item.course_id) === String(id)
        );
        setCurrentEnrollment(enrollment || null);

      } catch (error) {

        console.error(
          "Error checking enrollment:",
          error
        );

        // Do not block the course page
        setCurrentEnrollment(null);

      } finally {

        setCheckingEnrollment(false);

      }
    };

    checkEnrollment();

  }, [id, studentLoggedIn]);


  // ---------- Enroll ----------

  const handleEnroll = async () => {

    setError("");
    setSuccess("");


    setEnrolling(true);


    try {

      const response =
        await api.post("/enrollments", {

          // Backend reads courseId
          courseId: id,

        });


      setSuccess(response.data.message);


      setCurrentEnrollment({ status: "pending" });

    } catch (error) {
      if (error.response?.status === 409) {
        try {
          const response = await api.get("/enrollments/my");
          const enrollment = (response.data.enrollments || []).find(
            (item) => String(item.course_id) === String(id)
          );
          if (enrollment) setCurrentEnrollment(enrollment);
        } catch (refreshError) {
          console.error("Error refreshing enrollment status:", refreshError);
        }
      }

      setError(
        error.response?.data?.message ||
        "Enrollment request failed. Please try again."
      );
    } finally {

      setEnrolling(false);

    }
  };


  // ---------- Loading ----------

  if (loading) {

    return (
      <>
        <Navbar />

        <div className="container">

          <p className="loading">
            Loading course...
          </p>

        </div>
      </>
    );
  }


  // ---------- Course not found / server error ----------

  if (error && !course) {

    return (
      <>
        <Navbar />

        <div className="container">

          <p className="error">
            {error}
          </p>


          <div className="center-actions">

            <Link
              to="/courses"
              className="btn btn-primary"
            >
              Back to Courses
            </Link>

          </div>

        </div>
      </>
    );
  }


  return (

    <>
      <Navbar />

      <div className="container">

        {/* ---------- Breadcrumb ---------- */}

        <p className="breadcrumb">

          <Link to="/courses">
            Courses
          </Link>

          <span> / </span>

          <span>
            {course.title}
          </span>

        </p>


        <div className="details-layout">

          {/* ---------- Left: image ---------- */}

          <div className="details-image-wrapper">

            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />

          </div>


          {/* ---------- Right: information ---------- */}

          <div className="details-info">

            <div className="course-card-tags">

              <span className="tag tag-category">
                {course.category}
              </span>

              <span className="tag tag-level">
                {course.level}
              </span>

            </div>


            <h1>
              {course.title}
            </h1>


            <p className="details-description">
              {course.description}
            </p>


            <dl className="details-list">

              <div>

                <dt>Category</dt>

                <dd>
                  {course.category}
                </dd>

              </div>


              <div>

                <dt>Level</dt>

                <dd>
                  {course.level}
                </dd>

              </div>


              <div>

                <dt>Duration</dt>

                <dd>
                  {course.duration}
                </dd>

              </div>


              <div>

                <dt>Price</dt>

                <dd className="details-price">
                  Rs. {course.price}
                </dd>

              </div>


              {/* ---------- CR-007 Availability ---------- */}

              <div>

                <dt>Availability</dt>

                <dd>

                  {isUnlimited ? (

                    <span className="availability-unlimited">
                      Unlimited
                    </span>

                  ) : isFull ? (

                    <span className="availability-full">
                      Course Full
                    </span>

                  ) : (

                    <span className="availability-seats">

                      {enrolledCount} /{" "}
                      {maxStudents} students

                      {seatsRemaining !== null && (
                        <>
                          {" "}
                          ({seatsRemaining}{" "}
                          {seatsRemaining === 1
                            ? "seat"
                            : "seats"}{" "}
                          remaining)
                        </>
                      )}

                    </span>

                  )}

                </dd>

              </div>

            </dl>


            {/* ---------- Messages ---------- */}

            {success && (

              <p className="success">
                {success}
              </p>

            )}


            {error && (

              <p className="error">
                {error}
              </p>

            )}


            {/* ---------- Action area ---------- */}

            <div className="details-actions">


              {/* ---------- Not logged in ---------- */}

              {!loggedIn && (

                <div className="notice">

                  <p>
                    Please login as a student to
                    enroll in this course.
                  </p>


                  <Link
                    to="/login"
                    state={{
                      from: location.pathname,
                    }}
                    className="btn btn-primary"
                  >

                    <FaSignInAlt />

                    Login to Enroll

                  </Link>

                </div>

              )}


              {/* ---------- Logged in as student ---------- */}

              {studentLoggedIn && (

                <>

                  {currentEnrollment?.status === "pending" ||
                  currentEnrollment?.status === "approved" ? (

                    <>

                      <span className={`tag tag-status tag-status-${currentEnrollment.status}`}>
                        {currentEnrollment.status === "pending"
                          ? "Request Pending Approval"
                          : "Approved"}
                      </span>

                      <div className="notice">

                        <p>
                          {currentEnrollment.status === "pending"
                            ? "Your enrollment request is waiting for administrator approval."
                            : "You are enrolled in this course."}
                        </p>

                      </div>


                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >

                        <FaGraduationCap />

                        My Enrollments

                      </Link>

                    </>

                  ) : (

                    <>

                      {currentEnrollment?.status === "rejected" && (
                        <>
                          <span className="tag tag-status tag-status-rejected">
                            Rejected
                          </span>
                          {currentEnrollment.decision_note && (
                            <p className="error">
                              Rejection reason: {currentEnrollment.decision_note}
                            </p>
                          )}
                        </>
                      )}

                      {isFull && (
                        <div className="notice">
                          <p>
                            This course is currently full. You may still request a
                            place; approval depends on availability.
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={handleEnroll}
                        disabled={enrolling || checkingEnrollment}
                      >

                        <FaShoppingCart />

                        {checkingEnrollment
                          ? "Checking..."
                          : enrolling
                          ? "Submitting..."
                          : currentEnrollment?.status === "rejected"
                          ? "Request Again"
                          : "Request Enrollment"}

                      </button>


                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >

                        <FaGraduationCap />

                        My Enrollments

                      </Link>

                    </>

                  )}

                </>

              )}


              {/* ---------- Logged in as admin ---------- */}

              {adminLoggedIn && (

                <div className="notice">

                  <p>
                    You are logged in as an
                    administrator. Only students can
                    enroll in courses.
                  </p>


                  <Link
                    to="/admin/courses"
                    className="btn btn-primary"
                  >

                    <FaChartBar />

                    Manage Courses

                  </Link>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

      <Footer />

    </>
  );
}

export default CourseDetails;