// data/challenges.ts
// Datos locales de los retos de la Gymkhana.
// En producción, estos se descargarían desde la BD por loc_id.

export interface Answer {
  id: 'a' | 'b' | 'c' | 'd';
  text: string;
  explanation: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
}

export interface Challenge {
  loc_id: string;
  title: string;
  block: number;
  color: string;
  /** Texto de la pista que se revela via AR al escanear el QR */
  arHint: string;
  /**
   * El contenido del QR físico en la estación debe ser el loc_id.
   * Ej: QR en Facultad de Ingeniería → "LOC_ENG_07"
   */
  qrValue: string;
  questions: Question[];
}

export const CHALLENGES: Record<string, Challenge> = {
  LOC_ENG_07: {
    loc_id: 'LOC_ENG_07',
    title: 'Facultad de Ingeniería',
    block: 7,
    color: '#1565C0',
    qrValue: 'LOC_ENG_07',
    arHint:
      'Estás en el corazón tecnológico de la USC. ' +
      'Este bloque lleva décadas formando ingenieros que transforman el Valle del Cauca. ' +
      'Busca la placa fundacional en la entrada principal y responde: ' +
      '¿qué reforma cambió para siempre la estructura de poder en esta universidad?',
    questions: [
      {
        id: 'ENG_Q1',
        text: '¿Qué cambio importante en la gobernanza universitaria ocurrió como resultado de la movilización estudiantil de noviembre de 1968?',
        answers: [
          {
            id: 'a',
            text: 'Centralización administrativa',
            explanation:
              'Las reformas de 1968 se alejaron precisamente de la representación restringida, avanzando hacia un modelo más participativo y descentralizado.',
            isCorrect: false,
          },
          {
            id: 'b',
            text: 'Fusión con el Ministerio de Justicia',
            explanation:
              'Si bien el Ministerio de Justicia otorgó personería jurídica, los eventos de 1968 fueron reformas estructurales internas, no una fusión con el Ministerio.',
            isCorrect: false,
          },
          {
            id: 'c',
            text: 'Cogobierno universitario',
            explanation:
              '¡Correcto! El movimiento llevó a la Reforma de Estatutos, otorgando representación a docentes, estudiantes y egresados en el Consejo Superior.',
            isCorrect: true,
          },
          {
            id: 'd',
            text: 'Nacionalización de la universidad',
            explanation:
              'La institución sigue siendo una corporación civil privada sin ánimo de lucro a pesar de su modelo democrático de gobernanza.',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'ENG_Q2',
        text: '¿En qué ciudad colombiana está ubicada la Ciudadela Pampalinda de la USC?',
        answers: [
          { id: 'a', text: 'Bogotá', explanation: 'La sede principal está en Cali, no en Bogotá.', isCorrect: false },
          { id: 'b', text: 'Medellín', explanation: 'La sede principal está en Cali, no en Medellín.', isCorrect: false },
          { id: 'c', text: 'Cali', explanation: '¡Correcto! La Ciudadela Pampalinda está ubicada en Santiago de Cali, Valle del Cauca.', isCorrect: true },
          { id: 'd', text: 'Bucaramanga', explanation: 'La sede principal está en Cali, no en Bucaramanga.', isCorrect: false },
        ],
      },
    ],
  },

  LOC_LIB_03: {
    loc_id: 'LOC_LIB_03',
    title: 'Biblioteca Santiago Cadena Copete',
    block: 3,
    color: '#6A1B9A',
    qrValue: 'LOC_LIB_03',
    arHint:
      'Este espacio guarda el conocimiento de generaciones de profesionales. ' +
      'La biblioteca lleva el nombre de un rector que dedicó su vida a la institución. ' +
      'Observa las estanterías: ¿cuántas facultades están representadas en sus colecciones?',
    questions: [
      {
        id: 'LIB_Q1',
        text: '¿En qué año fue fundada la Universidad Santiago de Cali?',
        answers: [
          { id: 'a', text: '1945', explanation: 'La USC fue fundada en 1958, no en 1945.', isCorrect: false },
          { id: 'b', text: '1958', explanation: '¡Correcto! La USC fue fundada el 1° de noviembre de 1958.', isCorrect: true },
          { id: 'c', text: '1968', explanation: '1968 fue el año de la reforma estatutaria, no de la fundación.', isCorrect: false },
          { id: 'd', text: '1975', explanation: 'La USC fue fundada en 1958, no en 1975.', isCorrect: false },
        ],
      },
      {
        id: 'LIB_Q2',
        text: '¿Cuál es el modelo de institución de la Universidad Santiago de Cali?',
        answers: [
          { id: 'a', text: 'Universidad pública del Estado', explanation: 'La USC es privada y sin ánimo de lucro, no es pública.', isCorrect: false },
          { id: 'b', text: 'Corporación civil privada sin ánimo de lucro', explanation: '¡Correcto! La USC es una corporación civil de carácter privado y sin ánimo de lucro.', isCorrect: true },
          { id: 'c', text: 'Entidad del Ministerio de Educación', explanation: 'La USC es una institución privada, no depende del Ministerio de Educación.', isCorrect: false },
          { id: 'd', text: 'Fundación con ánimo de lucro', explanation: 'La USC no tiene ánimo de lucro. Es una corporación civil privada.', isCorrect: false },
        ],
      },
    ],
  },

  LOC_LAB_04: {
    loc_id: 'LOC_LAB_04',
    title: 'Edificio de Laboratorios',
    block: 4,
    color: '#2E7D32',
    qrValue: 'LOC_LAB_04',
    arHint:
      'Aquí la teoría se convierte en práctica. Los laboratorios de la USC son el puente ' +
      'entre el aula y el mundo real. Fíjate en los equipos: cada uno representa una ' +
      'competencia que los futuros profesionales desarrollan en estas instalaciones.',
    questions: [
      {
        id: 'LAB_Q1',
        text: '¿Cuál es el principal propósito de los laboratorios en la educación de ingeniería?',
        answers: [
          { id: 'a', text: 'Solo almacenar equipos costosos', explanation: 'Los laboratorios están diseñados para el aprendizaje activo, no solo para guardar equipos.', isCorrect: false },
          { id: 'b', text: 'Aprobar materias sin teoría', explanation: 'Los laboratorios complementan la teoría; no la reemplazan.', isCorrect: false },
          { id: 'c', text: 'Aplicar conocimientos teóricos en contextos reales', explanation: '¡Correcto! Los laboratorios permiten validar y aplicar la teoría en entornos controlados que simulan la realidad profesional.', isCorrect: true },
          { id: 'd', text: 'Socializar entre estudiantes', explanation: 'Si bien el trabajo en equipo ocurre en labs, su propósito central es la aplicación práctica del conocimiento.', isCorrect: false },
        ],
      },
    ],
  },

  LOC_WEL_00: {
    loc_id: 'LOC_WEL_00',
    title: 'Edificio de Bienestar',
    block: 0,
    color: '#E65100',
    qrValue: 'LOC_WEL_00',
    arHint:
      'Bienestar Universitario es el corazón que late por los estudiantes. ' +
      'Aquí se gestionan los servicios que van más allá del aula: ' +
      'salud, deporte, cultura y apoyo emocional. ¿Sabías que también puedes solicitar becas desde aquí?',
    questions: [
      {
        id: 'WEL_Q1',
        text: '¿Cuál de estos servicios ofrece típicamente el área de Bienestar Universitario de la USC?',
        answers: [
          { id: 'a', text: 'Asesoría psicológica gratuita', explanation: '¡Correcto! Bienestar ofrece atención psicológica, entre muchos otros servicios de apoyo estudiantil.', isCorrect: true },
          { id: 'b', text: 'Servicios de notaría pública', explanation: 'Los servicios notariales no forman parte de Bienestar Universitario.', isCorrect: false },
          { id: 'c', text: 'Matrícula de vehículos', explanation: 'La matrícula vehicular es un servicio estatal, no universitario.', isCorrect: false },
          { id: 'd', text: 'Registro catastral de predios', explanation: 'El registro catastral es competencia del IGAC, no de Bienestar Universitario.', isCorrect: false },
        ],
      },
    ],
  },

  LOC_REC_00: {
    loc_id: 'LOC_REC_00',
    title: 'Juegos y Recreación',
    block: 0,
    color: '#C62828',
    qrValue: 'LOC_REC_00',
    arHint:
      'El deporte y la recreación no son opcionales: son parte esencial de la formación integral. ' +
      'Desde aquí se gestan los equipos deportivos que representan a la USC. ' +
      'Cuenta cuántas canchas puedes ver: cada una tiene su historia de campeones.',
    questions: [
      {
        id: 'REC_Q1',
        text: '¿Qué beneficio académico tiene la práctica deportiva regular según múltiples estudios universitarios?',
        answers: [
          { id: 'a', text: 'Reduce la capacidad de memorización', explanation: 'El ejercicio aeróbico tiene el efecto contrario: mejora la memoria y la neuroplasticidad.', isCorrect: false },
          { id: 'b', text: 'Mejora el rendimiento académico', explanation: '¡Correcto! Estudios demuestran que el ejercicio regular mejora la concentración, la memoria y el rendimiento académico en general.', isCorrect: true },
          { id: 'c', text: 'No tiene relación con el desempeño académico', explanation: 'Sí existe una correlación positiva y documentada entre actividad física y rendimiento académico.', isCorrect: false },
          { id: 'd', text: 'Disminuye el tiempo de concentración', explanation: 'El ejercicio mejora la concentración y reduce el estrés; no la disminuye.', isCorrect: false },
        ],
      },
    ],
  },
};