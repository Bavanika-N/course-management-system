const User = require("../models/userModel");
const bcrypt = require("bcrypt");

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error loading profile:", error.message);

    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const fullName = typeof req.body?.full_name === "string"
      ? req.body.full_name.trim()
      : "";
    const nameLength = [...fullName].length;

    if (nameLength < 3 || nameLength > 100) {
      return res.status(400).json({
        message: "Full name must be between 3 and 100 characters.",
      });
    }

    const user = await User.updateFullName(req.user.id, fullName);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);

    return res.status(500).json({ message: "Internal server error" });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "Current, new, and confirmation passwords are required.",
      });
    }

    if ([...newPassword].length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters.",
      });
    }

    if (Buffer.byteLength(newPassword, "utf8") > 72) {
      return res.status(400).json({
        message: "New password must not exceed 72 bytes.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirmation do not match.",
      });
    }

    const user = await User.findByUsername(req.user.username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!currentPasswordMatches) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        message: "New password must be different from your current password.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await User.updatePassword(req.user.id, passwordHash);

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error.message);

    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get user by username
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (req.user.role !== "admin" && username !== req.user.username) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "User found",
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error("Error finding user:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin" && String(req.user.id) !== id) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User found",
      user,
    });

  } catch (error) {
    console.error("Error finding user:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  getUserByUsername,
  getUserById,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
};
