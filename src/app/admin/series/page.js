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
  const [episodeSeasons, setEpisodeSeasons] = useState([])
  const [episodeValues, setEpisodeValues] = useState({})
  const [loadingEpisodeMetadata, setLoadingEpisodeMetadata] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadEpisodeMetadata(tmdbId) {
    if (!tmdbId) {
      return
    }

    setLoadingEpisodeMetadata(true)

    try {
      const response = await fetch(
        `/api/series?tmdbId=${encodeURIComponent(tmdbId)}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить серии из TMDB.')
      }

      setEpisodeSeasons(Array.isArray(data) ? data : [])
      setEpisodeValues(
        Object.fromEntries(
          (Array.isArray(data) ? data : []).flatMap((season) =>
            season.episodes.map((episode) => [
              `${season.seasonNumber}:${episode.episodeNumber}`,
              {
                videoPath: '',
                durationMinutes: episode.runtime || '',
              },
            ])
          )
        )
      )
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoadingEpisodeMetadata(false)
    }
  }

  async function loadStoredEpisodes(seriesId, tmdbId) {
    const response = await fetch(
      `/api/series?seriesId=${encodeURIComponent(seriesId)}`
    )
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Не удалось загрузить серии из Supabase.')
    }

    const storedSeasons = Array.isArray(data) ? data : []

    if (storedSeasons.length === 0) {
      await loadEpisodeMetadata(tmdbId)
      return
    }

    setEpisodeSeasons(
      storedSeasons.map((season) => ({
        seasonNumber: season.seasonNumber,
        episodes: season.episodes.map((episode) => ({
          episodeNumber: episode.episodeNumber,
        })),
      }))
    )
    setEpisodeValues(
      Object.fromEntries(
        storedSeasons.flatMap((season) =>
          season.episodes.map((episode) => [
            `${season.seasonNumber}:${episode.episodeNumber}`,
            {
              videoPath: episode.videoPath || '',
              durationMinutes: episode.durationMinutes || '',
            },
          ])
        )
      )
    )
  }

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
          episodes: episodeSeasons.flatMap((season) =>
            season.episodes.map((episode) => {
              const values =
                episodeValues[
                  `${season.seasonNumber}:${episode.episodeNumber}`
                ] || {}

              return {
                seasonNumber: season.seasonNumber,
                episodeNumber: episode.episodeNumber,
                durationMinutes: values.durationMinutes,
                videoPath: values.videoPath,
              }
            })
          ),
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
      setEpisodeSeasons([])
      setEpisodeValues({})
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
    setEpisodeSeasons([])
    setEpisodeValues({})
    loadStoredEpisodes(seriesItem.id, seriesItem.tmdb_id).catch((loadError) =>
      setError(loadError.message)
    )
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
          {
            name: 'videoId',
            label: 'Cloudflare Video ID всего сериала (необязательно)',
            type: 'text',
          },
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
              required={
                !['youtubeUrl', 'telegramUrl', 'videoId'].includes(field.name)
              }
              value={form[field.name]}
              onChange={(event) => {
                const value = event.target.value
                setForm((current) => ({
                  ...current,
                  [field.name]: value,
                }))
                if (field.name === 'tmdbId' && value !== form.tmdbId) {
                  setEpisodeSeasons([])
                  setEpisodeValues({})
                }
              }}
              onBlur={
                field.name === 'tmdbId'
                  ? () => loadEpisodeMetadata(form.tmdbId)
                  : undefined
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

        {loadingEpisodeMetadata ? (
          <p style={{ color: '#a9b7c7' }}>Загружаем список серий из TMDB…</p>
        ) : null}
        {episodeSeasons.map((season) => (
          <fieldset
            key={season.seasonNumber}
            style={{
              display: 'grid',
              gap: 12,
              minWidth: 0,
              padding: 14,
              border: '1px solid #1b3b5d',
              borderRadius: 10,
            }}
          >
            <legend style={{ padding: '0 6px', color: '#dfeaf8' }}>
              {season.seasonNumber} сезон
            </legend>
            {season.episodes.map((episode) => {
              const key = `${season.seasonNumber}:${episode.episodeNumber}`

              return (
                <label
                  key={key}
                  style={{ display: 'grid', gap: 6, color: '#dfeaf8' }}
                >
                  <span>
                    {episode.episodeNumber} серия — видео и длительность
                  </span>
                  <input
                    type="text"
                    aria-label={`${episode.episodeNumber} серия — video_path`}
                    placeholder="video_path (Cloudflare ID или r2:...)"
                    value={episodeValues[key]?.videoPath || ''}
                    onChange={(event) =>
                      setEpisodeValues((current) => ({
                        ...current,
                        [key]: {
                          ...current[key],
                          videoPath: event.target.value,
                        },
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
                  <input
                    type="number"
                    min="1"
                    aria-label={`${episode.episodeNumber} серия — duration_minutes`}
                    placeholder="Длительность, минут"
                    value={episodeValues[key]?.durationMinutes || ''}
                    onChange={(event) =>
                      setEpisodeValues((current) => ({
                        ...current,
                        [key]: {
                          ...current[key],
                          durationMinutes: event.target.value,
                        },
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
              )
            })}
          </fieldset>
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
              onClick={() => {
                setForm(emptyForm)
                setEpisodeSeasons([])
                setEpisodeValues({})
              }}
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
