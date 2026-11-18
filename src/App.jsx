import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'https://pokeapi.co/api/v2/pokemon'
const PAGE_SIZE = 24

function formatName(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function Header({ query, onQueryChange, onSearch, onHome }) {
  return (
    <header className="header">
      <button className="brand" type="button" onClick={onHome}>
        <span className="pokeball" aria-hidden="true" />
        <span>Poke<span>World</span></span>
      </button>

      <nav className="menu" aria-label="Menu principal">
        <a href="#pokemon">Pokemon</a>
        <a href="#about">Acerca de</a>
      </nav>

      <form className="search" onSubmit={onSearch}>
        <label className="sr-only" htmlFor="pokemon-search">Buscar Pokemon</label>
        <input
          id="pokemon-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar Pokemon..."
        />
        <button type="submit" aria-label="Buscar">Buscar</button>
      </form>
    </header>
  )
}

function TypeBadge({ type }) {
  return <span className={`type-badge ${type}`}>{type}</span>
}

function PokemonSummary({ pokemon, onSelect }) {
  const image = pokemon.sprites.other['official-artwork'].front_default
    || pokemon.sprites.front_default

  return (
    <article className="pokemon-summary">
      <button type="button" onClick={() => onSelect(pokemon.id)} aria-label={`Ver ficha de ${pokemon.name}`}>
        <div className="summary-image">
          {image && <img src={image} alt={pokemon.name} />}
        </div>
        <div className="summary-info">
          <span className="pokemon-number">#{String(pokemon.id).padStart(3, '0')}</span>
          <h3>{formatName(pokemon.name)}</h3>
          <div className="types">
            {pokemon.types.map(({ type }) => (
              <TypeBadge key={type.name} type={type.name} />
            ))}
          </div>
        </div>
      </button>
    </article>
  )
}

function MovesList({ moves }) {
  return (
    <article className="moves-card">
      <h3>Movimientos</h3>
      <div className="moves-list">
        {moves.map(({ move }) => (
          <span key={move.name}>{formatName(move.name)}</span>
        ))}
      </div>
    </article>
  )
}

function PokemonDetail({ pokemon }) {
  if (!pokemon) return null

  const image = pokemon.sprites.other['official-artwork'].front_default
    || pokemon.sprites.front_default

  return (
    <section className="detail-section" id="detail">
      <div className="detail-hero">
        <div className="detail-image">
          {image && <img src={image} alt={pokemon.name} />}
        </div>
        <div className="detail-heading">
          <span>#{String(pokemon.id).padStart(3, '0')}</span>
          <h2>{formatName(pokemon.name)}</h2>
          <div className="types">
            {pokemon.types.map(({ type }) => (
              <TypeBadge key={type.name} type={type.name} />
            ))}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <article className="detail-card">
          <h3>Informacion</h3>
          <dl>
            <div><dt>Altura</dt><dd>{(pokemon.height / 10).toFixed(1)} m</dd></div>
            <div><dt>Peso</dt><dd>{(pokemon.weight / 10).toFixed(1)} kg</dd></div>
            <div><dt>Experiencia base</dt><dd>{pokemon.base_experience}</dd></div>
            <div><dt>Habilidades</dt><dd>{pokemon.abilities.map(({ ability }) => formatName(ability.name)).join(', ')}</dd></div>
            <div><dt>Especie</dt><dd>{formatName(pokemon.species.name)}</dd></div>
          </dl>
        </article>

        <article className="detail-card">
          <h3>Estadisticas base</h3>
          <div className="stats">
            {pokemon.stats.map(({ base_stat, stat }) => (
              <div className="stat" key={stat.name}>
                <div className="stat-label">
                  <span>{formatName(stat.name)}</span>
                  <strong>{base_stat}</strong>
                </div>
                <div className="stat-bar">
                  <span style={{ width: `${Math.min(base_stat, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <MovesList moves={pokemon.moves} />
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer" id="about">
      <p>PokeWorld - Datos obtenidos de PokeAPI</p>
      <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">pokeapi.co</a>
    </footer>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [pokemonList, setPokemonList] = useState([])
  const [summaries, setSummaries] = useState([])
  const [selected, setSelected] = useState(null)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadPokemonPage(limit, pageOffset) {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_URL}?limit=${limit}&offset=${pageOffset}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('No se pudo cargar la lista')
        const data = await response.json()
        setPokemonList(data.results)

        const detailResponses = await Promise.all(
          data.results.map(({ url }) => fetch(url, { signal: controller.signal }).then((res) => {
            if (!res.ok) throw new Error('No se pudo cargar un Pokemon')
            return res.json()
          })),
        )
        setSummaries(detailResponses)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadPokemonPage(PAGE_SIZE, offset)
    return () => controller.abort()
  }, [offset])

  async function selectPokemon(identifier) {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/${identifier}`)
      if (!response.ok) throw new Error('Pokemon no encontrado')
      setSelected(await response.json())
      window.setTimeout(() => document.querySelector('#detail')?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function searchPokemon(event) {
    event.preventDefault()
    const search = query.trim().toLowerCase()
    if (!search) {
      setSelected(null)
      setError('')
      return
    }
    await selectPokemon(search)
  }

  function goHome() {
    setQuery('')
    setSelected(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Header
        query={query}
        onQueryChange={setQuery}
        onSearch={searchPokemon}
        onHome={goHome}
      />

      <main className="main" id="pokemon">
        {error && <p className="error" role="alert">{error}</p>}

        {selected ? (
          <PokemonDetail pokemon={selected} />
        ) : (
          <>
            <section className="intro-section">
              <p>Explora el mundo Pokemon</p>
              <h1>Descubre todos los Pokemon</h1>
            </section>

            {loading ? (
              <p className="loading">Cargando Pokemon...</p>
            ) : (
              <>
                <section className="pokemon-grid" aria-label="Lista de Pokemon">
                  {summaries.map((pokemon) => (
                    <PokemonSummary
                      key={pokemon.id}
                      pokemon={pokemon}
                      onSelect={selectPokemon}
                    />
                  ))}
                </section>

                <nav className="pagination" aria-label="Paginacion">
                  <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                    Anterior
                  </button>
                  <span>Pagina {Math.floor(offset / PAGE_SIZE) + 1}</span>
                  <button type="button" disabled={pokemonList.length < PAGE_SIZE} onClick={() => setOffset(offset + PAGE_SIZE)}>
                    Siguiente
                  </button>
                </nav>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
