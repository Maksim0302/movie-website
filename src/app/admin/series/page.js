'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AdminSeriesPage() {
  const [series, setSeries] = useState([])
  const emptyForm = {
    id: null,
    tmdbId: '',
    slug: '',
    videoId: '',
    youtubeUrl: '',
    telegramUrl: '',
  }
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadSeries() {
    try {
      const response = await fetch('/api/series')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить сериалы.')
      }

      setSeries(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  useEffect(() => {
    loadSeries()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/series', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          tmdbId: Number(form.tmdbId),
          slug: form.slug,
          videoId: form.videoId,
          youtubeUrl: form.youtubeUrl,
          telegramUrl: form.telegramUrl,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось добавить сериал.')
      }

      setSuccess(form.id ? 'Сериал успешно обновлён.' : 'Сериал успешно добавлен.')
      setForm(emptyForm)
      await loadSeries()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  function handleEdit(seriesItem) {
    setError('')
    setSuccess('')
    setForm({
      id: seriesItem.id,
      tmdbId: String(seriesItem.tmdb_id || ''),
      slug: seriesItem.slug || '',
      videoId: seriesItem.video_id || '',
      youtubeUrl: seriesItem.youtube_url || '',
      telegramUrl: seriesItem.telegram_url || '',
    })
  }

  async function handleDelete(slug) {
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/series', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось удалить сериал.')
      }

      setSuccess('Сериал удалён из каталога.')
      await loadSeries()
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
        Админка: сериалы
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
        {[
          { name: 'tmdbId', label: 'TMDB ID', type: 'number' },
          { name: 'slug', label: 'Slug', type: 'text' },
          { name: 'videoId', label: 'Cloudflare Video ID', type: 'text' },
          { name: 'youtubeUrl', label: 'YouTube URL', type: 'url' },
          { name: 'telegramUrl', label: 'Telegram URL', type: 'url' },
        ].map((field) => (
          <label
            key={field.name}
            style={{ display: 'grid', gap: 8, color: '#dfeaf8' }}
          >
            <span>{field.label}</span>
            <input
              name={field.name}
              type={field.type}
              required={!['youtubeUrl', 'telegramUrl'].includes(field.name)}
              value={form[field.name]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [field.name]: event.target.value,
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
        ))}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
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
            {form.id ? 'Сохранить изменения' : 'Добавить сериал'}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              style={{
                padding: '12px 18px',
                borderRadius: 10,
                background: '#0d1d2d',
                color: '#dfeaf8',
                border: '1px solid #1b3b5d',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <p style={{ color: '#ffb2b2', marginBottom: 16 }}>{error}</p>
      ) : null}
      {success ? (
        <p style={{ color: '#b5f7c9', marginBottom: 16 }}>{success}</p>
      ) : null}

      <div>
        <h2 style={{ color: '#fff', marginBottom: 16 }}>Сериалы в каталоге</h2>

        {series.length === 0 ? (
          <p style={{ color: '#a9b7c7' }}>Сериалы ещё не добавлены.</p>
        ) : (
          <ul style={{ display: 'grid', gap: 14 }}>
            {series.map((seriesItem) => (
              <li
                key={seriesItem.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 18,
                  padding: '16px 18px',
                  borderRadius: 12,
                  background: '#091827',
                  border: '1px solid #18324b',
                }}
              >
                <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                  <p style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>
                    {seriesItem.title || seriesItem.slug}
                  </p>
                  <p style={{ color: '#a9b7c7', fontSize: 14 }}>
                    TMDB ID: {seriesItem.tmdb_id} • Video ID:{' '}
                    {seriesItem.video_id || '—'}
                  </p>
                  <p style={{ color: '#a9b7c7', fontSize: 14 }}>
                    YouTube: {seriesItem.youtube_url || '—'} • Telegram:{' '}
                    {seriesItem.telegram_url || '—'}
                  </p>
                  <Link
                    href={`/series/${seriesItem.slug}`}
                    style={{ color: '#5ca8ff', fontSize: 14 }}
                  >
                    /series/{seriesItem.slug}
                  </Link>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleEdit(seriesItem)}
                    style={{
                      padding: '10px 14px',
                      minHeight: 44,
                      borderRadius: 8,
                      border: '1px solid #1b5b91',
                      background: '#0d1d2d',
                      color: '#a9d5ff',
                      cursor: 'pointer',
                    }}
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(seriesItem.slug)}
                    style={{
                      padding: '10px 14px',
                      minHeight: 44,
                      borderRadius: 8,
                      border: '1px solid #7a2a2a',
                      background: '#1d0f12',
                      color: '#f9b5bb',
                      cursor: 'pointer',
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
