ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'full_movie'
  CHECK (availability_status IN ('full_movie', 'trailer_only'));
