export default {
  // Common
  cancel: 'Cancelar',
  save: 'Guardar',
  back: 'Volver',
  loading: 'Cargando…',
  error: 'Error',
  ok: 'Aceptar',
  yes: 'Sí',
  no: 'No',
  close: 'Cerrar',
  send: 'Enviar',
  retry: 'Reintentar',
  confirm: 'Confirmar',

  // Auth
  auth: {
    welcome: '¡Bienvenido!',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    logout: 'Cerrar sesión',
    email: 'Correo',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    resetPassword: 'Recuperar contraseña',
    noAccount: '¿No tienes cuenta?',
    haveAccount: '¿Ya tienes cuenta?',
    fullName: 'Nombre completo',
    phone: 'Teléfono',
    referralCode: 'Código de referido (opcional)',
    createAccount: 'Crear mi cuenta',
    roleClient: '🏠 Cliente',
    rolePro: '🧹 Profesional',
  },

  // Home
  home: {
    greeting_morning: 'Buenos días',
    greeting_afternoon: 'Buenas tardes',
    greeting_evening: 'Buenas noches',
    searchPlaceholder: '¿Qué necesitas limpiar hoy?',
    myTrustedPro: 'Mi Pro de Confianza',
    bookNow: 'Agendar',
    whatDoYouNeed: '¿Qué necesitas hoy?',
    topRatedPros: 'Pros mejor calificados',
    seeAll: 'Ver todos',
  },

  // Services
  services: {
    basic: 'Básica',
    deep: 'Profunda',
    move: 'Mudanza',
    office: 'Oficinas',
    custom: 'Personalizada',
  },

  // Booking
  booking: {
    title: 'Nuevo servicio',
    step1: 'Tipo',
    step2: 'Detalles',
    step3: 'Fecha',
    step4: 'Confirmar',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    budget: 'Presupuesto',
    notes: 'Notas para el pro',
    schedule: 'Fecha y hora',
    recurrence: 'Recurrencia',
    recurrence_none: 'Una vez',
    recurrence_weekly: 'Semanal',
    recurrence_biweekly: 'Quincenal',
    recurrence_monthly: 'Mensual',
    confirm: 'Confirmar servicio',
    success: '¡Servicio creado!',
    findingPros: 'Buscando pros para ti…',
  },

  // Jobs / Bookings list
  jobs: {
    myServices: 'Mis servicios',
    newService: 'Nuevo',
    status_draft: 'Borrador',
    status_open: 'Buscando pro',
    status_inProgress: 'En progreso',
    status_completed: 'Completado',
    status_cancelled: 'Cancelado',
    viewOffers: 'Ver ofertas',
    cancelService: 'Cancelar',
    trackPro: 'Ver ubicación',
    rateNow: 'Calificar',
    rated: 'Calificado',
    guarantee: 'No quedé satisfecho · Garantía 48h',
    shareTransformation: 'Compartir mi transformación ✨',
    beforeAfter: 'Ver comparativa',
    emptyTitle: 'Sin servicios aún',
    emptySub: 'Solicita tu primera limpieza y recibe ofertas en minutos',
    requestService: 'Solicitar servicio',
  },

  // Chat
  chat: {
    placeholder: 'Escribe un mensaje…',
    online: 'En línea',
    photoAttach: 'Adjuntar foto',
    photoCamera: 'Cámara',
    photoGallery: 'Galería',
    sendPhoto: 'Enviar foto',
    emptyTitle: 'Inicia la conversación',
    emptySub: 'Coordina los detalles del servicio',
  },

  // Review
  review: {
    title: '¿Cómo estuvo el servicio?',
    rateClient: 'Califica al cliente',
    placeholder: 'Cuéntanos más (opcional)',
    addPhoto: 'Agregar foto',
    submit: 'Enviar calificación',
    skip: 'Ahora no',
    thankYou: '¡Gracias por calificar!',
    sub: 'Tu opinión ayuda a mantener la calidad de LimpioGO.',
    done: 'Listo',
    labels: ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', '¡Excelente!'],
  },

  // Pro
  pro: {
    myJobs: 'Mis trabajos',
    earnings: 'Ganancias',
    photoBefore: 'Foto antes',
    photoAfter: 'Foto después',
    markDone: 'Marcar listo',
    markDoneConfirm: '¿Confirmas que terminaste el servicio?',
    getDirections: 'Cómo llegar',
    activeNow: 'Activo ahora',
    noJobs: 'Sin trabajos aún',
    noJobsSub: 'Ve a la pestaña Trabajos y postúlate a los disponibles',
    applyNow: 'Ofertar ahora',
    withdraw: 'Retirar ganancias',
    withdrawSoon: 'Próximamente · integración Wompi',
  },

  // Insurance
  insurance: {
    badge: 'Servicio asegurado',
    title: 'Seguro LimpioGO',
    sub: 'Todos los servicios están cubiertos hasta $2.000.000 COP',
    coverageTitle: '¿Qué cubre?',
    coverage: [
      'Daños accidentales a objetos del hogar',
      'Daños en pisos, paredes o muebles',
      'Pérdida de objetos de valor durante el servicio',
      'Lesiones accidentales del profesional en tu hogar',
    ],
    howTitle: '¿Cómo funciona?',
    how: 'Si ocurre un incidente durante el servicio, tienes 24h para reportarlo. LimpioGO gestiona el proceso con nuestra aseguradora.',
    reportIncident: 'Reportar incidente',
    learnMore: 'Ver condiciones completas',
  },

  // Dynamic pricing
  pricing: {
    highDemand: '🔥 Alta demanda en tu zona',
    highDemandSub: 'Los precios son mayores porque hay pocos pros disponibles ahora',
    normalDemand: 'Precio estándar',
    surgeLabel: 'Tarifa de demanda',
  },

  // SOS
  sos: {
    title: '¿Necesitas ayuda urgente?',
    confirm: 'Sí, necesito ayuda ahora',
    cancel: 'Cancelar — fue un error',
    activating: 'Activando SOS…',
    done: '🚨 SOS Activado',
    sent: 'SOS enviado',
  },

  // Settings / Profile
  settings: {
    title: 'Configuración',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    notifications: 'Notificaciones',
    location: 'Compartir ubicación',
    darkMode: 'Modo oscuro',
    changePhoto: 'Cambiar foto',
    editProfile: 'Editar perfil',
  },
};
