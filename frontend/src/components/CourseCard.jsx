import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

function CourseCard({ course }) {

  // ---------- CR-007: Availability ----------
  const isUnlimited =
    course.max_students === null ||
    course.max_students === undefined;

  const isFull =
    course.is_full === true ||
    Number(course.is_full) === 1;


  const enrolledCount =
    Number(course.enrolled_count || 0);

  const maxStudents =
    Number(course.max_students || 0);


  return (

    <article className="course-card">

      {/* Course image from the database */}

      <img
        src={course.image}
        alt={course.title}
        className="course-card-image"
        loading="lazy"
      />


      <div className="course-card-body">

        {/* Course category and level */}

        <div className="course-card-tags">

          <span className="tag tag-category">
            {course.category}
          </span>

          <span className="tag tag-level">
            {course.level}
          </span>

        </div>


        {/* Course title */}

        <h3 className="course-card-title">
          {course.title}
        </h3>


        {/* Short summary */}

        <p className="course-card-summary">

          {course.description?.slice(0, 110)}

          {course.description?.length > 110
            ? "..."
            : ""}

        </p>


        {/* Course information */}

        <ul className="course-card-meta">

          <li>
            <strong>Duration:</strong>{" "}
            {course.duration}
          </li>

          <li>
            <strong>Price:</strong>{" "}
            Rs. {course.price}
          </li>

        </ul>


        {/* ---------- CR-007 Availability ---------- */}

        <div className="course-card-availability">

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
              {enrolledCount} / {maxStudents} students
            </span>

          )}

        </div>


        {/* View Details */}

        <Link
          to={`/courses/${course.id}`}
          className="btn btn-primary btn-block"
        >
          <FaEye />
          View Details
        </Link>

      </div>

    </article>
  );
}

export default CourseCard;