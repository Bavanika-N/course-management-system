-- Supports per-student enrollment report ordering by most recent enrollment.
CREATE INDEX idx_enrollments_student_enrolled_at
    ON enrollments (student_id, enrolled_at);
