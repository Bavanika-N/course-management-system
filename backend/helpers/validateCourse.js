const VALID_LEVELS = ["Beginner", "Intermediate", "Advanced"];
 
const DURATION_REGEX = /^[1-9]\d*\s+(Days?|Weeks?|Months?)$/i;
 
const PRICE_DECIMALS_REGEX = /^\d+(\.\d{1,2})?$/;
 
const URL_REGEX = /^https?:\/\/.+/i;
 
const validateCourse = (course = {}) => {
  const errors = {};
 
  const title = typeof course.title === "string" ? course.title.trim() : "";
  const category = typeof course.category === "string" ? course.category.trim() : "";
  const level = typeof course.level === "string" ? course.level.trim() : "";
  const duration = typeof course.duration === "string" ? course.duration.trim() : "";
  const image = typeof course.image === "string" ? course.image.trim() : "";
  const description = typeof course.description === "string" ? course.description.trim() : "";
 
  if (!title) {
    errors.title = "Title is required";
  } else if (title.length < 3) {
    errors.title = "Title must contain at least 3 characters";
  } else if (title.length > 100) {
    errors.title = "Title must not exceed 100 characters";
  }
 
  if (!category) {
    errors.category = "Category is required";
  } else if (category.length < 2) {
    errors.category = "Category must contain at least 2 characters";
  } else if (category.length > 50) {
    errors.category = "Category must not exceed 50 characters";
  }
 
  if (!level) {
    errors.level = "Level is required";
  } else if (!VALID_LEVELS.includes(level)) {
    errors.level = "Level must be Beginner, Intermediate, or Advanced";
  }
 
  if (!duration) {
    errors.duration = "Duration is required";
  } else if (!DURATION_REGEX.test(duration)) {
    errors.duration =
      "Duration must be a positive number followed by Days, Weeks, or Months (e.g. 5 Days)";
  }
 
  if (course.price === undefined || course.price === null || course.price === "") {
    errors.price = "Price is required";
  } else if (isNaN(Number(course.price))) {
    errors.price = "Price must be a valid number";
  } else {
    const priceNumber = Number(course.price);
 
    if (priceNumber < 0) {
      errors.price = "Price cannot be negative";
    } else if (priceNumber > 1000000) {
      errors.price = "Price must not exceed 1,000,000";
    } else if (!PRICE_DECIMALS_REGEX.test(String(course.price).trim())) {
      errors.price = "Price must not have more than two decimal places";
    }
  }
 
  if (image) {
    if (image.length > 500) {
      errors.image = "Image URL must not exceed 500 characters";
    } else if (!URL_REGEX.test(image)) {
      errors.image = "Image must be a valid HTTP or HTTPS URL";
    }
  }
 
  if (description && description.length > 1000) {
    errors.description = "Description must not exceed 1000 characters";
  }
 
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      title,
      category,
      level,
      duration,
      price: isNaN(Number(course.price)) ? course.price : Number(course.price),
      image,
      description,
    },
  };
};
 
module.exports = validateCourse;    