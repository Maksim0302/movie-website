# КиноТерапия

Веб-сайт каталога фильмов на Next.js с Supabase, TMDB и Cloudflare Stream.

## Setup

### 1. Установка зависимостей

```bash
npm install
```

### 2. Создание Supabase проекта

1. Создайте проект в Supabase.
2. Откройте SQL Editor.
3. Выполните SQL из файла `supabase/movies.sql`.

```sql
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
```

### 3. Получение TMDB API token

1. Перейдите в TMDB.
2. Создайте API Read Access Token.
3. Скопируйте его в `.env.local`:

```env
TMDB_TOKEN=your_tmdb_token
```

### 4. Настройка `.env.local`

Создайте файл `.env.local` на основе `.env.local.example` и заполните значения:

```env
TMDB_TOKEN=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_STREAM_CUSTOMER_CODE=
CLOUDFLARE_API_TOKEN=
```

> Для HLS URL достаточно `CLOUDFLARE_STREAM_CUSTOMER_CODE`. Остальные Cloudflare переменные можно оставить пустыми, если они не используются в текущем проекте.

### 5. Настройка Cloudflare Stream

1. Создайте проект и видео в Cloudflare Stream.
2. Получите `video_id` видеозаписи.
3. Сохраните его в поле `video_id` в таблице `movies`.
4. Для HLS используется URL вида:

```text
https://customer-<customer_code>.cloudflarestream.com/<video_id>/manifest/video.m3u8
```

### 6. Запуск проекта

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Основные маршруты

- `/` — главная страница
- `/movies` — каталог фильмов из Supabase
- `/movies/[slug]` — страница фильма
- `/admin/movies` — простая админка для добавления и удаления фильмов

## Важные ограничения

- Список фильмов формируется только из таблицы `public.movies`.
- TMDB используется только для получения метаданных по `tmdb_id`.
- Видеофайлы не хранятся в репозитории.
- Секретные ключи не попадают в клиентский JavaScript.
