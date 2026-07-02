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
    // 👉 EDITA: tu titular / rol
    role: 'Desarrollador · Ingeniero · Creador de mundos digitales',
    location: 'Catalunya, España',
    // 👉 EDITA: email de contacto público (o deja el de abajo)
    email: 'hola@martivalles.dev',
    linkedin:
      'https://www.linkedin.com/in/mart%C3%AD-vall%C3%A8s-sala-75017720b',
    // 👉 EDITA: tu GitHub (deja '' si no quieres mostrarlo)
    github: '',
  },

  /* ----------------------------------------------------------------- Sobre mí */
  about: {
    heading: 'Sobre mí',
    // 👉 EDITA: tu biografía real. Esto es un placeholder.
    paragraphs: [
      'Soy Martí Vallès Sala, desarrollador e ingeniero apasionado por construir productos digitales que combinan ingeniería sólida con experiencias bonitas. Disfruto tanto resolviendo problemas complejos de backend como puliendo cada detalle de una interfaz.',
      'A lo largo de los años he trabajado en webs corporativas, juegos, herramientas internas y software industrial. Me gusta entender el problema de raíz, elegir bien las herramientas y dejar las cosas mejor de como las encontré.',
      'Cuando no estoy delante de una pantalla, me encontrarás en la montaña: el senderismo es mi forma de desconectar, ganar perspectiva y volver con ideas frescas.',
    ],
    interests: [
      'Senderismo y montaña',
      'Desarrollo web y 3D',
      'Ingeniería y automatización industrial',
      'Diseño de producto',
    ],
    planetTeaser:
      'Un mundo de montañas. Aquí vive quién soy y lo que me mueve.',
  },

  /* --------------------------------------------------------------- Cronología */
  // 👉 EDITA: tus estudios y proyectos reales, en orden cronológico (lo más reciente arriba).
  timeline: [
    {
      period: '2024',
      title: 'aggity',
      subtitle: 'Software y plataforma tecnológica',
      description:
        'Desarrollo dentro del ecosistema tecnológico de aggity, trabajando en soluciones de software a escala empresarial.',
      kind: 'trabajo',
      projectId: 'aggity',
    },
    {
      period: '2023',
      title: 'intecpro · degorg-machines',
      subtitle: 'Software para maquinaria industrial',
      description:
        'Webs y herramientas para maquinaria del sector del vino y packaging (degorg, degorgel, giropack, formapack).',
      kind: 'proyecto',
      projectId: 'intecpro',
    },
    {
      period: '2023',
      title: 'MathBattle',
      subtitle: 'Juego web de matemáticas',
      description:
        'Un juego/web donde las matemáticas se vuelven una batalla. Animaciones de símbolos y mecánicas en tiempo real.',
      kind: 'proyecto',
      projectId: 'mathbattle',
    },
    {
      period: '2022',
      title: 'KnowMe',
      subtitle: 'Proyecto web interactivo',
      description:
        'Una pequeña galaxia de información personal con micro-interacciones y efectos de partículas.',
      kind: 'proyecto',
      projectId: 'knowme',
    },
    {
      period: '2022',
      title: 'dvitae',
      subtitle: 'Web para un cliente (mi tío)',
      description:
        'Página web con una identidad visual de cubo y circuitos. Mi primer encargo real para un cliente.',
      kind: 'proyecto',
      projectId: 'dvitae',
    },
    {
      period: '2020 – 2024',
      title: 'Estudios de Ingeniería / Informática',
      subtitle: '👉 EDITA: tu titulación y centro',
      description:
        'Formación en ingeniería y desarrollo de software. Aquí van tu grado, ciclo o universidad reales.',
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
      tagline: 'Web a medida con alma de circuito',
      year: '2022',
      role: 'Diseño y desarrollo web',
      summary:
        'Web para Vitae (tecnología de seguridad, de mi tío) con su identidad: un cubo 3D blanco de circuitos rojos hecho con Three.js.',
      description: [
        'dvitae fue mi primer encargo real para un cliente: la web de la empresa de mi tío, Vitae, dedicada a la tecnología aplicada a la seguridad (videovigilancia, domótica, control de accesos y alarmas).',
        'El sello de la web es un cubo 3D blanco con aristas rojas y circuitos por los que viajan pulsos de luz, modelado con Three.js sobre Astro. Por eso en el universo dvitae es un cubo con circuitos vivos.',
      ],
      technologies: ['Astro', 'Three.js', 'JavaScript', 'CSS'],
      highlights: [
        'Cubo 3D de circuitos en Three.js',
        'Identidad de marca aplicada a toda la web',
        'Primer proyecto para cliente real',
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
      tagline: 'Una galaxia de quién soy',
      year: '2022',
      role: 'Desarrollo frontend',
      summary:
        'Proyecto web interactivo: una pequeña galaxia con estrellas que reaccionan al pasar el ratón.',
      description: [
        'KnowMe es una experiencia donde la información se presenta como una constelación. Las estrellas "popean" e interactúan al hacer hover.',
        '👉 EDITA: cuenta qué es KnowMe, para qué lo hiciste y cómo conseguiste los efectos de partículas/estrellas.',
      ],
      technologies: ['JavaScript', 'Canvas / WebGL', 'CSS'],
      highlights: [
        'Partículas y estrellas interactivas',
        'Micro-interacciones en hover',
        'Estética de galaxia',
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
        'Juego web de matemáticas con un anillo de símbolos que orbita y efectos en tiempo real.',
      description: [
        'MathBattle convierte el cálculo mental en un duelo. La web tiene un anillo de símbolos matemáticos que orbita y se dispara con cada jugada.',
        '👉 EDITA: describe las mecánicas, el modo de juego y cómo está construido por dentro.',
      ],
      technologies: ['JavaScript', 'React', 'Node.js'],
      highlights: [
        'Mecánica de batalla matemática',
        'Anillo de símbolos animado',
        'Tiempo real',
      ],
      url: 'http://mathbattle.duckdns.org:8080/',
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
      name: 'Intecpro',
      tagline: 'Software para maquinaria del vino',
      year: '2023',
      role: 'Desarrollo web',
      summary:
        'Web/herramienta para Intecpro: maquinaria industrial del sector vinícola, con su botella de vino característica.',
      description: [
        'Intecpro fabrica maquinaria para el sector del vino. Construí su presencia digital alrededor de las máquinas y de una botella de vino que es parte de la marca.',
        '👉 EDITA: detalla qué hiciste para Intecpro, qué máquinas y procesos cubría y el stack técnico.',
      ],
      technologies: ['HTML', 'CSS', 'JavaScript'],
      highlights: [
        'Catálogo de maquinaria industrial',
        'Identidad del sector vinícola',
        'Diseño corporativo',
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
      name: 'degorg-machines',
      tagline: 'Cuatro marcas, una familia de máquinas',
      year: '2023',
      role: 'Desarrollo web',
      summary:
        'Luna de Intecpro con las 4 marcas de maquinaria de cava: degorg (naranja), degorgel (azul), giropack (rojo) y formapack (azul claro).',
      description: [
        'degorg reúne cuatro líneas de maquinaria para el método tradicional del cava, cada una con el color de su logo: degorg (naranja), degorgel (azul), giropack (rojo) y formapack (azul claro). En el universo es una luna que orbita Intecpro, dividida en esos 4 colores.',
        '👉 EDITA: explica las cuatro marcas, qué hace cada máquina y cómo organizaste el sitio.',
      ],
      technologies: ['HTML', 'CSS', 'JavaScript'],
      highlights: [
        'Cuatro marcas: degorg, degorgel, giropack, formapack',
        'Color por marca: naranja, azul, rojo, azul claro',
        'Catálogo unificado',
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
      name: 'aggity',
      tagline: 'Tecnología empresarial que echa chispas',
      year: '2024',
      role: 'Desarrollo de software',
      summary:
        'Planeta de energía con la identidad de aggity: azul marino corporativo con descargas y chispas cian, muy tecnológico.',
      description: [
        'aggity es una empresa de transformación digital e IA. Su planeta es un núcleo azul marino hipertecnológico que late y echa chispas y arcos eléctricos cian sin parar.',
        '👉 EDITA: cuenta tu trabajo en aggity, en qué proyectos participaste y con qué tecnologías.',
      ],
      technologies: ['TypeScript', 'React', 'Cloud'],
      highlights: [
        'Software empresarial a escala',
        'Identidad tecnológica',
        'Trabajo en equipo',
      ],
      url: 'https://www.aggity.com', // 👉 EDITA si la URL es otra
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
