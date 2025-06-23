import { User, Course, Role, Cost } from './types';

export const roles: Role[] = [
  'Trabajador',
  'Personal Externo',
  'Formador',
  'Gestor de RRHH',
  'Jefe de Formación',
  'Administrador General',
];

export const user: User = {
  id: 'user_1',
  name: 'Elena Vargas',
  email: 'elena.vargas@example.com',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  role: 'Jefe de Formación',
};

export const courses: Course[] = [
  {
    id: 'course_1',
    title: 'Liderazgo y Gestión de Equipos',
    description: 'Desarrolla habilidades de liderazgo y aprende a gestionar equipos de alto rendimiento.',
    longDescription: 'Este curso intensivo está diseñado para gerentes, supervisores y cualquier persona en un rol de liderazgo. Cubre temas como la comunicación efectiva, resolución de conflictos, motivación de equipos y delegación de tareas. A través de casos prácticos y simulaciones, los participantes aprenderán a aplicar estos conceptos en su día a día laboral.',
    instructor: 'Carlos Mendoza',
    duration: '20 horas',
    modality: 'Online',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'leadership team',
    progress: 75,
    modules: [
        { id: 'm1_1', title: 'Introducción al Liderazgo Moderno', duration: '2 horas', content: 'Contenido sobre liderazgo moderno.' },
        { id: 'm1_2', title: 'Comunicación Efectiva', duration: '3 horas', content: 'Contenido sobre comunicación.' },
        { id: 'm1_3', title: 'Gestión de Conflictos', duration: '3 horas', content: 'Contenido sobre gestión de conflictos.' },
    ],
  },
  {
    id: 'course_2',
    title: 'Inteligencia Artificial para Negocios',
    description: 'Descubre cómo la IA puede transformar tu negocio y optimizar procesos.',
    longDescription: 'En este curso, exploraremos las aplicaciones prácticas de la Inteligencia Artificial en el mundo empresarial. No se requieren conocimientos técnicos previos. Analizaremos cómo la IA está revolucionando el marketing, las ventas, la logística y la atención al cliente. Incluye estudios de caso de empresas líderes y una guía para implementar una estrategia de IA.',
    instructor: 'Sofía Acosta',
    duration: '15 horas',
    modality: 'Online',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'artificial intelligence',
    progress: 40,
    modules: [
      { id: 'm2_1', title: 'Fundamentos de la IA', duration: '3 horas', content: 'Contenido sobre fundamentos de IA.' },
      { id: 'm2_2', title: 'IA en Marketing y Ventas', duration: '4 horas', content: 'Contenido sobre IA en marketing.' },
      { id: 'm2_3', title: 'Implementación de Estrategias de IA', duration: '5 horas', content: 'Contenido sobre estrategias de IA.' },
    ],
  },
  {
    id: 'course_3',
    title: 'Ciberseguridad Corporativa',
    description: 'Protege la información de tu empresa contra las ciberamenazas actuales.',
    longDescription: 'Este curso esencial proporciona a los empleados las herramientas necesarias para identificar y prevenir amenazas de ciberseguridad. Cubre temas como phishing, malware, ingeniería social y buenas prácticas para la gestión de contraseñas y datos sensibles. Es una formación fundamental para todos los niveles de la organización.',
    instructor: 'David Guerrero',
    duration: '10 horas',
    modality: 'Presencial',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'cybersecurity office',
    progress: 90,
    modules: [
      { id: 'm3_1', title: 'Introducción a la Ciberseguridad', duration: '2 horas', content: 'Contenido sobre ciberseguridad.' },
      { id: 'm3_2', title: 'Tipos de Amenazas', duration: '4 horas', content: 'Contenido sobre tipos de amenazas.' },
    ],
  },
  {
    id: 'course_4',
    title: 'Análisis de Datos con Power BI',
    description: 'Transforma datos en decisiones estratégicas con la herramienta líder del mercado.',
    longDescription: 'Aprende a conectar, transformar y visualizar datos con Power BI. Este curso práctico te guiará desde los conceptos básicos hasta la creación de dashboards interactivos y complejos. Es ideal para analistas, personal de finanzas, marketing y cualquier profesional que trabaje con grandes volúmenes de datos.',
    instructor: 'Laura Nuñez',
    duration: '25 horas',
    modality: 'Online',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'data analysis',
    progress: 15,
    modules: [
      { id: 'm4_1', title: 'Introducción a Power BI', duration: '5 horas', content: 'Contenido sobre Power BI.' },
      { id: 'm4_2', title: 'Modelado de Datos', duration: '10 horas', content: 'Contenido sobre modelado de datos.' },
      { id: 'm4_3', title: 'Visualización Avanzada', duration: '10 horas', content: 'Contenido sobre visualización.' },
    ],
  },
];

export const costs: Cost[] = [
    { id: 'cost_1', item: 'Instructor - C. Mendoza', category: 'Instructor', amount: 2500, date: '2024-05-15' },
    { id: 'cost_2', item: 'Licencias Plataforma Zoom', category: 'Platform', amount: 500, date: '2024-05-10' },
    { id: 'cost_3', item: 'Material Impreso - Ciberseguridad', category: 'Materials', amount: 350, date: '2024-05-20' },
    { id: 'cost_4', item: 'Campaña de Email Marketing', category: 'Marketing', amount: 200, date: '2024-04-25' },
    { id: 'cost_5', item: 'Instructor - S. Acosta', category: 'Instructor', amount: 2200, date: '2024-06-01' },
    { id: 'cost_6', item: 'Suscripción Power BI Pro', category: 'Platform', amount: 400, date: '2024-06-05' },
    { id: 'cost_7', item: 'Catering evento presencial', category: 'Other', amount: 800, date: '2024-05-21' },
];

export const getCourseById = (id: string) => courses.find(c => c.id === id);
