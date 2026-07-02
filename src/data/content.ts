/* =============================================================================
 *  CONTENIDO DEL PORTFOLIO  —  EDITA SOLO ESTE ARCHIVO
 * =============================================================================
 *  Aquí vive TODO el texto, enlaces y datos del portfolio y del universo 3D.
 *  No hace falta tocar nada más para personalizarlo.
 *
 *  Busca los comentarios «// 👉 EDITA» para los campos más importantes
 *  (sobre todo las URL reales de cada proyecto y los textos de "sobre mí").
 * ============================================================================= */

/* ----------------------------- Tipos --------------------------------------- */

/** Tema visual del planeta dentro del universo 3D. */
export type PlanetKind =
  | 'about'
  | 'dvitae'
  | 'knowme'
  | 'mathbattle'
  | 'intecpro'
  | 'degorg'
  | 'aggity';

export interface PlanetVisual {
  /** Identificador del componente 3D que pinta este cuerpo. */
  kind: PlanetKind;
  /** Posición en el universo [x, y, z]. */
  position: [number, number, number];
  /** Radio aproximado del planeta (escala de la escena). */
  radius: number;
  /** Color principal (hex). */
  color: string;
  /** Color de acento/brillo (hex). */
  accent: string;
  /** Si es una luna, id del planeta al que orbita (p. ej. 'intecpro'). */
  orbitsId?: string;
  /** Distancia de órbita si orbits está definido. */
  orbitRadius?: number;
}

export interface TimelineEntry {
  /** Año o rango ("2023", "2021 – 2023"). */
  period: string;
  title: string;
  subtitle: string;
  description: string;
  /** Tipo, para colorear/iconizar la cronología. */
  kind: 'estudios' | 'proyecto' | 'trabajo';
  /** Si es un proyecto del universo, su id (enlaza ambos). */
  projectId?: string;
}

export interface Project {
  /** id en kebab-case, único. Debe coincidir con planet.kind cuando aplique. */
  id: string;
  name: string;
  /** Frase corta de una línea. */
  tagline: string;
  year: string;
  /** Tu rol: "Desarrollo full-stack", "Diseño + frontend"... */
  role: string;
  /** Resumen de 1-2 frases (tarjeta). */
  summary: string;
  /** Párrafos del detalle: qué es y cómo se hizo. */
  description: string[];
  /** Tecnologías usadas. */
  technologies: string[];
  /** Puntos destacados / features. */
  highlights: string[];
  /** 👉 EDITA: URL real del proyecto en producción (se abre al aterrizar la nave). */
  url: string;
  /** Opcional: repositorio. Deja '' para ocultar. */
  repo?: string;
  /** Configuración del cuerpo celeste en el universo 3D. */
  planet: PlanetVisual;
}

export interface AboutPlanet {
  kind: 'about';
  label: string;
  position: [number, number, number];
  radius: number;
  color: string;
  accent: string;
}

export interface Content {
  profile: {
    name: string;
    firstName: string;
    /** Aparece como subtítulo bajo el título grande. */
    role: string;
    location: string;
    email: string;
    linkedin: string;
    github: string;
  };
  about: {
    heading: string;
    /** Párrafos del "sobre mí". */
    paragraphs: string[];
    /** Cosas que te gustan / aficiones (senderismo, etc.). */
    interests: string[];
    /** Frase corta que aparece al sobrevolar el planeta About en el universo. */
    planetTeaser: string;
  };
  timeline: TimelineEntry[];
  aboutPlanet: AboutPlanet;
  projects: Project[];
}

/* ----------------------------- Datos --------------------------------------- */

export const content: Content = {
  /* ------------------------------------------------------------------ Perfil */
  profile: {
    name: 'Martí Vallès Sala',
    firstName: 'Martí',
    role: 'Desarrollador Full-stack · apasionado del front-end y la UI',
    location: 'Barcelona, Catalunya, España',
    // 👉 EDITA: email de contacto público (o deja el de abajo)
    email: 'marti6727@gmail.com',
    linkedin:
      'https://www.linkedin.com/in/mart%C3%AD-vall%C3%A8s-sala-75017720b',
    // 👉 EDITA: tu GitHub (deja '' si no quieres mostrarlo)
    github: 'https://github.com/Marti-VS',
  },

  /* ----------------------------------------------------------------- Sobre mí */
  about: {
    heading: 'Sobre mí',
    paragraphs: [
      'Apasionado desarrollador web: al igual que cuando me enfrento a una montaña, encuentro mi verdadera pasión en la escalada del desarrollo front-end. Con una mochila llena de habilidades full-stack, he optado por ascender hacia las cumbres del diseño de interfaces de usuario atractivas y funcionales.',
      'Navego con confianza por los senderos de los lenguajes de programación web, me apoyo en los sólidos pasos de los frameworks y abrazo las herramientas tecnológicas más modernas. Como un excursionista en equipo, disfruto colaborando con personas de diversos campos para crear soluciones digitales innovadoras que impulsen el crecimiento de las empresas.',
      'Como escalador de problemas creativos, siempre busco las rutas más eficientes para mejorar la experiencia de usuario y la funcionalidad de los productos digitales, y me mantengo al día de las últimas tendencias y avances del mundo del desarrollo web.',
    ],
    interests: [
      'Senderismo y montaña',
      'Escalada',
      'Desarrollo front-end y UI',
      'Trabajo en equipo multidisciplinar',
      'Nuevas tecnologías web',
    ],
    planetTeaser:
      'Un mundo de montañas. Aquí vive quién soy y lo que me mueve.',
  },

  /* --------------------------------------------------------------- Cronología */
  timeline: [
    {
      period: '2025 – actualidad',
      title: 'Aggity',
      subtitle: 'Full-stack Developer',
      description:
        'Desarrollo full-stack en aggity, empresa de transformación digital e IA. Jornada completa, híbrido desde Barcelona.',
      kind: 'trabajo',
      projectId: 'aggity',
    },
    {
      period: '2025',
      title: 'dvitae',
      subtitle: 'Full-stack Developer · rebranding',
      description:
        'Rebranding completo de la web de mi tío con Astro, React, Tailwind, Three.js y varias APIs, desplegada en Vercel.',
      kind: 'trabajo',
      projectId: 'dvitae',
    },
    {
      period: '2024',
      title: 'Intecpro & Solutions',
      subtitle: 'Full-stack Developer',
      description:
        'Web dinámica intecpro.net con un gestor de contenidos propio (TursoDB + Firebase) y renderizado en servidor (SSR).',
      kind: 'trabajo',
      projectId: 'intecpro',
    },
    {
      period: '2024',
      title: 'DEGORG MACHINES',
      subtitle: 'Frontend Developer',
      description:
        'Rebranding de degorg.com con Astro. Mi primera web multi-idioma.',
      kind: 'trabajo',
      projectId: 'degorg-machines',
    },
    {
      period: '2024 – 2026',
      title: 'Grado en Ingeniería',
      subtitle: 'Universitat Oberta de Catalunya (UOC)',
      description:
        "Estudios universitarios de ingeniería (Engineer's degree) en la UOC.",
      kind: 'estudios',
    },
    {
      period: '2024 – actualidad',
      title: 'KnowMe',
      subtitle: 'Creador de portfolios web',
      description:
        'Plataforma (MVP) para que cualquiera cree y publique su portfolio web. Proyecto asociado al Institut Pedralbes.',
      kind: 'proyecto',
      projectId: 'knowme',
    },
    {
      period: '2023',
      title: 'MathBattle',
      subtitle: 'Juego web de matemáticas',
      description:
        'Juego competitivo de cálculo mental hecho en el ciclo de DAM (Vue.js + Node.js).',
      kind: 'proyecto',
      projectId: 'mathbattle',
    },
    {
      period: '2023 – 2024',
      title: 'Blunèrgia',
      subtitle: 'Junior Full Stack Developer',
      description:
        'Desarrollo full-stack a jornada parcial (remoto) durante 10 meses.',
      kind: 'trabajo',
    },
    {
      period: '2023 – 2024',
      title: 'CFGS Desarrollo de Aplicaciones Multiplataforma',
      subtitle: 'Institut Pedralbes (DAM)',
      description:
        'Ciclo Formativo de Grado Superior en desarrollo de aplicaciones multiplataforma.',
      kind: 'estudios',
    },
    {
      period: '2023',
      title: 'CodeXpert',
      subtitle: 'Proyecto final de grado superior',
      description:
        'Proyecto final de CFGS como team leader: front-end en React y DevOps para subirlo a producción (dominio propio + HTTPS).',
      kind: 'proyecto',
    },
    {
      period: '2022 – 2023',
      title: 'Datapta',
      subtitle: 'Frontend Developer (prácticas)',
      description:
        'Prácticas liderando un equipo de front-end en React: desarrollo de la página principal y de pagos.',
      kind: 'trabajo',
    },
    {
      period: '2021 – 2023',
      title: 'CFGS Desarrollo de Aplicaciones Web',
      subtitle: 'Institut Pedralbes (DAW)',
      description:
        'Ciclo Formativo de Grado Superior orientado a desarrollo web: HTML, CSS, JS, Vue, React, PHP/Laravel, MySQL/MongoDB, Node.js, SCRUM, Figma…',
      kind: 'estudios',
    },
  ],

  /* ----------------------------------------------- Planeta especial: About */
  aboutPlanet: {
    kind: 'about',
    label: 'About',
    position: [-13, 0, -22.5],
    radius: 3.0,
    color: '#5bbf7a', // verde montaña
    accent: '#cdeccf',
  },

  /* ------------------------------------------------------------- Proyectos */
  projects: [
    {
      id: 'dvitae',
      name: 'dvitae',
      tagline: 'Rebranding full-stack con alma de circuito',
      year: '2025',
      role: 'Desarrollo full-stack · rebranding completo',
      summary:
        'Rebranding completo de la web de mi tío (Vitae): un rediseño full-stack moderno con un cubo 3D de circuitos hecho en Three.js.',
      description: [
        'dvitae nació de un encargo de mi tío: su web estaba totalmente desfasada y me pidió renovarla. Hice un rebranding completo, de arriba abajo, con un stack moderno.',
        'Lo construí con Astro y React, estilado con Tailwind CSS, con un cubo 3D de circuitos en Three.js y físicas con Matter.js. Integré Resend (contacto), Google Calendar API (agenda) y OpenWeatherMap API (el tiempo), y lo desplegué con Node.js en Vercel. Por eso en el universo dvitae es un cubo con circuitos vivos.',
      ],
      technologies: ['Astro', 'React', 'Tailwind CSS', 'Three.js', 'Matter.js', 'Resend API', 'Google Calendar API', 'OpenWeatherMap API', 'Node.js', 'Vercel'],
      highlights: [
        'Rebranding completo de la web',
        'Cubo 3D de circuitos con Three.js + Matter.js',
        'Integraciones: Resend, Google Calendar y OpenWeatherMap',
      ],
      url: 'https://www.dvitae.com/',
      repo: '',
      planet: {
        kind: 'dvitae',
        position: [13, 0, -22.5],
        radius: 3.0,
        color: '#c01f33',
        accent: '#ff6680',
      },
    },
    {
      id: 'knowme',
      name: 'KnowMe',
      tagline: 'Crea y publica tu portfolio web',
      year: '2024',
      role: 'Desarrollo full-stack',
      summary:
        'Un creador de portfolios web: una herramienta para que cualquiera monte y publique el suyo. Ahora mismo es un MVP funcional.',
      description: [
        'KnowMe es una plataforma para crear portfolios web sin necesidad de programar. Cualquier persona puede montar el suyo y publicarlo en su propia ruta, por ejemplo knowme.cat/damiabrea.',
        'De momento es un MVP, pero el concepto ya se entiende y funciona. Es un proyecto asociado al Institut Pedralbes, construido con React y Astro.',
      ],
      technologies: ['React', 'Astro', 'JavaScript', 'CSS'],
      highlights: [
        'Creador de portfolios sin escribir código',
        'Cada usuario en su propia ruta (knowme.cat/tu-nombre)',
        'MVP funcional y publicable',
      ],
      url: 'https://knowme.cat/',
      repo: '',
      planet: {
        kind: 'knowme',
        position: [13, 0, 22.5],
        radius: 3.0,
        color: '#a855f7',
        accent: '#f0abfc',
      },
    },
    {
      id: 'mathbattle',
      name: 'MathBattle',
      tagline: 'Las mates convertidas en batalla',
      year: '2023',
      role: 'Desarrollo full-stack',
      summary:
        'Juego web competitivo de matemáticas: dos alumnos se enfrentan resolviendo operaciones y gana quien acierta antes.',
      description: [
        'MathBattle convierte el cálculo mental en un duelo. Lo hice durante el ciclo de DAM para motivar a los alumnos de PFI del Institut Pedralbes: dos jugadores compiten resolviendo operaciones matemáticas y gana el más rápido.',
        'Está construido con Vue.js en el front y Node.js en el back, con la partida en tiempo real. En el universo, su anillo de símbolos matemáticos orbita y se dispara con cada jugada.',
      ],
      technologies: ['Vue.js', 'Node.js', 'JavaScript'],
      highlights: [
        'Duelo de cálculo mental en tiempo real',
        'Proyecto del ciclo de DAM (Institut Pedralbes)',
        'Anillo de símbolos animado',
      ],
      url: 'https://mathbattle-nine.vercel.app/',
      repo: '',
      planet: {
        kind: 'mathbattle',
        position: [-13, 0, 22.5],
        radius: 3.0,
        color: '#7dd3fc',
        accent: '#e0f2fe',
      },
    },
    {
      id: 'intecpro',
      name: 'Intecpro Solutions',
      tagline: 'Web dinámica con gestor de contenidos a medida',
      year: '2024',
      role: 'Desarrollo full-stack',
      summary:
        'La web de Intecpro & Solutions (intecpro.net): una web dinámica con un gestor de contenidos propio, hecho de cero, con back-end y renderizado en servidor.',
      description: [
        'Para Intecpro & Solutions (la misma empresa que degorg) desarrollé intecpro.net, esta vez con una parte de back-end completa. Les creé de cero un gestor de contenidos para que pudieran publicar artículos 100% personalizados.',
        'Usé TursoDB y Firebase para los datos y el CMS, sobre Astro. Al ser una web dinámica, la desplegué con Server Side Rendering (SSR).',
      ],
      technologies: ['Astro', 'TursoDB', 'Firebase', 'Node.js', 'SSR'],
      highlights: [
        'Gestor de contenidos a medida, hecho de cero',
        'Back-end con TursoDB + Firebase',
        'Renderizado en servidor (SSR)',
      ],
      url: 'https://intecpro.net/',
      repo: '',
      planet: {
        kind: 'intecpro',
        position: [26, 0, 0],
        radius: 3.0,
        color: '#e8861f', // naranja corporativo intecpro
        accent: '#f2ede6', // blanco cálido
      },
    },
    {
      id: 'degorg-machines',
      name: 'Degorg Machines',
      tagline: 'Rebranding multi-idioma con Astro',
      year: '2024',
      role: 'Desarrollo front-end',
      summary:
        'Rebranding de la web de DEGORG MACHINES: mi primera web multi-idioma, hecha con Astro. Un trabajo del que estoy especialmente orgulloso.',
      description: [
        'En DEGORG MACHINES confiaron en mí para renovar por completo su página. Hice el rebranding con Astro, HTML, CSS y JavaScript.',
        'Fue mi primera web multi-idioma y le tengo un cariño especial. En el universo es una luna que orbita a Intecpro, dividida en los colores de sus marcas.',
      ],
      technologies: ['Astro', 'HTML', 'CSS', 'JavaScript'],
      highlights: [
        'Mi primera web multi-idioma',
        'Rebranding completo con Astro',
        'Luna que orbita el planeta Intecpro',
      ],
      url: 'https://degorg.com/',
      repo: '',
      planet: {
        kind: 'degorg',
        position: [31, 1, 7], // luna cercana a intecpro [26,0,0]
        radius: 1.8, // más pequeña: es una luna
        color: '#f39200', // naranja de degorg (los 4 colores de marca van en el componente)
        accent: '#ffd9a0',
        orbitsId: 'intecpro',
      },
    },
    {
      id: 'aggity',
      name: 'Aggity',
      tagline: 'Tecnología empresarial que echa chispas',
      year: '2025',
      role: 'Full-stack Developer',
      summary:
        'Mi trabajo actual: desarrollo full-stack en aggity, empresa de transformación digital e IA, desde Barcelona en modelo híbrido.',
      description: [
        'aggity es una empresa de transformación digital e inteligencia artificial. Desde junio de 2025 formo parte de su equipo como desarrollador full-stack, a jornada completa y en modelo híbrido desde Barcelona.',
        'Su planeta es un núcleo azul marino hipertecnológico que late y echa chispas y arcos eléctricos cian sin parar.',
      ],
      technologies: ['TypeScript', 'React', 'Cloud'],
      highlights: [
        'Mi trabajo actual (desde jun. 2025)',
        'Desarrollo full-stack',
        'Barcelona · híbrido · jornada completa',
      ],
      url: 'https://www.aggity.com',
      repo: '',
      planet: {
        kind: 'aggity',
        position: [-26, 0, 0],
        color: '#103a6e', // azul marino de marca
        accent: '#38e8ff', // cian de energía
        radius: 3.0,
      },
    },
  ],
};

/* ----------------------------- Helpers ------------------------------------- */

/** Devuelve un proyecto por id. */
export function getProject(id: string): Project | undefined {
  return content.projects.find((p) => p.id === id);
}

/** Todos los cuerpos del universo (planeta About + proyectos). */
export function getUniverseBodies() {
  return {
    about: content.aboutPlanet,
    projects: content.projects,
  };
}
