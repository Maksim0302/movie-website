import SearchResults from './SearchResults'

export const metadata = {
  title: 'Поиск',
  description: 'Поиск фильмов и сериалов в каталоге КиноТерапии.',
  robots: {
    index: false,
    follow: true,
  },
}

export default async function SearchPage({ searchParams }) {
  const { q = '' } = await searchParams
  const query = typeof q === 'string' ? q.trim() : ''

  return (
    <section
      className="container"
      style={{ paddingTop: 40, paddingBottom: 60 }}
    >
      <SearchResults query={query} />
    </section>
  )
}
