ALTER TABLE enrollments
    ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    ADD COLUMN reviewed_by INT NULL,
    ADD COLUMN reviewed_at TIMESTAMP NULL,
    ADD COLUMN decision_note TEXT NULL,
    ADD INDEX idx_enrollments_course_status (course_id, status),
    ADD CONSTRAINT fk_enrollments_reviewed_by
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

ALTER TABLE enrollments
    ALTER COLUMN status SET DEFAULT 'pending';
