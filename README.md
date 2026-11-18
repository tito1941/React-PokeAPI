# PokeWorld

PokeWorld es una interfaz de PokeAPI creada con React y Vite. Incluye listado
paginado, busqueda por nombre o numero, ficha resumida, ficha detallada,
estadisticas, datos basicos y movimientos.

## Cómo arrancarlo

Necesitas tener instalado Node.js. Después, abre una terminal en esta carpeta y ejecuta:

```bash
npm install
npm run dev
```

Vite mostrará una dirección parecida a `http://localhost:5173/`. Ábrela en el navegador.

Para detener el servidor, vuelve a la terminal y pulsa `Ctrl + C`.

## Componentes principales

- `src/App.jsx`: carga datos de PokeAPI y contiene el menu, las fichas y el footer.
- `PokemonSummary`: recibe un Pokemon y muestra su numero, nombre y tipos.
- `PokemonDetail`: recibe un Pokemon completo y muestra todos sus datos.
- `MovesList`: recibe la lista de movimientos y los muestra dinamicamente.

## Comandos disponibles

```bash
npm run dev      # inicia el servidor de desarrollo
npm run build    # crea una versión de producción
npm run lint     # revisa posibles errores de código
npm run preview  # previsualiza la versión de producción
```
