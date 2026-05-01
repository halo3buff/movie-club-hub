-- name: GetUserByID :one
SELECT id, username, password_hash, created_at, avatar_url, letterboxd_username, movie_link_preference
FROM users
WHERE id = $1;

-- name: GetUserByUsername :one
SELECT id, username, password_hash, created_at, avatar_url, letterboxd_username, movie_link_preference
FROM users
WHERE username = $1;

-- name: CreateUser :one
INSERT INTO users (username, password_hash)
VALUES ($1, $2)
RETURNING id, username, created_at;

-- name: UpdateUserPasswordHash :exec
UPDATE users SET password_hash = $2 WHERE username = $1;

-- name: UpdateUsername :exec
UPDATE users SET username = $1 WHERE id = $2;

-- name: UpdateUserPassword :exec
UPDATE users SET password_hash = $1 WHERE id = $2;

-- name: UpdateUserAvatar :one
UPDATE users SET avatar_url = $1 WHERE id = $2
RETURNING id, username, password_hash, created_at, avatar_url, letterboxd_username, movie_link_preference;

-- name: UpdateUserSettings :one
UPDATE users SET movie_link_preference = $2 WHERE id = $1
RETURNING id, username, password_hash, created_at, avatar_url, letterboxd_username, movie_link_preference;

-- name: GetUserSettings :one
SELECT movie_link_preference FROM users WHERE id = $1;
