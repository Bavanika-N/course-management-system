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

  // Check whether the logged-in student is already enrolled
  const [isEnrolled, setIsEnrolled] = useState(false);

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

        setIsEnrolled(false);

        return;
      }


      try {

        setCheckingEnrollment(true);
        setError("");

        const response =
          await api.get("/enrollments/my");


        const enrollments =
          response.data.enrollments || [];


        const alreadyEnrolled =
          enrollments.some(
            (enrollment) =>
              String(enrollment.course_id) ===
              String(id)
          );


        setIsEnrolled(alreadyEnrolled);

      } catch (error) {

        console.error(
          "Error checking enrollment:",
          error
        );

        // Do not block the course page
        setIsEnrolled(false);

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


    // CR-007:
    // Do not send an enrollment request if
    // the course is already full.
    if (isFull) {

      setError(
        "This course is full. No more enrollments are available."
      );

      return;
    }


    setEnrolling(true);


    try {

      const response =
        await api.post("/enrollments", {

          // Backend reads courseId
          courseId: id,

        });


      setSuccess(response.data.message);


      // Student is now enrolled
      setIsEnrolled(true);


      // Update availability immediately
      setCourse((previousCourse) => {

        if (!previousCourse) {
          return previousCourse;
        }


        const newEnrolledCount =
          Number(previousCourse.enrolled_count || 0) + 1;


        const newSeatsRemaining =
          previousCourse.max_students === null
            ? null
            : Number(previousCourse.max_students) -
              newEnrolledCount;


        return {
          ...previousCourse,

          enrolled_count:
            newEnrolledCount,

          seats_remaining:
            newSeatsRemaining,

          is_full:
            previousCourse.max_students !== null &&
            newSeatsRemaining <= 0,
        };

      });

    } catch (error) {

      // ---------- CR-007: Course Full ----------
      if (error.response?.status === 409) {

        const message =
          error.response?.data?.message || "";


        // Course is full
        if (
          message.toLowerCase().includes("full")
        ) {

          setError(
            "This course is full. No more enrollments are available."
          );


          // Refresh course availability
          try {

            const response =
              await api.get(`/courses/${id}`);

            setCourse(
              response.data.course
            );

          } catch (refreshError) {

            console.error(
              "Error refreshing course:",
              refreshError
            );
          }


          return;
        }


        // Already enrolled
        setIsEnrolled(true);

        setError(
          "You are already enrolled in this course. You can see it in My Enrollments."
        );

      } else {

        setError(
          error.response?.data?.message ||
          "Enrollment failed. Please try again."
        );

      }

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

                  {/* Already enrolled */}

                  {isEnrolled ? (

                    <>

                      <div className="notice">

                        <p>
                          You are already enrolled
                          in this course.
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

                  ) : isFull ? (

                    /* ---------- CR-007: Course Full ---------- */

                    <>

                      <div className="notice">

                        <p>
                          This course has reached its
                          maximum capacity.
                        </p>

                      </div>


                      <button
                        type="button"
                        className="btn btn-secondary btn-lg"
                        disabled
                      >

                        Course Full

                      </button>


                      <Link
                        to="/courses"
                        className="btn btn-outline"
                      >

                        Browse Other Courses

                      </Link>

                    </>

                  ) : (

                    /* ---------- Available ---------- */

                    <>

                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={handleEnroll}
                        disabled={
                          enrolling ||
                          checkingEnrollment ||
                          isFull
                        }
                      >

                        <FaShoppingCart />

                        {checkingEnrollment
                          ? "Checking..."
                          : enrolling
                          ? "Enrolling..."
                          : "Enroll Now"}

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