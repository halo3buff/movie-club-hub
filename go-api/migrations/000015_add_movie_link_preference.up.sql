ALTER TABLE users ADD COLUMN movie_link_preference text NOT NULL DEFAULT 'letterboxd'
  CHECK (movie_link_preference IN ('letterboxd', 'imdb'));
