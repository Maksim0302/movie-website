CREATE TABLE IF NOT EXISTS public.movies (
  id BIGSERIAL PRIMARY KEY,
  tmdb_id INTEGER NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  video_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id
  ON public.movies (tmdb_id);

CREATE INDEX IF NOT EXISTS idx_movies_slug
  ON public.movies (slug);

CREATE INDEX IF NOT EXISTS idx_movies_created_at
  ON public.movies (created_at DESC);
