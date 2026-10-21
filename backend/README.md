GET    /api/courses
GET    /api/courses/:id

POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id

POST   /api/enrollments
GET    /api/enrollments/my
GET    /api/enrollments
GET    /api/enrollments/course/:courseId
DELETE /api/enrollments/:id

GET    /api/users/username/:username
GET    /api/users/:id

The admin enrollment listing accepts `q`, `courseId`, `from`, `to`, `sort`,
`order`, `page`, and `limit` query parameters. It searches student names and
usernames, supports inclusive enrollment-date bounds, and sorts by `date`,
`student`, or `course`. Pages start at 1; `limit` defaults to 20 and is capped
at 100. The response includes `pagination.page`, `limit`, `total`, and
`totalPages`.

For an existing database, apply any unapplied SQL files in `migrations` once,
in numeric order, using the `course_management` database. In particular,
`002_add_courses_max_students.sql` adds the nullable course-capacity column
without changing existing course records; their capacity remains unlimited
(`NULL`).
