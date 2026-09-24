import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaEye,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";



const EMPTY_COURSE = {
  title: "",
  category: "",
  level: "Beginner",
  duration: "",
  price: "",
  image: "",
  description: "",
};



const EMPTY_FIELD_ERRORS = {
  title: "",
  category: "",
  level: "",
  duration: "",
  price: "",
  image: "",
  description: "",
};



const LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];



// Load all courses
async function fetchAllCourses() {
  const response = await api.get("/courses");

  return response.data.courses;
}



function ManageCourses() {

  // ============================================================
  // COURSE DATA
  // ============================================================

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");



  // ============================================================
  // FORM STATES
  // ============================================================

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(EMPTY_COURSE);

  const [formError, setFormError] = useState("");

  const [fieldErrors, setFieldErrors] =
    useState(EMPTY_FIELD_ERRORS);

  const [saving, setSaving] = useState(false);



  // ============================================================
  // SEARCH + FILTER STATES
  // ============================================================

  const [searchText, setSearchText] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [selectedLevel, setSelectedLevel] =
    useState("All");

  const [minPrice, setMinPrice] = useState("");

  const [maxPrice, setMaxPrice] = useState("");



  // ============================================================
  // SORT STATES
  // CR-003 FR-015 to FR-022
  // ============================================================

  const [sortColumn, setSortColumn] = useState("");

  const [sortDirection, setSortDirection] =
    useState("asc");



  // ============================================================
  // LOAD COURSES
  // ============================================================

  useEffect(() => {

    const loadCourses = async () => {

      try {

        setCourses(await fetchAllCourses());

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load courses"
        );

      } finally {

        setLoading(false);

      }

    };

    loadCourses();

  }, []);



  // ============================================================
  // REFRESH COURSES
  // IMPORTANT:
  // Search / Filter / Sort states are NOT reset here.
  // Therefore CRUD state is preserved.
  // ============================================================

  const refreshCourses = async () => {

    try {

      const updatedCourses = await fetchAllCourses();

      setCourses(updatedCourses);

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to refresh courses"
      );

    }

  };



  // ============================================================
  // CATEGORY OPTIONS
  // ============================================================

  const categories = [
    "All",
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ];



  // ============================================================
  // LEVEL OPTIONS
  // ============================================================

  const levels = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced",
  ];



  // ============================================================
  // ACTIVE FILTER CHIPS
  // ============================================================

  const activeFilters = [];



  if (searchText.trim() !== "") {

    activeFilters.push({
      type: "search",
      label: `Search: ${searchText}`,
    });

  }



  if (selectedCategory !== "All") {

    activeFilters.push({
      type: "category",
      label: `Category: ${selectedCategory}`,
    });

  }



  if (selectedLevel !== "All") {

    activeFilters.push({
      type: "level",
      label: `Level: ${selectedLevel}`,
    });

  }



  if (minPrice !== "") {

    activeFilters.push({
      type: "minPrice",
      label: `Min Price: ${minPrice}`,
    });

  }



  if (maxPrice !== "") {

    activeFilters.push({
      type: "maxPrice",
      label: `Max Price: ${maxPrice}`,
    });

  }



  if (sortColumn !== "") {

    const columnNames = {
      id: "Course ID",
      title: "Title",
      category: "Category",
      level: "Level",
      duration: "Duration",
      price: "Price",
    };

    activeFilters.push({
      type: "sort",
      label: `Sort: ${columnNames[sortColumn]} ${
        sortDirection === "asc" ? "↑" : "↓"
      }`,
    });

  }



  // ============================================================
  // RESET FILTERS
  // CR-003 FR-026 to FR-028
  // ============================================================

  const clearAllFilters = () => {

    setSearchText("");

    setSelectedCategory("All");

    setSelectedLevel("All");

    setMinPrice("");

    setMaxPrice("");

    setSortColumn("");

    setSortDirection("asc");

  };



  // ============================================================
  // REMOVE INDIVIDUAL FILTER
  // ============================================================

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



    if (type === "sort") {

      setSortColumn("");

      setSortDirection("asc");

    }

  };



  // ============================================================
  // SEARCH + FILTER
  // ============================================================

  const filteredCourses = courses.filter((course) => {

    const id = String(course.id ?? "");

    const title = String(course.title ?? "");

    const category = String(course.category ?? "");

    const level = String(course.level ?? "");

    const description =
      String(course.description ?? "");

    const duration =
      String(course.duration ?? "");



    const search =
      searchText.toLowerCase().trim();



    // ----------------------------------------------------------
    // CR-003:
    // Search by Title, Category and Course ID
    // ----------------------------------------------------------

    const matchesSearch =
      title.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search) ||
      id.toLowerCase().includes(search);



    // ----------------------------------------------------------
    // Category filter
    // ----------------------------------------------------------

    const matchesCategory =
      selectedCategory === "All" ||
      category === selectedCategory;



    // ----------------------------------------------------------
    // Level filter
    // ----------------------------------------------------------

    const matchesLevel =
      selectedLevel === "All" ||
      level.toLowerCase() ===
        selectedLevel.toLowerCase();



    // ----------------------------------------------------------
    // Minimum price
    // ----------------------------------------------------------

    const coursePrice =
      Number(course.price) || 0;



    const matchesMinPrice =
      minPrice === "" ||
      coursePrice >= Number(minPrice);



    // ----------------------------------------------------------
    // Maximum price
    // ----------------------------------------------------------

    const matchesMaxPrice =
      maxPrice === "" ||
      coursePrice <= Number(maxPrice);



    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesMinPrice &&
      matchesMaxPrice
    );

  });



  // ============================================================
  // SORTING
  // CR-003 FR-015 to FR-022
  // ============================================================

  const sortedCourses = [...filteredCourses].sort(
    (a, b) => {

      if (!sortColumn) {
        return 0;
      }



      let valueA;
      let valueB;



      // --------------------------------------------------------
      // Numeric sorting
      // Course ID and Price
      // --------------------------------------------------------

      if (
        sortColumn === "price" ||
        sortColumn === "id"
      ) {

        valueA = Number(a[sortColumn]) || 0;

        valueB = Number(b[sortColumn]) || 0;

      }

      // --------------------------------------------------------
      // Text sorting
      // Case-insensitive
      // --------------------------------------------------------

      else {

        valueA = String(
          a[sortColumn] ?? ""
        ).toLowerCase();

        valueB = String(
          b[sortColumn] ?? ""
        ).toLowerCase();

      }



      // --------------------------------------------------------
      // Duration sorting
      // Consistent numeric-first approach
      // Example:
      // 2 Weeks
      // 5 Weeks
      // 10 Weeks
      // --------------------------------------------------------

      if (sortColumn === "duration") {

        const numberA =
          parseInt(
            String(a.duration ?? ""),
            10
          ) || 0;

        const numberB =
          parseInt(
            String(b.duration ?? ""),
            10
          ) || 0;



        if (numberA < numberB) {

          return sortDirection === "asc"
            ? -1
            : 1;

        }



        if (numberA > numberB) {

          return sortDirection === "asc"
            ? 1
            : -1;

        }



        return 0;

      }



      if (valueA < valueB) {

        return sortDirection === "asc"
          ? -1
          : 1;

      }



      if (valueA > valueB) {

        return sortDirection === "asc"
          ? 1
          : -1;

      }



      return 0;

    }
  );



  // ============================================================
  // SORT COLUMN CLICK
  // ============================================================

  const handleSort = (column) => {

    if (sortColumn === column) {

      // Same column → reverse direction

      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : "asc"
      );

    } else {

      // New column → default ascending

      setSortColumn(column);

      setSortDirection("asc");

    }

  };



  // ============================================================
  // SORT INDICATOR
  // ============================================================

  const getSortIndicator = (column) => {

    if (sortColumn !== column) {

      return "";

    }



    return sortDirection === "asc"
      ? " ↑"
      : " ↓";

  };



  // ============================================================
  // FORM HELPERS
  // ============================================================

  const handleChange = (event) => {

    const { name, value } =
      event.target;



    setFormData({
      ...formData,
      [name]: value,
    });



    if (fieldErrors[name]) {

      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });

    }

  };



  // ============================================================
  // OPEN ADD FORM
  // ============================================================

  const openAddForm = () => {

    setShowForm(true);

    setEditingId(null);

    setFormData(EMPTY_COURSE);

    setFormError("");

    setFieldErrors(EMPTY_FIELD_ERRORS);

    setError("");

    setSuccess("");

  };



  // ============================================================
  // OPEN EDIT FORM
  // ============================================================

  const openEditForm = (course) => {

    setShowForm(true);

    setEditingId(course.id);



    setFormData({

      title: course.title || "",

      category: course.category || "",

      level: course.level || "Beginner",

      duration: course.duration || "",

      price: String(course.price ?? ""),

      image: course.image || "",

      description:
        course.description || "",

    });



    setFormError("");

    setFieldErrors(EMPTY_FIELD_ERRORS);

    setError("");

    setSuccess("");

  };



  // ============================================================
  // CLOSE FORM
  // ============================================================

  const closeForm = () => {

    setShowForm(false);

    setEditingId(null);

    setFormData(EMPTY_COURSE);

    setFormError("");

    setFieldErrors(EMPTY_FIELD_ERRORS);

  };



  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  const handleSubmit = async (event) => {

    event.preventDefault();



    if (saving) {

      return;

    }



    setFormError("");

    setFieldErrors(EMPTY_FIELD_ERRORS);

    setError("");

    setSuccess("");



    // ----------------------------------------------------------
    // Basic client-side validation
    // ----------------------------------------------------------

    if (
      !formData.title.trim() ||
      !formData.category.trim() ||
      !formData.level
    ) {

      setFormError(
        "Title, category and level are required."
      );

      return;

    }



    if (!formData.duration.trim()) {

      setFormError(
        "Duration is required (for example: 8 Weeks)."
      );

      return;

    }



    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {

      setFormError(
        "Please enter a valid price."
      );

      return;

    }



    const coursePayload = {

      title: formData.title.trim(),

      category:
        formData.category.trim(),

      level: formData.level,

      duration:
        formData.duration.trim(),

      price: Number(formData.price),

      image:
        formData.image.trim(),

      description:
        formData.description.trim(),

    };



    setSaving(true);



    try {

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      if (editingId) {

        const response =
          await api.put(
            `/courses/${editingId}`,
            coursePayload
          );

        setSuccess(
          response.data.message
        );

      }

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      else {

        const response =
          await api.post(
            "/courses",
            coursePayload
          );

        setSuccess(
          response.data.message
        );

      }



      closeForm();



      // IMPORTANT:
      // We do NOT call clearAllFilters()
      // Therefore search/filter/sort stay active.
      await refreshCourses();

    } catch (error) {

      const responseData =
        error.response?.data;



      if (responseData?.errors) {

        setFieldErrors({

          ...EMPTY_FIELD_ERRORS,

          ...responseData.errors,

        });



        setFormError(
          responseData.message ||
          "Please fix the highlighted fields."
        );

      } else {

        setFormError(
          responseData?.message ||
          "Could not save the course. Please try again."
        );

      }

    } finally {

      setSaving(false);

    }

  };



  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (course) => {

    const confirmed =
      window.confirm(
        `Delete "${course.title}"? This cannot be undone.`
      );



    if (!confirmed) {

      return;

    }



    setError("");

    setSuccess("");



    try {

      const response =
        await api.delete(
          `/courses/${course.id}`
        );



      setSuccess(
        response.data.message
      );



      // IMPORTANT:
      // Search/filter/sort state remains active.
      await refreshCourses();

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Could not delete the course."
      );

    }

  };



  // ============================================================
  // RENDER
  // ============================================================

  return (

    <>

      <Navbar />



      {/* ========================================================
          PUBLIC COURSE CATALOGUE
          ======================================================== */}

      <div className="container">

        <div className="page-header">

          <div>

            <h1>Our Courses</h1>

            <p className="page-subtitle">
              Browse the full catalogue and view
              the details of any course.
            </p>

          </div>

        </div>



        {/* ------------------------------------------------------
            SEARCH + FILTER BAR
            ------------------------------------------------------ */}

        {!loading &&
          !error &&
          courses.length > 0 && (

            <div className="filter-bar">

              {/* Search */}

              <input
                type="text"
                className="input"
                placeholder="Search by title, category or course ID..."
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
              />



              {/* Category */}

              <select
                className="input"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value
                  )
                }
              >

                {categories.map(
                  (category) => (

                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>

                  )
                )}

              </select>



              {/* Level */}

              <select
                className="input"
                value={selectedLevel}
                onChange={(event) =>
                  setSelectedLevel(
                    event.target.value
                  )
                }
              >

                {levels.map(
                  (level) => (

                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>

                  )
                )}

              </select>



              {/* Minimum Price */}

              <input
                type="number"
                className="input"
                placeholder="Minimum price"
                value={minPrice}
                onChange={(event) =>
                  setMinPrice(
                    event.target.value
                  )
                }
              />



              {/* Maximum Price */}

              <input
                type="number"
                className="input"
                placeholder="Maximum price"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(
                    event.target.value
                  )
                }
              />



              {/* Reset */}

              {activeFilters.length > 0 && (

                <button
                  type="button"
                  className="clear-filter-btn"
                  onClick={clearAllFilters}
                >
                  Reset Filters
                </button>

              )}

            </div>

          )}



        {/* ------------------------------------------------------
            ACTIVE FILTER CHIPS
            ------------------------------------------------------ */}

        {!loading &&
          !error &&
          activeFilters.length > 0 && (

            <div className="active-filters">

              <strong>
                Active Filters:
              </strong>



              {activeFilters.map(
                (filter) => (

                  <span
                    className="filter-chip"
                    key={filter.type}
                  >

                    {filter.label}



                    <button
                      type="button"
                      onClick={() =>
                        removeFilter(
                          filter.type
                        )
                      }
                    >
                      ×
                    </button>

                  </span>

                )
              )}

            </div>

          )}



        {/* ------------------------------------------------------
            LOADING
            ------------------------------------------------------ */}

        {loading && (

          <p className="loading">
            Loading courses...
          </p>

        )}



        {/* ------------------------------------------------------
            ERROR
            ------------------------------------------------------ */}

        {error && !loading && (

          <p className="error">
            {error}
          </p>

        )}



        {/* ------------------------------------------------------
            NO COURSES
            ------------------------------------------------------ */}

        {!loading &&
          !error &&
          courses.length === 0 && (

            <p className="empty">
              There are no courses available
              at the moment.
            </p>

          )}



        {/* ------------------------------------------------------
            NO SEARCH/FILTER RESULTS
            ------------------------------------------------------ */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          sortedCourses.length === 0 && (

            <p className="empty">
              No courses found.
              Try changing or resetting
              your search and filters.
            </p>

          )}



        {/* ------------------------------------------------------
            COURSE CARDS
            ------------------------------------------------------ */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          sortedCourses.length > 0 && (

            <>

              <p className="result-count">
                Showing{" "}
                {sortedCourses.length}{" "}
                of{" "}
                {courses.length}{" "}
                courses
              </p>



              <div className="course-grid">

                {sortedCourses.map(
                  (course) => (

                    <CourseCard
                      key={course.id}
                      course={course}
                    />

                  )
                )}

              </div>

            </>

          )}

      </div>



      {/* ========================================================
          ADMIN MANAGE COURSES
          ======================================================== */}

      <div className="container">

        <div className="page-header">

          <div>

            <h1>Manage Courses</h1>

            <p className="page-subtitle">
              Add new courses, update the existing
              ones, or remove courses that are
              no longer offered.
            </p>

          </div>



          <button
            type="button"
            className="btn btn-primary"
            onClick={
              showForm
                ? closeForm
                : openAddForm
            }
          >

            {showForm
              ? <FaTimes />
              : <FaPlus />}



            {showForm
              ? "Cancel"
              : "Add Course"}

          </button>

        </div>



        {/* ------------------------------------------------------
            SUCCESS / ERROR
            ------------------------------------------------------ */}

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



        {/* ======================================================
            ADD / EDIT FORM
            ====================================================== */}

        {showForm && (

          <section className="section-card">

            <div className="section-card-header">

              <h2>
                {editingId
                  ? "Edit Course"
                  : "New Course"}
              </h2>

            </div>



            <form
              className="form"
              onSubmit={handleSubmit}
            >

              {/* TITLE + CATEGORY */}

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="title">
                    Title *
                  </label>



                  <input
                    id="title"
                    className="input"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. React"
                  />



                  {fieldErrors.title && (

                    <p className="field-error">
                      {fieldErrors.title}
                    </p>

                  )}

                </div>



                <div className="form-group">

                  <label htmlFor="category">
                    Category *
                  </label>



                  <input
                    id="category"
                    className="input"
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Frontend"
                  />



                  {fieldErrors.category && (

                    <p className="field-error">
                      {fieldErrors.category}
                    </p>

                  )}

                </div>

              </div>



              {/* LEVEL + DURATION + PRICE */}

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="level">
                    Level *
                  </label>



                  <select
                    id="level"
                    className="input"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                  >

                    {LEVEL_OPTIONS.map(
                      (level) => (

                        <option
                          key={level}
                          value={level}
                        >
                          {level}
                        </option>

                      )
                    )}

                  </select>



                  {fieldErrors.level && (

                    <p className="field-error">
                      {fieldErrors.level}
                    </p>

                  )}

                </div>



                <div className="form-group">

                  <label htmlFor="duration">
                    Duration *
                  </label>



                  <input
                    id="duration"
                    className="input"
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g. 10 Weeks"
                  />



                  {fieldErrors.duration && (

                    <p className="field-error">
                      {fieldErrors.duration}
                    </p>

                  )}

                </div>



                <div className="form-group">

                  <label htmlFor="price">
                    Price (Rs.) *
                  </label>



                  <input
                    id="price"
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 25000"
                  />



                  {fieldErrors.price && (

                    <p className="field-error">
                      {fieldErrors.price}
                    </p>

                  )}

                </div>

              </div>



              {/* IMAGE */}

              <div className="form-group">

                <label htmlFor="image">
                  Image URL
                </label>



                <input
                  id="image"
                  className="input"
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://placehold.co/300x180?text=React"
                />



                {fieldErrors.image && (

                  <p className="field-error">
                    {fieldErrors.image}
                  </p>

                )}

              </div>



              {/* DESCRIPTION */}

              <div className="form-group">

                <label htmlFor="description">
                  Description
                </label>



                <textarea
                  id="description"
                  className="input"
                  rows="4"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short summary of what students will learn."
                />



                {fieldErrors.description && (

                  <p className="field-error">
                    {fieldErrors.description}
                  </p>

                )}

              </div>



              {/* FORM ERROR */}

              {formError && (

                <p className="error">
                  {formError}
                </p>

              )}



              {/* FORM BUTTONS */}

              <div className="form-actions">

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >

                  <FaSave />

                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Course"
                      : "Create Course"}

                </button>



                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeForm}
                  disabled={saving}
                >

                  <FaTimes />

                  Cancel

                </button>

              </div>

            </form>

          </section>

        )}



        {/* ======================================================
            COURSE MANAGEMENT TABLE
            ====================================================== */}

        <section className="section-card">

          <div className="section-card-header">

            <h2>
              All Courses
              {courses.length > 0
                ? ` (${courses.length})`
                : ""}
            </h2>



            <Link
              to="/admin/enrollments"
              className="link-inline"
            >

              <FaEye />

              Manage enrollments

            </Link>

          </div>



          {loading && (

            <p className="loading">
              Loading courses...
            </p>

          )}



          {!loading &&
            courses.length === 0 && (

              <p className="empty">
                No courses yet.
                Click "Add Course" to create
                the first one.
              </p>

            )}



          {!loading &&
            courses.length > 0 && (

              <>

                {/* ------------------------------------------------
                    ADMIN RESULT COUNTER
                    ------------------------------------------------ */}

                <p className="result-count">

                  Showing{" "}
                  {sortedCourses.length}{" "}
                  of{" "}
                  {courses.length}{" "}
                  courses

                </p>



                {/* ------------------------------------------------
                    ADMIN TABLE
                    ------------------------------------------------ */}

                <div className="table-wrapper">

                  <table className="table">

                    <thead>

                      <tr>

                        {/* ID */}

                        <th>

                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() =>
                              handleSort("id")
                            }
                          >
                            ID
                            {getSortIndicator("id")}
                          </button>

                        </th>



                        <th>
                          Image
                        </th>



                        {/* TITLE */}

                        <th>

                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() =>
                              handleSort("title")
                            }
                          >
                            Title
                            {getSortIndicator(
                              "title"
                            )}
                          </button>

                        </th>



                        {/* CATEGORY */}

                        <th>

                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() =>
                              handleSort(
                                "category"
                              )
                            }
                          >
                            Category
                            {getSortIndicator(
                              "category"
                            )}
                          </button>

                        </th>



                        {/* LEVEL */}

                        <th>

                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() =>
                              handleSort(
                                "level"
                              )
                            }
                          >
                            Level
                            {getSortIndicator(
                              "level"
                            )}
                          </button>

                        </th>



                        {/* DURATION */}

                        <th>

                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() =>
                              handleSort(
                                "duration"
                              )
                            }
                          >
                            Duration
                            {getSortIndicator(
                              "duration"
                            )}
                          </button>

                        </th>



                        {/* PRICE */}

                        <th>

                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() =>
                              handleSort(
                                "price"
                              )
                            }
                          >
                            Price
                            {getSortIndicator(
                              "price"
                            )}
                          </button>

                        </th>



                        <th className="table-actions-column">
                          Actions
                        </th>

                      </tr>

                    </thead>



                    <tbody>

                      {sortedCourses.map(
                        (course) => (

                          <tr
                            key={course.id}
                          >

                            <td>
                              {course.id}
                            </td>



                            <td>

                              <img
                                src={
                                  course.image
                                }
                                alt={
                                  course.title
                                }
                                className="table-thumb"
                              />

                            </td>



                            <td>
                              {course.title}
                            </td>



                            <td>
                              {course.category}
                            </td>



                            <td>

                              <span className="tag tag-level">

                                {course.level}

                              </span>

                            </td>



                            <td>
                              {course.duration}
                            </td>



                            <td>
                              Rs.{" "}
                              {course.price}
                            </td>



                            <td>

                              <div className="table-actions">

                                <button
                                  type="button"
                                  className="btn btn-small btn-outline"
                                  onClick={() =>
                                    openEditForm(
                                      course
                                    )
                                  }
                                >

                                  <FaEdit />

                                  Edit

                                </button>



                                <button
                                  type="button"
                                  className="btn btn-small btn-danger"
                                  onClick={() =>
                                    handleDelete(
                                      course
                                    )
                                  }
                                >

                                  <FaTrash />

                                  Delete

                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </>

            )}

        </section>

      </div>



      <Footer />

    </>

  );

}



export default ManageCourses;