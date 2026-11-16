CREATE DATABASE IF NOT EXISTS course_management;

USE course_management;


-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    full_name VARCHAR(100) NOT NULL,

    role ENUM('admin', 'student') NOT NULL
);


-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(100) NOT NULL,

    category VARCHAR(50) NOT NULL,

    level VARCHAR(30) NOT NULL,

    duration VARCHAR(30) NOT NULL,

    price DECIMAL(10, 2) NOT NULL,

    image VARCHAR(500),

    description TEXT,

    max_students INT NULL
);


-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    course_id INT NOT NULL,

    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',

    reviewed_by INT NULL,

    reviewed_at TIMESTAMP NULL,

    decision_note TEXT NULL,

    -- A student cannot enroll in the same course twice
    UNIQUE (student_id, course_id),
    INDEX idx_enrollments_enrolled_at (enrolled_at),
    INDEX idx_enrollments_course_status (course_id, status),

    -- Student account
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Course
    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- Append-only administrator audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_id INT NULL,
    actor_username VARCHAR(50) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    previous_data JSON NULL,
    new_data JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_actor (actor_id),
    INDEX idx_audit_logs_actor_username (actor_username),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_created_at (created_at)
);

CREATE TRIGGER audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_logs is append-only';

CREATE TRIGGER audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_logs is append-only';
