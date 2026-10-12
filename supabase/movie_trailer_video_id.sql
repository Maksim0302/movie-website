ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS trailer_video_id TEXT NULL;

ALTER TABLE public.movies
  ALTER COLUMN availability_status DROP NOT NULL;

UPDATE public.movies
SET availability_status = CASE
  WHEN NULLIF(BTRIM(video_id), '') IS NOT NULL THEN 'full_movie'
  WHEN NULLIF(BTRIM(trailer_video_id), '') IS NOT NULL THEN 'trailer_only'
  ELSE NULL
END;
