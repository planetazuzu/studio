import { User, Course, Role, Cost, Department } from './types';

export const roles: Role[] = [
  'Trabajador',
  'Personal Externo',
  'Formador',
  'Gestor de RRHH',
  'Jefe de Formación',
  'Administrador General',
];

export const departments: Department[] = [
    'Técnicos de Emergencias',
    'Teleoperadores',
    'Administración',
    'Formación',
    'Logística',
];

export const announcementChannels: string[] = ['Todos', ...roles, ...departments];

// NOTE: The `currentUser` constant is removed. User state is now managed through AuthContext.

export const users: User[] = [
    {
        id: 'user_1',
        name: 'Elena Vargas',
        email: 'elena.vargas@example.com',
        password: 'password123',
        avatar: 'https://i.pravatar.cc/150?u=user1',
        role: 'Administrador General',
        department: 'Administración',
    },
    {
        id: 'user_2',
        name: 'Carlos Ruiz',
        email: 'carlos.ruiz@example.com',
        password: 'password123',
        avatar: 'https://i.pravatar.cc/150?u=user2',
        role: 'Trabajador',
        department: 'Técnicos de Emergencias',
    },
    {
        id: 'user_3',
        name: 'Ana Gómez',
        email: 'ana.gomez@example.com',
        password: 'password123',
        avatar: 'https://i.pravatar.cc/150?u=user3',
        role: 'Trabajador',
        department: 'Teleoperadores',
    },
    {
        id: 'user_4',
        name: 'Dr. Alejandro Torres',
        email: 'alejandro.torres@example.com',
        password: 'password123',
        avatar: 'https://i.pravatar.cc/150?u=user4',
        role: 'Formador',
        department: 'Formación',
    },
    {
        id: 'user_5',
        name: 'Lucía Fernández',
        email: 'lucia.fernandez@example.com',
        password: 'password123',
        avatar: 'https://i.pravatar.cc/150?u=user5',
        role: 'Jefe de Formación',
        department: 'Formación',
    },
    {
        id: 'user_6',
        name: 'Marcos Solís',
        email: 'marcos.solis@example.com',
        password: 'password123',
        avatar: 'https://i.pravatar.cc/150?u=user6',
        role: 'Gestor de RRHH',
        department: 'Administración',
    },
];

export const courses: Omit<Course, 'progress'>[] = [
  {
    id: 'course_1',
    title: 'Soporte Vital Básico (SVB) y DEA',
    description: 'Aprende técnicas de SVB y el manejo del Desfibrilador Externo Automático.',
    longDescription: 'Este curso esencial proporciona la formación necesaria para responder ante una parada cardiorrespiratoria. Incluye prácticas con maniquíes de última generación, el uso correcto del DEA, y la aplicación del protocolo PAS (Proteger, Alertar, Socorrer). Formación obligatoria y certificada para todo el personal técnico.',
    instructor: 'Dr. Alejandro Torres',
    duration: '8 horas',
    modality: 'Presencial',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'paramedic cpr',
    startDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    modules: [
        { id: 'm1_1', title: 'Cadena de Supervivencia', duration: '1 hora', content: 'Contenido sobre la cadena de supervivencia.' },
        { id: 'm1_2', title: 'Maniobras de RCP en Adultos y Niños', duration: '4 horas', content: 'Contenido sobre maniobras de RCP.' },
        { id: 'm1_3', title: 'Uso del Desfibrilador (DEA)', duration: '3 horas', content: 'Contenido sobre el uso del DEA.' },
    ],
  },
  {
    id: 'course_2',
    title: 'Conducción de Vehículos de Emergencia',
    description: 'Perfecciona tus habilidades de conducción segura y eficiente de ambulancias.',
    longDescription: 'Curso avanzado de conducción enfocado en la seguridad y la eficiencia en el transporte sanitario urgente. Se practican técnicas de conducción evasiva, uso de señales acústicas y luminosas, y mantenimiento preventivo del vehículo. Incluye sesiones en simulador y prácticas en circuito cerrado.',
    instructor: 'Javier Roca',
    duration: '20 horas',
    modality: 'Mixta',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'ambulance driving',
    startDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 16)).toISOString(),
    modules: [
      { id: 'm2_1', title: 'Normativa y Seguridad Vial', duration: '4 horas', content: 'Contenido sobre normativa.' },
      { id: 'm2_2', title: 'Técnicas de Conducción Segura', duration: '8 horas', content: 'Contenido sobre técnicas de conducción.' },
      { id: 'm2_3', title: 'Prácticas en Simulador', duration: '8 horas', content: 'Contenido sobre prácticas en simulador.' },
    ],
  },
  {
    id: 'course_3',
    title: 'Gestión de Comunicaciones en Emergencias',
    description: 'Protocolos de comunicación para teleoperadores y equipos en terreno.',
    longDescription: 'Este curso para teleoperadores y técnicos se centra en la correcta gestión de las comunicaciones. Aprenderás a utilizar los sistemas de radio, a clasificar incidentes según su prioridad (triage telefónico), a dar instrucciones pre-llegada y a coordinarte eficazmente con los equipos en el terreno. Se realizan simulacros de llamadas de emergencia.',
    instructor: 'Lucía Fernández',
    duration: '12 horas',
    modality: 'Online',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'emergency dispatcher',
    startDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    modules: [
      { id: 'm3_1', title: 'Protocolo de Comunicaciones', duration: '3 horas', content: 'Contenido sobre protocolos.' },
      { id: 'm3_2', title: 'Triage Telefónico', duration: '5 horas', content: 'Contenido sobre triage.' },
      { id: 'm3_3', title: 'Coordinación de Equipos', duration: '4 horas', content: 'Contenido sobre coordinación.' },
    ],
  },
  {
    id: 'course_4',
    title: 'Manejo de Estrés y Apoyo Psicológico',
    description: 'Herramientas para la gestión del estrés y el cuidado de la salud mental del interviniente.',
    longDescription: 'El trabajo en emergencias es altamente estresante. Este curso proporciona herramientas prácticas para el manejo del estrés agudo y crónico, técnicas de desactivación emocional post-incidente y pautas para la detección precoz de problemas de salud mental en uno mismo y en los compañeros. Impartido por psicólogos especializados en emergencias.',
    instructor: 'Dra. Isabel Soler',
    duration: '10 horas',
    modality: 'Online',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'mental health support',
    startDate: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
    modules: [
      { id: 'm4_1', title: 'Fisiología del Estrés', duration: '2 horas', content: 'Contenido sobre estrés.' },
      { id: 'm4_2', title: 'Técnicas de Afrontamiento', duration: '5 horas', content: 'Contenido sobre técnicas de afrontamiento.' },
      { id: 'm4_3', title: 'Primeros Auxilios Psicológicos', duration: '3 horas', content: 'Contenido sobre primeros auxilios psicológicos.' },
    ],
  },
];

export const costs: Cost[] = [
    { id: 'cost_1', item: 'Formador SVB - Dr. Torres', category: 'Formadores', amount: 1800, date: '2024-05-15' },
    { id: 'cost_2', item: 'Licencias Simulador Conducción', category: 'Plataforma', amount: 1200, date: '2024-05-10' },
    { id: 'cost_3', item: 'Maniquíes RCP (x5)', category: 'Equipamiento', amount: 3500, date: '2024-05-20' },
    { id: 'cost_4', item: 'Alquiler circuito prácticas', category: 'Logística', amount: 900, date: '2024-04-25' },
    { id: 'cost_5', item: 'Formador Comunicaciones - L. Fernández', category: 'Formadores', amount: 1550, date: '2024-06-01' },
    { id: 'cost_6', item: 'Suscripción Plataforma E-learning', category: 'Plataforma', amount: 400, date: '2024-06-05' },
    { id: 'cost_7', item: 'Catering curso SVB', category: 'Logística', amount: 800, date: '2024-05-21' },
];

export const getCourseById = (id: string) => initialCourses.find(c => c.id === id);
