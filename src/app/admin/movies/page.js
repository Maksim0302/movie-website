'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([])
  const [form, setForm] = useState({ tmdbId: '', slug: '', videoId: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadMovies() {
    try {
      const response = await fetch('/api/movies')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить фильмы.')
      }

      setMovies(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  useEffect(() => {
    loadMovies()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: Number(form.tmdbId),
          slug: form.slug,
          videoId: form.videoId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось добавить фильм.')
      }

      setSuccess('Фильм успешно добавлен.')
      setForm({ tmdbId: '', slug: '', videoId: '' })
      await loadMovies()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  async function handleDelete(slug) {
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/movies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось удалить фильм.')
      }

      setSuccess('Фильм удалён из каталога.')
      await loadMovies()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <section
      className="container"
      style={{ paddingTop: 40, paddingBottom: 60 }}
    >
      <h1 style={{ color: '#fff', fontSize: 32, marginBottom: 24 }}>
        Админка: фильмы
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: 16,
          maxWidth: 520,
          marginBottom: 30,
          padding: 20,
          borderRadius: 16,
          background: '#091827',
          border: '1px solid #18324b',
        }}
      >
        <label style={{ display: 'grid', gap: 8, color: '#dfeaf8' }}>
          <span>TMDB ID</span>
          <input
            name="tmdbId"
            type="number"
            required
            value={form.tmdbId}
            onChange={(event) =>
              setForm((current) => ({ ...current, tmdbId: event.target.value }))
            }
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #1b3b5d',
              background: '#0d1d2d',
              color: '#fff',
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 8, color: '#dfeaf8' }}>
          <span>Slug</span>
          <input
            name="slug"
            type="text"
            required
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({ ...current, slug: event.target.value }))
            }
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #1b3b5d',
              background: '#0d1d2d',
              color: '#fff',
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 8, color: '#dfeaf8' }}>
          <span>Cloudflare Video ID</span>
          <input
            name="videoId"
            type="text"
            required
            value={form.videoId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                videoId: event.target.value,
              }))
            }
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #1b3b5d',
              background: '#0d1d2d',
              color: '#fff',
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: '#087ef5',
            color: '#fff',
            border: '1px solid #1689ff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Добавить фильм
        </button>
      </form>

      {error ? (
        <p style={{ color: '#ffb2b2', marginBottom: 16 }}>{error}</p>
      ) : null}
      {success ? (
        <p style={{ color: '#b5f7c9', marginBottom: 16 }}>{success}</p>
      ) : null}

      <div>
        <h2 style={{ color: '#fff', marginBottom: 16 }}>Существующие фильмы</h2>

        {movies.length === 0 ? (
          <p style={{ color: '#a9b7c7' }}>Фильмы ещё не добавлены.</p>
        ) : (
          <ul style={{ display: 'grid', gap: 14 }}>
            {movies.map((movie) => (
              <li
                key={movie.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 18,
                  padding: '16px 18px',
                  borderRadius: 12,
                  background: '#091827',
                  border: '1px solid #18324b',
                }}
              >
                <div>
                  <p
                    style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}
                  >
                    {movie.title || movie.slug}
                  </p>
                  <p style={{ color: '#a9b7c7', fontSize: 14 }}>
                    TMDB ID: {movie.tmdb_id} • Video ID: {movie.video_id || '—'}
                  </p>
                  <Link
                    href={`/movies/${movie.slug}`}
                    style={{ color: '#5ca8ff', fontSize: 14 }}
                  >
                    /movies/{movie.slug}
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(movie.slug)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #7a2a2a',
                    background: '#1d0f12',
                    color: '#f9b5bb',
                    cursor: 'pointer',
                  }}
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
