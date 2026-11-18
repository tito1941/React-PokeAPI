import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'https://pokeapi.co/api/v2/pokemon'
const PAGE_SIZE = 24

async function fetchJson(url, signal) {
  const response = await fetch(url, signal ? { signal } : undefined)
  if (!response.ok) throw new Error(`No se pudo cargar: ${url}`)
  return response.json()
}

function formatName(name) {
  return name
    ? name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    : 'Desconocido'
}

function getOfficialArtwork(pokemon) {
  return pokemon?.sprites?.other?.['official-artwork']?.front_default
    || pokemon?.sprites?.other?.home?.front_default
    || pokemon?.sprites?.front_default
}

function Header({ query, onQueryChange, onSearch, onHome }) {
  return (
    <header className="header">
      <button className="brand" type="button" onClick={onHome} aria-label="Volver al inicio">
        <span className="pokeball" aria-hidden="true" />
        <span>Poke<span>Dex</span></span>
      </button>
      <nav className="menu" aria-label="Menu principal">
        <a href="#pokemon">Pokemon</a>
        <a href="#data">Datos</a>
        <a href="#about">Acerca de</a>
      </nav>
      <form className="search" onSubmit={onSearch}>
        <label className="sr-only" htmlFor="pokemon-search">Buscar Pokemon</label>
        <input id="pokemon-search" type="search" value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Nombre o numero..." />
        <button type="submit" aria-label="Buscar Pokemon">
          <span aria-hidden="true">⌕</span>
        </button>
      </form>
    </header>
  )
}

function TypeBadge({ type, slot }) {
  return (
    <span className={`type-badge ${type}`}>
      {slot ? `${slot}. ` : ''}{type}
    </span>
  )
}

function PokemonSummary({ pokemon, onSelect }) {
  return (
    <article className="pokemon-summary">
      <button type="button" onClick={() => onSelect(pokemon.id)} aria-label={`Ver ficha completa de ${pokemon.name}`}>
        <div className="summary-image">
          <span className="summary-number">#{String(pokemon.id).padStart(4, '0')}</span>
          {getOfficialArtwork(pokemon) && <img src={getOfficialArtwork(pokemon)} alt={pokemon.name} loading="lazy" />}
        </div>
        <div className="summary-info">
          <h3>{formatName(pokemon.name)}</h3>
          <div className="summary-meta">
            <div className="types">
              {pokemon.types.map(({ type, slot }) => <TypeBadge key={type.name} type={type.name} slot={slot} />)}
            </div>
            <span>EXP {pokemon.base_experience || '—'}</span>
          </div>
        </div>
      </button>
    </article>
  )
}

function StatPanel({ pokemon }) {
  const total = pokemon.stats.reduce((sum, item) => sum + item.base_stat, 0)
  const statNames = { hp: 'PS', attack: 'Ataque', defense: 'Defensa', 'special-attack': 'Atq. especial', 'special-defense': 'Def. especial', speed: 'Velocidad' }

  return (
    <article className="panel stat-panel" id="data">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Combat statistics</span>
          <h3>Estadisticas base</h3>
        </div>
        <strong className="total-stat">{total}<small>Total</small></strong>
      </div>
      <div className="stats">
        {pokemon.stats.map(({ base_stat, stat }) => (
          <div className="stat" key={stat.name}>
            <div className="stat-label"><span>{statNames[stat.name] || formatName(stat.name)}</span><strong>{base_stat}</strong></div>
            <div className="stat-bar"><span style={{ width: `${Math.min((base_stat / 255) * 100, 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </article>
  )
}

function SpeciesPanel({ species }) {
  if (!species) return null
  const spanish = (items) => items?.find((item) => item.language.name === 'es')?.name
  const english = (items) => items?.find((item) => item.language.name === 'en')?.name
  const flavor = species.flavor_text_entries
    ?.find((item) => item.language.name === 'es')?.flavor_text
    || species.flavor_text_entries?.find((item) => item.language.name === 'en')?.flavor_text

  return (
    <article className="panel species-panel">
      <span className="eyebrow">Pokedex entry</span>
      <h3>{english(species.genera) || spanish(species.genera) || 'Especie Pokemon'}</h3>
      {flavor && <p className="flavor-text">{flavor.replace(/\f/g, ' ').replace(/\n/g, ' ')}</p>}
      <dl className="data-grid">
        <div><dt>Generacion</dt><dd>{formatName(species.generation?.name)}</dd></div>
        <div><dt>Grupo de huevo</dt><dd>{species.egg_groups?.map((item) => formatName(item.name)).join(', ') || 'Ninguno'}</dd></div>
        <div><dt>Ciclos de huevo</dt><dd>{species.hatch_counter}</dd></div>
        <div><dt>Tasa de captura</dt><dd>{species.capture_rate}</dd></div>
        <div><dt>Amistad base</dt><dd>{species.base_happiness}</dd></div>
        <div><dt>Ratio hembra/macho</dt><dd>{species.gender_rate === -1 ? 'Sin genero' : `${((8 - species.gender_rate) / 8 * 100).toFixed(1)}% / ${(species.gender_rate / 8 * 100).toFixed(1)}%`}</dd></div>
        <div><dt>Grupo de crecimiento</dt><dd>{formatName(species.growth_rate?.name)}</dd></div>
        <div><dt>Forma</dt><dd>{formatName(species.shape?.name)}</dd></div>
        <div><dt>Color</dt><dd>{formatName(species.color?.name)}</dd></div>
        <div><dt>Habitat</dt><dd>{formatName(species.habitat?.name)}</dd></div>
        <div><dt>Mitos / bebe</dt><dd>{species.is_mythical ? 'Mitico' : species.is_baby ? 'Bebe' : 'No'}</dd></div>
        <div><dt>Legendario</dt><dd>{species.is_legendary ? 'Si' : 'No'}</dd></div>
      </dl>
    </article>
  )
}

function EvolutionPanel({ evolution, onSelect }) {
  if (!evolution) return null
  const stages = []

  function walk(chain, level = 0) {
    if (!stages[level]) stages[level] = []
    stages[level].push({
      name: chain.species.name,
      id: chain.species.url.split('/').filter(Boolean).pop(),
      details: chain.evolution_details,
    })
    chain.evolves_to?.forEach((next) => walk(next, level + 1))
  }
  walk(evolution.chain)

  return (
    <article className="panel evolution-panel">
      <span className="eyebrow">Evolution chain</span>
      <h3>Linea evolutiva</h3>
      <div className="evolution-chain">
        {stages.map((stage, index) => (
          <div className="evolution-stage-row" key={index}>
            {index > 0 && <span className="evolution-arrow" aria-hidden="true">→</span>}
            {stage.map((item) => (
              <button type="button" key={item.name} onClick={() => onSelect(item.id)} className="evolution-node">
                <strong>{formatName(item.name)}</strong>
                {item.details?.map((detail, detailIndex) => (
                  <small key={detailIndex}>
                    {[detail.min_level && `Nivel ${detail.min_level}`, detail.item && formatName(detail.item.name), detail.trigger?.name && formatName(detail.trigger.name), detail.time_of_day && `(${detail.time_of_day})`]
                      .filter(Boolean).join(' · ') || 'Evolucion especial'}
                  </small>
                ))}
              </button>
            ))}
          </div>
        ))}
      </div>
    </article>
  )
}

function MovesPanel({ moves }) {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const filtered = moves.filter(({ move }) => formatName(move.name).toLowerCase().includes(query.toLowerCase()))
  const visible = showAll ? filtered : filtered.slice(0, 20)

  return (
    <article className="panel moves-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Move database</span><h3>Movimientos ({moves.length})</h3></div>
        <input className="table-search" type="search" value={query}
          onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar movimiento..." />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Movimiento</th><th>Metodo</th><th>Nivel</th><th>Version</th></tr></thead>
          <tbody>
            {visible.flatMap(({ move, version_group_details }) =>
              version_group_details.map((detail, index) => (
                <tr key={`${move.name}-${detail.version_group.name}-${index}`}>
                  <td><strong>{formatName(move.name)}</strong></td>
                  <td>{formatName(detail.move_learn_method.name)}</td>
                  <td>{detail.level_learned_at}</td>
                  <td>{formatName(detail.version_group.name)}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      {!query && filtered.length > 20 && (
        <button type="button" className="outline-button" onClick={() => setShowAll((value) => !value)}>
          {showAll ? 'Mostrar menos' : `Mostrar todos (${filtered.length} registros)`}
        </button>
      )}
    </article>
  )
}

function PokemonDetail({ pokemon, species, evolution, onSelect }) {
  const official = getOfficialArtwork(pokemon)
  const sprites = [
    ['Normal', pokemon.sprites.front_default],
    ['Normal Shiny', pokemon.sprites.front_shiny],
    ['Espalda', pokemon.sprites.back_default],
    ['Espalda Shiny', pokemon.sprites.back_shiny],
  ].filter(([, url]) => url)

  return (
    <section className="detail-section" id="detail">
      <button type="button" className="back-button" onClick={() => onSelect(null)}>← Volver al catalogo</button>
      <div className="detail-hero">
        <div className="detail-image">
          {official && <img src={official} alt={pokemon.name} />}
        </div>
        <div className="detail-heading">
          <div className="detail-kicker"><span>National Pokedex</span><strong>#{String(pokemon.id).padStart(4, '0')}</strong></div>
          <h2>{formatName(pokemon.name)}</h2>
          <div className="types">{pokemon.types.map(({ type, slot }) => <TypeBadge key={type.name} type={type.name} slot={slot} />)}</div>
          {pokemon.cries?.latest && <audio controls src={pokemon.cries.latest} className="pokemon-cry">Tu navegador no soporta audio.</audio>}
        </div>
      </div>

      <div className="detail-grid">
        <article className="panel">
          <span className="eyebrow">Biological data</span>
          <h3>Datos principales</h3>
          <dl className="data-grid">
            <div><dt>Altura</dt><dd>{(pokemon.height / 10).toFixed(1)} m</dd></div>
            <div><dt>Peso</dt><dd>{(pokemon.weight / 10).toFixed(1)} kg</dd></div>
            <div><dt>Experiencia base</dt><dd>{pokemon.base_experience}</dd></div>
            <div><dt>Orden Pokedex</dt><dd>{pokemon.order}</dd></div>
            <div><dt>Forma predeterminada</dt><dd>{pokemon.is_default ? 'Si' : 'No'}</dd></div>
            <div><dt>Especie</dt><dd>{formatName(pokemon.species.name)}</dd></div>
            <div><dt>Formas</dt><dd>{pokemon.forms.map((item) => formatName(item.name)).join(', ')}</dd></div>
            <div><dt>Habilidades</dt><dd>{pokemon.abilities.map((item) => `${formatName(item.ability.name)}${item.is_hidden ? ' (oculta)' : ''}`).join(', ')}</dd></div>
          </dl>
        </article>
        <StatPanel pokemon={pokemon} />
      </div>

      <SpeciesPanel species={species} />
      <EvolutionPanel evolution={evolution} onSelect={onSelect} />

      <div className="detail-grid secondary-grid">
        <article className="panel">
          <span className="eyebrow">Inventory</span>
          <h3>Objetos retenidos</h3>
          {pokemon.held_items.length ? (
            <ul className="tag-list">{pokemon.held_items.map((item) => <li key={item.item.name}>{formatName(item.item.name)}</li>)}</ul>
          ) : <p className="empty-copy">Este Pokemon no tiene objetos retenidos.</p>}
        </article>
        <article className="panel">
          <span className="eyebrow">Sprite gallery</span>
          <h3>Arte y sprites</h3>
          <div className="sprite-grid">
            {sprites.map(([label, url]) => <div key={label}><img src={url} alt={`${pokemon.name} ${label}`} /><span>{label}</span></div>)}
          </div>
        </article>
      </div>

      <article className="panel">
        <span className="eyebrow">Game data</span>
        <h3>Indices por juego</h3>
        <div className="game-tags">
          {pokemon.game_indices.map((item) => <span key={`${item.game_index}-${item.version.name}`}><strong>{formatName(item.version.name)}</strong> #{item.game_index}</span>)}
        </div>
      </article>

      <MovesPanel moves={pokemon.moves} />
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer" id="about">
      <div><span className="footer-mark">P</span><div><strong>PokeDex</strong><p>National Pokemon database</p></div></div>
      <p>Datos proporcionados por <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">PokeAPI</a></p>
    </footer>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [pokemonList, setPokemonList] = useState([])
  const [summaries, setSummaries] = useState([])
  const [selected, setSelected] = useState(null)
  const [species, setSpecies] = useState(null)
  const [evolution, setEvolution] = useState(null)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function loadPage() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchJson(`${API_URL}?limit=${PAGE_SIZE}&offset=${offset}`, controller.signal)
        setPokemonList(data.results)
        const details = await Promise.all(data.results.map(({ url }) => fetchJson(url, controller.signal)))
        setSummaries(details)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadPage()
    return () => controller.abort()
  }, [offset])

  useEffect(() => {
    const identifier = new URLSearchParams(window.location.search).get('pokemon')
    if (identifier) selectPokemon(identifier)
    const handlePopState = () => {
      const value = new URLSearchParams(window.location.search).get('pokemon')
      if (value) {
        selectPokemon(value)
      } else {
        goHome(false)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  async function selectPokemon(identifier) {
    if (identifier === null) {
      goHome(true)
      return
    }
    setLoading(true)
    setError('')
    try {
      const pokemon = await fetchJson(`${API_URL}/${String(identifier).toLowerCase()}`)
      const speciesData = await fetchJson(pokemon.species.url)
      let evolutionData = null
      if (speciesData.evolution_chain?.url) evolutionData = await fetchJson(speciesData.evolution_chain.url)
      setSelected(pokemon)
      setSpecies(speciesData)
      setEvolution(evolutionData)
      setQuery(pokemon.name)
      const url = new URL(window.location.href)
      url.searchParams.set('pokemon', pokemon.name)
      window.history.pushState({}, '', url)
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
    if (search) await selectPokemon(search)
  }

  function goHome(updateUrl = true) {
    setQuery('')
    setSelected(null)
    setSpecies(null)
    setEvolution(null)
    setError('')
    if (updateUrl) {
      const url = new URL(window.location.href)
      url.searchParams.delete('pokemon')
      window.history.pushState({}, '', url)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Header query={query} onQueryChange={setQuery} onSearch={searchPokemon} onHome={() => goHome(true)} />
      <main className="main" id="pokemon">
        {error && <p className="error" role="alert">{error}</p>}
        {selected ? (
          <PokemonDetail pokemon={selected} species={species} evolution={evolution} onSelect={selectPokemon} />
        ) : (
          <>
            <section className="intro-section">
              <span>National Pokedex / 001—1025</span>
              <h1>Descubre el mundo <em>Pokemon</em></h1>
              <p>Explora fichas completas con datos, especies, movimientos y evoluciones.</p>
            </section>
            {loading ? (
              <div className="loading"><span className="loader" /><p>Cargando archivos Pokemon...</p></div>
            ) : (
              <>
                <section className="pokemon-grid" aria-label="Lista de Pokemon">
                  {summaries.map((pokemon) => <PokemonSummary key={pokemon.id} pokemon={pokemon} onSelect={selectPokemon} />)}
                </section>
                <nav className="pagination" aria-label="Paginacion">
                  <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>← Anterior</button>
                  <span><small>Pagina</small>{Math.floor(offset / PAGE_SIZE) + 1}</span>
                  <button type="button" disabled={pokemonList.length < PAGE_SIZE} onClick={() => setOffset(offset + PAGE_SIZE)}>Siguiente →</button>
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
