# 🌌 Universo de Martí Vallès Sala

Portfolio personal con una landing elegante y un **universo 3D navegable**: pilotas
una nave y cada planeta es uno de tus proyectos. Al aterrizar en un planeta se abre
la web de ese proyecto.

Construido con **Astro 5 + React 19 (islas) + Three.js (React Three Fiber + drei) +
Tailwind v4 + GSAP**.

---

## 🚀 Puesta en marcha

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo -> http://localhost:4321
npm run build    # genera el sitio estático en dist/
npm run preview  # sirve el build de producción para probarlo
npm run check    # comprobación de tipos (astro check)
```

> **Node:** el proyecto usa Astro 5 porque tu Node es la 20.13. Si actualizas a
> Node ≥ 22.12 podrías subir a Astro 7 (`npx @astrojs/upgrade`), pero no es necesario.

---

## ✍️ Cómo personalizar el contenido

**Todo el texto, enlaces y datos están en un único archivo:**

### 👉 [`src/data/content.ts`](src/data/content.ts)

Ahí encontrarás comentarios `// 👉 EDITA` en los campos importantes. Lo más urgente:

| Qué | Dónde |
|-----|-------|
| Tu bio / "sobre mí" | `about.paragraphs` |
| Tus aficiones (senderismo…) | `about.interests` |
| Estudios y cronología | `timeline[]` |
| **URLs reales de cada proyecto** | cada `project.url` (se abre al aterrizar) |
| Descripciones y tecnologías | `project.description`, `project.technologies` |
| Email / LinkedIn / GitHub | `profile` |

Cambia ese archivo y todo (landing + universo) se actualiza solo.

### Pendiente de rellenar por ti
- ✅ Las **URLs** ya apuntan a las webs reales (dvitae.com, knowme.cat,
  intecpro.net, degorg.com, mathbattle, aggity.com).
- Tus **textos reales** de bio, estudios y descripciones de proyectos.
- Tu **email** público y, si quieres, tu **GitHub**.

---

## 🪐 El universo 3D

- Ruta: **`/universo`** (botón **Empezar** en la landing, con transición de salto a
  la velocidad de la luz).
- **Controles:** clic en un planeta → la nave vuela y aterriza (abre su web).
  Clic en el espacio vacío → la nave se mueve a ese punto. También hay un dock de
  destinos a la izquierda.
- Cada planeta tiene su tema y efectos de hover:
  - **About** → planeta con montañas y casquete polar.
  - **dvitae** → recreación fiel de su cubo real: blanco, aristas rojas y circuitos con pulsos que viajan.
  - **knowme** → galaxia en espiral con estrellas que popean al pasar el ratón.
  - **mathbattle** → planeta azul con anillo que dispara símbolos matemáticos.
  - **intecpro** → planeta industrial con engranajes y una botella que gotea vino.
  - **degorg-machines** → luna de 4 colores (degorg/degorgel/giropack/formapack).
  - **aggity** → planeta tecnológico azul que echa chispas.

### Ajustar planetas
Posición, tamaño y colores de cada planeta están en `content.ts` dentro de
`project.planet` (y `aboutPlanet`). Los efectos visuales viven en
[`src/components/universe/planets/`](src/components/universe/planets/).

> Nota sobre abrir webs: al aterrizar se intenta abrir la web automáticamente, pero
> los navegadores suelen bloquear pestañas que no nacen de un clic directo. Por eso
> el panel de aterrizaje siempre muestra un botón **"Abrir la web ↗"** que funciona
> con seguridad.

---

## 🗂️ Estructura

```
src/
├── data/content.ts          ← EDITA AQUÍ todo el contenido
├── styles/global.css        ← tema, colores, fuentes, efecto galáctico
├── layouts/Layout.astro
├── pages/
│   ├── index.astro          ← landing
│   └── universo.astro       ← experiencia 3D
└── components/
    ├── Navbar / Hero / About / Timeline / Projects / Footer
    ├── Starfield / WarpTransition
    └── universe/            ← toda la escena 3D (R3F)
        ├── Universe.tsx      ← isla React (Canvas + HUD)
        ├── Scene / Ship / CameraRig / PlanetBody / Nebula
        └── planets/          ← un componente por planeta
```

---

## 🌍 Desplegar

El sitio es **estático**. Tras `npm run build`, sube la carpeta `dist/` a cualquier
hosting estático (Netlify, Vercel, Cloudflare Pages, GitHub Pages…). En Netlify/Vercel
basta con conectar el repo: build `npm run build`, directorio de salida `dist`.
