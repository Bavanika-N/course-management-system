import { useEffect, useState } from "react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";

function Courses() {

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Filter states ----------
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");


  // ---------- Load courses from backend ----------
  useEffect(() => {

    const getCourses = async () => {

      try {

        const response = await api.get("/courses");

        setCourses(response.data.courses);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load courses"
        );

      } finally {

        setLoading(false);

      }
    };

    getCourses();

  }, []);


  // ---------- Build category list ----------
  const categories = [
    "All",
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ];


  // ---------- Level list ----------
  const levels = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced"
  ];


  // ---------- Apply all filters ----------
  const filteredCourses = courses.filter((course) => {

    // Convert null/undefined values to empty string
    const title = String(course.title ?? "");
    const category = String(course.category ?? "");
    const level = String(course.level ?? "");
    const description = String(course.description ?? "");
    const duration = String(course.duration ?? "");

    const search = searchText.toLowerCase().trim();


    // 1. Text search
    const matchesSearch =
      title.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search) ||
      level.toLowerCase().includes(search) ||
      description.toLowerCase().includes(search) ||
      duration.toLowerCase().includes(search);


    // 2. Category filter
    const matchesCategory =
      selectedCategory === "All" ||
      category === selectedCategory;


    // 3. Level filter
    const matchesLevel =
      selectedLevel === "All" ||
      level.toLowerCase() === selectedLevel.toLowerCase();


    // 4. Minimum price
    const coursePrice = Number(course.price) || 0;

    const matchesMinPrice =
      minPrice === "" ||
      coursePrice >= Number(minPrice);


    // 5. Maximum price
    const matchesMaxPrice =
      maxPrice === "" ||
      coursePrice <= Number(maxPrice);


    // AND logic
    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesMinPrice &&
      matchesMaxPrice
    );

  });


  // ---------- Active filter chips ----------
  const activeFilters = [];


  if (searchText.trim() !== "") {
    activeFilters.push({
      type: "search",
      label: `Search: ${searchText}`
    });
  }

  if (selectedCategory !== "All") {
    activeFilters.push({
      type: "category",
      label: `Category: ${selectedCategory}`
    });
  }


  if (selectedLevel !== "All") {
    activeFilters.push({
      type: "level",
      label: `Level: ${selectedLevel}`
    });
  }


  if (minPrice !== "") {
    activeFilters.push({
      type: "minPrice",
      label: `Min Price: ${minPrice}`
    });
  }


  if (maxPrice !== "") {
    activeFilters.push({
      type: "maxPrice",
      label: `Max Price: ${maxPrice}`
    });
  }


  // ---------- Clear all filters ----------
  const clearAllFilters = () => {

    setSearchText("");
    setSelectedCategory("All");
    setSelectedLevel("All");
    setMinPrice("");
    setMaxPrice("");

  };


  // ---------- Remove individual filter ----------
  const removeFilter = (type) => {

    if (type === "search") {
      setSearchText("");
    }

    if (type === "category") {
      setSelectedCategory("All");
    }

    if (type === "level") {
      setSelectedLevel("All");
    }

    if (type === "minPrice") {
      setMinPrice("");
    }

    if (type === "maxPrice") {
      setMaxPrice("");
    }

  };


  return (

    <>
      <Navbar />

      <div className="container">

        <div className="page-header">

          <div>

            <h1>Our Courses</h1>

            <p className="page-subtitle">
              Browse the full catalogue and view the details of any course.
            </p>

          </div>

        </div>


        {/* ---------- Filters ---------- */}

        {!loading && !error && courses.length > 0 && (

          <div className="filter-bar">

            {/* Search */}
            <input
              type="text"
              className="input"
              placeholder="Search courses..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />


            {/* Category */}
            <select
              className="input"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
            >

              {categories.map((category) => (

                <option key={category} value={category}>
                  {category}
                </option>

              ))}

            </select>


            {/* Level */}
            <select
              className="input"
              value={selectedLevel}
              onChange={(event) =>
                setSelectedLevel(event.target.value)
              }
            >

              {levels.map((level) => (

                <option key={level} value={level}>
                  {level}
                </option>

              ))}

            </select>


            {/* Minimum Price */}
            <input
              type="number"
              className="input"
              placeholder="Minimum price"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />


            {/* Maximum Price */}
            <input
              type="number"
              className="input"
              placeholder="Maximum price"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />


            {/* Clear All */}
            {activeFilters.length > 0 && (

              <button
                type="button"
                className="clear-filter-btn"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </button>

            )}

          </div>

        )}


        {/* ---------- Active filter chips ---------- */}

        {!loading && !error && activeFilters.length > 0 && (

          <div className="active-filters">

            <strong>Active Filters:</strong>

            {activeFilters.map((filter) => (

              <span
                className="filter-chip"
                key={filter.type}
              >

                {filter.label}

                <button
                  type="button"
                  onClick={() => removeFilter(filter.type)}
                >
                  ×
                </button>

              </span>

            ))}

          </div>

        )}


        {/* ---------- Loading ---------- */}

        {loading && (
          <p className="loading">
            Loading courses...
          </p>
        )}


        {/* ---------- Error ---------- */}

        {error && !loading && (
          <p className="error">
            {error}
          </p>
        )}


        {/* ---------- No courses exist ---------- */}

        {!loading &&
          !error &&
          courses.length === 0 && (

            <p className="empty">
              There are no courses available at the moment.
            </p>

        )}


        {/* ---------- Courses exist but no filter match ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length === 0 && (

            <p className="empty">
              No courses match the selected filters.
              Try changing or clearing your filters.
            </p>

        )}


        {/* ---------- Course list ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length > 0 && (

            <>

              {/* Result counter */}

              <p className="result-count">
                Showing {filteredCourses.length} of {courses.length} courses
              </p>


              {/* Course cards */}

              <div className="course-grid">

                {filteredCourses.map((course) => (

                  <CourseCard
                    key={course.id}
                    course={course}
                  />

                ))}

              </div>

            </>

        )}

      </div>

      <Footer />

    </>
  );
}

export default Courses;