# CampusQuest – Guía de Implementación Técnica
### React Native (Expo) + Backend Node.js + MongoDB Atlas

---

## Tabla de Contenidos

1. [Arquitectura General](#1-arquitectura-general)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Configuración del Backend (Node.js + MongoDB)](#3-configuración-del-backend-nodejs--mongodb)
   - 3.1 Inicializar el proyecto backend
   - 3.2 Estructura de carpetas del backend
   - 3.3 Conexión a MongoDB Atlas
   - 3.4 Modelos Mongoose (colecciones)
   - 3.5 Rutas y controladores de la API
   - 3.6 Servidor Express principal
   - 3.7 Probar el backend localmente
4. [Configuración del Proyecto React Native (Expo)](#4-configuración-del-proyecto-react-native-expo)
   - 4.1 Instalar dependencias necesarias
   - 4.2 Estructura de archivos final
5. [Pantalla de Bienvenida / Login](#5-pantalla-de-bienvenida--login)
   - 5.1 Módulo de servicio API
   - 5.2 Componente WelcomeScreen
   - 5.3 Integración en el layout de tabs
6. [Pantalla del Mapa del Campus (OpenStreetMap)](#6-pantalla-del-mapa-del-campus-openstreetmap)
   - 6.1 Instalar react-native-maps
   - 6.2 Componente ExploreScreen con el mapa
7. [Navegación y Layout Principal](#7-navegación-y-layout-principal)
8. [Variables de Entorno](#8-variables-de-entorno)
9. [Flujo de Datos Completo](#9-flujo-de-datos-completo)
10. [Pruebas y Depuración](#10-pruebas-y-depuración)

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Expo App)                       │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │ WelcomeScreen│   │ ExploreScreen│   │  StationScreen   │ │
│  │  (Login/PWD) │   │  (OSM Map)   │   │  (Gymkhana Q&A)  │ │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘ │
│         │                  │                     │           │
│         └──────────────────┴─────────────────────┘           │
│                            │  HTTP (fetch/axios)             │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│               BACKEND  (Node.js + Express)                   │
│                                                              │
│  POST /api/auth/login      → valida usuario                  │
│  GET  /api/locations       → lista estaciones del campus     │
│  GET  /api/questions/:locId→ pregunta de la estación         │
│  POST /api/responses       → envía respuesta del equipo      │
│  GET  /api/teams/:teamId   → progreso del equipo             │
│                                                              │
└────────────────────────────┬────────────────────────────────┘
                             │  Mongoose ODM
┌────────────────────────────▼────────────────────────────────┐
│                   MongoDB Atlas (Cloud)                       │
│  Collections: locations │ questions │ teams │ responses      │
└─────────────────────────────────────────────────────────────┘
```

**¿Por qué esta arquitectura?**  
- El **backend** centraliza la lógica de negocio (validación de geofencing, puntuación, etc.) y protege las credenciales de la base de datos.  
- El **frontend** solo hace peticiones HTTP, lo que facilita agregar más plataformas en el futuro (web, iOS, Android).

---

## 2. Prerrequisitos

Asegúrate de tener instaladas estas herramientas antes de comenzar:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 18.x LTS | `node -v` |
| npm | 9.x | `npm -v` |
| Expo CLI | 6.x | `npx expo --version` |
| MongoDB Atlas | Cuenta gratuita | [cloud.mongodb.com](https://cloud.mongodb.com) |
| Android Studio / Xcode | Cualquier reciente | Para emulador |

> **Nota:** También puedes usar la app **Expo Go** en tu celular para probar sin emulador.

---

## 3. Configuración del Backend (Node.js + MongoDB)

### 3.1 Inicializar el proyecto backend

Crea una carpeta **separada** del proyecto de React Native para el backend:

```bash
# Desde la carpeta raíz de tus proyectos
mkdir campusquest-backend
cd campusquest-backend
npm init -y
```

Instala las dependencias necesarias:

```bash
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

**¿Qué hace cada paquete?**
- `express` → Framework web para crear la API REST
- `mongoose` → ODM (Object-Document Mapper) para interactuar con MongoDB con esquemas definidos
- `dotenv` → Carga variables de entorno desde un archivo `.env` (evita exponer credenciales)
- `cors` → Permite que el cliente React Native haga peticiones al backend sin bloqueos de seguridad
- `bcryptjs` → Encripta contraseñas antes de guardarlas en la BD
- `jsonwebtoken` → Genera tokens JWT para autenticación stateless
- `nodemon` → Reinicia el servidor automáticamente al detectar cambios en los archivos (solo en desarrollo)

Agrega este script en tu `package.json`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

---

### 3.2 Estructura de carpetas del backend

Crea la siguiente estructura dentro de `campusquest-backend/`:

```
campusquest-backend/
├── src/
│   ├── config/
│   │   └── db.js            ← Conexión a MongoDB
│   ├── models/
│   │   ├── Location.js      ← Colección locations
│   │   ├── Question.js      ← Colección questions
│   │   ├── Team.js          ← Colección teams
│   │   ├── Response.js      ← Colección responses
│   │   └── User.js          ← Colección users (login)
│   ├── routes/
│   │   ├── auth.routes.js   ← POST /api/auth/login
│   │   ├── location.routes.js
│   │   ├── question.routes.js
│   │   ├── team.routes.js
│   │   └── response.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── location.controller.js
│   │   ├── question.controller.js
│   │   ├── team.controller.js
│   │   └── response.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js  ← Verifica JWT en rutas protegidas
│   └── server.js            ← Punto de entrada principal
└── .env                     ← Variables de entorno (NO subir a Git)
```

---

### 3.3 Conexión a MongoDB Atlas

**Paso 1:** Crea un cluster gratuito en [MongoDB Atlas](https://cloud.mongodb.com):
1. Regístrate / inicia sesión
2. Crea un proyecto llamado `CampusQuest`
3. Crea un cluster gratuito (M0 Free Tier)
4. En **Database Access**, crea un usuario con contraseña
5. En **Network Access**, agrega tu IP (o `0.0.0.0/0` para desarrollo)
6. Copia el **Connection String** que se parece a:
   `mongodb+srv://tu_usuario:tu_password@cluster0.xxxxx.mongodb.net/campusquest`

**Paso 2:** Crea el archivo `.env` en la raíz de `campusquest-backend/`:

```env
# .env  — NUNCA subir este archivo a Git
PORT=3000
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster0.xxxxx.mongodb.net/campusquest
JWT_SECRET=una_clave_secreta_muy_larga_y_aleatoria_aqui_123!
JWT_EXPIRES_IN=24h
```

**Paso 3:** Crea el archivo `src/config/db.js`:

```javascript
// src/config/db.js
// Este módulo se encarga exclusivamente de establecer la conexión
// con MongoDB Atlas usando Mongoose.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect() devuelve una promesa.
    // Usamos await para esperar a que la conexión sea exitosa.
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Estas opciones son recomendadas para evitar warnings de deprecación
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    // Si la conexión falla (URI incorrecta, sin internet, IP bloqueada),
    // mostramos el error y terminamos el proceso para no dejar el
    // servidor corriendo en un estado inválido.
    console.error(`❌ Error al conectar MongoDB: ${error.message}`);
    process.exit(1); // Código 1 indica salida con error
  }
};

module.exports = connectDB;
```

---

### 3.4 Modelos Mongoose (colecciones)

Cada modelo define el **esquema** (estructura) de los documentos en MongoDB y agrega validaciones.

#### `src/models/Location.js`

```javascript
// src/models/Location.js
// Corresponde a la colección `locations` del modelo de datos del gymkhana.
// Almacena cada estación del campus con su ubicación geoespacial.

const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  loc_id: {
    type: String,
    required: [true, 'El ID de ubicación es obligatorio'],
    unique: true,  // No puede haber dos estaciones con el mismo ID
    trim: true,    // Elimina espacios al inicio y al final
  },
  name: {
    type: String,
    required: [true, 'El nombre de la estación es obligatorio'],
  },
  block: {
    type: Number,
    required: true,
  },
  floor: {
    type: Number,
    default: 1,  // Si no se especifica piso, se asume planta baja
  },
  // GeoJSON Point: formato estándar para coordenadas geoespaciales en MongoDB.
  // Permite usar operadores como $near para calcular proximidad.
  location: {
    type: {
      type: String,
      enum: ['Point'],  // Solo aceptamos puntos, no líneas ni polígonos
      required: true,
    },
    coordinates: {
      type: [Number],   // [longitud, latitud] — IMPORTANTE: primero longitud en GeoJSON
      required: true,
    },
  },
}, {
  timestamps: true,  // Agrega automáticamente createdAt y updatedAt
});

// Índice 2dsphere: OBLIGATORIO para usar operadores geoespaciales de MongoDB
// como $near, $geoWithin, $geoIntersects.
LocationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Location', LocationSchema);
```

#### `src/models/Question.js`

```javascript
// src/models/Question.js
// Colección `questions`: cada pregunta está vinculada a una estación (loc_id).
// Almacena el reto, la respuesta correcta y los puntos que otorga.

const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  q_id: {
    type: String,
    required: true,
    unique: true,
  },
  // Referencia a la estación donde se ubica esta pregunta.
  // Al usar ref: 'Location', Mongoose puede hacer populate() para traer
  // todos los datos de la estación en una sola consulta.
  loc_id: {
    type: String,
    required: true,
    ref: 'Location',
  },
  text: {
    type: String,
    required: [true, 'El texto de la pregunta es obligatorio'],
  },
  // La respuesta correcta se guarda en minúsculas para facilitar
  // la comparación sin importar cómo el usuario la escriba.
  answer: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  points: {
    type: Number,
    default: 10,
    min: [1, 'Los puntos mínimos son 1'],
  },
  // Tipo de reto: 'trivia' (pregunta directa), 'activity' (actividad física/grupal)
  type: {
    type: String,
    enum: ['trivia', 'activity'],
    default: 'trivia',
  },
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
```

#### `src/models/Team.js`

```javascript
// src/models/Team.js
// Colección `teams`: gestiona cada equipo de 3 estudiantes,
// su progreso (estaciones completadas) y puntuación total.

const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  team_id: {
    type: String,
    required: true,
    unique: true,
  },
  team_name: {
    type: String,
    required: true,
    trim: true,
  },
  // Array de strings con los nombres o IDs de los miembros.
  // validate asegura que no haya más de 3 integrantes por equipo.
  members: {
    type: [String],
    validate: {
      validator: (arr) => arr.length <= 3,
      message: 'Un equipo no puede tener más de 3 integrantes',
    },
  },
  // Array de loc_id que el equipo ya ha completado correctamente.
  completed_stations: {
    type: [String],
    default: [],
  },
  total_score: {
    type: Number,
    default: 0,
    min: 0,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Team', TeamSchema);
```

#### `src/models/Response.js`

```javascript
// src/models/Response.js
// Colección `responses`: registra cada intento de respuesta de un equipo.
// Incluye el geo_stamp (ubicación GPS del equipo al momento de responder)
// para el sistema de geofencing.

const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  response_id: {
    type: String,
    required: true,
    unique: true,
  },
  team_id: {
    type: String,
    required: true,
  },
  q_id: {
    type: String,
    required: true,
  },
  // Texto literal que el equipo envió como respuesta
  submission: {
    type: String,
    required: true,
    trim: true,
  },
  // El backend determina si es correcta comparando con Question.answer
  is_correct: {
    type: Boolean,
    default: false,
  },
  // GeoJSON Point con la ubicación del equipo al enviar la respuesta.
  // Se usa para verificar que están físicamente en la estación correcta.
  geo_stamp: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],  // [longitud, latitud]
      required: true,
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

ResponseSchema.index({ geo_stamp: '2dsphere' });

module.exports = mongoose.model('Response', ResponseSchema);
```

#### `src/models/User.js`

```javascript
// src/models/User.js
// Colección `users`: maneja las credenciales de los participantes.
// Las contraseñas NUNCA se guardan en texto plano; siempre se hashean con bcrypt.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
  },
  team_id: {
    type: String,
    ref: 'Team',  // Cada usuario pertenece a un equipo
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
}, { timestamps: true });

// Hook 'pre save': se ejecuta ANTES de guardar el documento.
// Si la contraseña fue modificada (o es nueva), la hasheamos.
// El factor de costo (saltRounds) de 12 es un buen balance entre
// seguridad y rendimiento.
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Método de instancia: compara la contraseña ingresada con el hash guardado.
// bcrypt.compare() hace la comparación de forma segura.
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

---

### 3.5 Rutas y controladores de la API

#### Controlador de Autenticación: `src/controllers/auth.controller.js`

```javascript
// src/controllers/auth.controller.js
// Contiene la lógica de negocio para el login.
// Separar controladores de rutas mejora la legibilidad y testabilidad.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Response: { token, user: { username, team_id, role } }
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validación básica: ambos campos son requeridos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos',
      });
    }

    // Busca el usuario en la BD. Si no existe, devuelve 401
    // para no revelar si el usuario existe o no (seguridad)
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Compara la contraseña ingresada con el hash almacenado
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Genera el token JWT.
    // El payload contiene datos mínimos del usuario (no la contraseña).
    // El token expira según JWT_EXPIRES_IN del .env.
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        username: user.username,
        team_id: user.team_id,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { login };
```

#### Controlador de Ubicaciones: `src/controllers/location.controller.js`

```javascript
// src/controllers/location.controller.js
// Maneja las consultas de estaciones del campus.

const Location = require('../models/Location');

/**
 * GET /api/locations
 * Devuelve todas las estaciones del campus.
 * El cliente las usa para mostrar los marcadores en el mapa.
 */
const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find({});
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/locations/:locId
 * Devuelve una estación específica por su loc_id.
 */
const getLocationById = async (req, res) => {
  try {
    const location = await Location.findOne({ loc_id: req.params.locId });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Estación no encontrada' });
    }
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllLocations, getLocationById };
```

#### Controlador de Respuestas: `src/controllers/response.controller.js`

```javascript
// src/controllers/response.controller.js
// Lógica de negocio más compleja: valida geofencing, evalúa respuestas
// y actualiza la puntuación del equipo.

const Response = require('../models/Response');
const Question = require('../models/Question');
const Team = require('../models/Team');
const Location = require('../models/Location');

/**
 * POST /api/responses
 * Body: { team_id, q_id, submission, coordinates: [lng, lat] }
 *
 * Flujo:
 * 1. Busca la pregunta para obtener loc_id y la respuesta correcta
 * 2. Busca la estación para verificar geofencing (radio 50m)
 * 3. Compara la respuesta del equipo con la correcta
 * 4. Guarda la respuesta en la BD
 * 5. Si es correcta, actualiza la puntuación y progreso del equipo
 */
const submitResponse = async (req, res) => {
  try {
    const { team_id, q_id, submission, coordinates } = req.body;

    // --- PASO 1: Obtener la pregunta ---
    const question = await Question.findOne({ q_id });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
    }

    // --- PASO 2: Geofencing con operador $near de MongoDB ---
    // $near busca documentos cuyo campo 'location' esté cerca de las coordenadas dadas.
    // $maxDistance: 50 metros — el equipo debe estar físicamente en la estación.
    const nearbyLocation = await Location.findOne({
      loc_id: question.loc_id,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates },  // Posición actual del equipo
          $maxDistance: 50,  // metros
        },
      },
    });

    if (!nearbyLocation) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Debes estar en la estación para responder. Acércate más al edificio.',
      });
    }

    // --- PASO 3: Evaluar la respuesta ---
    // Comparación case-insensitive: limpiamos espacios y convertimos a minúsculas
    const normalizedSubmission = submission.trim().toLowerCase();
    const isCorrect = normalizedSubmission.includes(question.answer.toLowerCase());

    // --- PASO 4: Guardar el registro de respuesta ---
    const newResponse = await Response.create({
      response_id: `RES_${Date.now()}`,  // ID único basado en timestamp
      team_id,
      q_id,
      submission,
      is_correct: isCorrect,
      geo_stamp: { type: 'Point', coordinates },
    });

    // --- PASO 5: Si es correcta, actualizar el equipo ---
    if (isCorrect) {
      // $addToSet: agrega la estación al array solo si no está ya (evita duplicados)
      // $inc: incrementa el campo total_score en los puntos de la pregunta
      await Team.findOneAndUpdate(
        { team_id },
        {
          $addToSet: { completed_stations: question.loc_id },
          $inc: { total_score: question.points },
        },
        { new: true }  // Devuelve el documento actualizado
      );
    }

    res.status(201).json({
      success: true,
      is_correct: isCorrect,
      points_earned: isCorrect ? question.points : 0,
      message: isCorrect
        ? `✅ ¡Correcto! +${question.points} puntos`
        : '❌ Respuesta incorrecta. ¡Inténtalo de nuevo!',
      data: newResponse,
    });

  } catch (error) {
    console.error('Error en submitResponse:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitResponse };
```

#### Rutas: `src/routes/auth.routes.js`

```javascript
// src/routes/auth.routes.js
// Define los endpoints de autenticación y los conecta con los controladores.

const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');

// POST /api/auth/login
router.post('/login', login);

module.exports = router;
```

#### Rutas: `src/routes/location.routes.js`

```javascript
// src/routes/location.routes.js

const express = require('express');
const router = express.Router();
const { getAllLocations, getLocationById } = require('../controllers/location.controller');
const { protect } = require('../middleware/auth.middleware');

// protect es un middleware que verifica el JWT antes de permitir acceso
router.get('/', protect, getAllLocations);
router.get('/:locId', protect, getLocationById);

module.exports = router;
```

#### Middleware de Autenticación: `src/middleware/auth.middleware.js`

```javascript
// src/middleware/auth.middleware.js
// Middleware que verifica el JWT en el header Authorization.
// Se usa en rutas protegidas que requieren estar autenticado.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // El token viene en el header: Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extrae solo el token (sin la palabra "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verifica y decodifica el token usando el JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Adjunta los datos del usuario al request para usarlos en el controlador
      // select('-password') excluye la contraseña del resultado
      req.user = await User.findById(decoded.id).select('-password');

      next();  // Pasa al siguiente middleware o controlador
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No autorizado: token no encontrado' });
  }
};

module.exports = { protect };
```

---

### 3.6 Servidor Express principal

```javascript
// src/server.js
// Punto de entrada del backend. Configura Express, carga middlewares
// globales, registra las rutas y arranca el servidor.

// IMPORTANTE: dotenv.config() debe llamarse ANTES de cualquier otra cosa
// para que process.env esté disponible en todos los módulos.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Importar todas las rutas
const authRoutes = require('./routes/auth.routes');
const locationRoutes = require('./routes/location.routes');
// Importa las demás rutas según las vayas creando:
// const questionRoutes = require('./routes/question.routes');
// const teamRoutes = require('./routes/team.routes');
// const responseRoutes = require('./routes/response.routes');

// Conectar a MongoDB Atlas antes de iniciar el servidor
connectDB();

const app = express();

// ─── Middlewares Globales ─────────────────────────────────────────────────────

// cors(): permite que cualquier origen haga peticiones al backend.
// En producción, restringe el origen: cors({ origin: 'https://tu-dominio.com' })
app.use(cors());

// express.json(): parsea el body de las peticiones en formato JSON
// para que req.body esté disponible en los controladores.
app.use(express.json());

// Middleware de logging simple (útil para depuración en desarrollo)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Registro de Rutas ────────────────────────────────────────────────────────
// Cada grupo de rutas tiene un prefijo base. Por ejemplo:
// authRoutes maneja /api/auth/login, /api/auth/register, etc.

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
// app.use('/api/questions', questionRoutes);
// app.use('/api/teams', teamRoutes);
// app.use('/api/responses', responseRoutes);

// Ruta de salud: permite verificar que el servidor está corriendo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.url} no encontrada` });
});

// ─── Iniciar el Servidor ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
```

---

### 3.7 Probar el backend localmente

```bash
# En la carpeta campusquest-backend/
npm run dev
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✅ MongoDB conectado: cluster0.xxxxx.mongodb.net
```

Prueba con curl o Postman:

```bash
# Verificar salud del servidor
curl http://localhost:3000/api/health

# Login (después de crear un usuario en la BD)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "estudiante1", "password": "pass123"}'
```

Para insertar datos de prueba en MongoDB Atlas, usa **MongoDB Compass** o el shell de Atlas y pega los JSON de la sección 2 del documento del gymkhana.

---

## 4. Configuración del Proyecto React Native (Expo)

### 4.1 Instalar dependencias necesarias

Desde la carpeta **`react-native-starter/`** (tu proyecto Expo existente):

```bash
# Librería oficial de mapas para React Native
npx expo install react-native-maps

# Cliente HTTP más cómodo que fetch nativo
npm install axios

# Almacenamiento seguro para el JWT (no usar AsyncStorage para tokens)
npx expo install expo-secure-store

# Manejo de permisos de ubicación GPS
npx expo install expo-location

# Íconos (ya viene con Expo, pero verificar)
npm install @expo/vector-icons
```

**¿Por qué estas librerías?**
- `react-native-maps` → Integración nativa de mapas (OpenStreetMap via tile servers)
- `axios` → Interceptors, manejo de errores centralizado, mucho más limpio que fetch
- `expo-secure-store` → Guarda el JWT de forma segura usando Keychain (iOS) / Keystore (Android)
- `expo-location` → Accede al GPS del dispositivo para el geofencing

---

### 4.2 Estructura de archivos final del proyecto Expo

```
react-native-starter/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      ← Navegación de tabs (MODIFICAR)
│   │   ├── index.tsx        ← WelcomeScreen / Login (MODIFICAR)
│   │   └── explore.tsx      ← MapScreen con OSM (MODIFICAR)
│   ├── _layout.tsx          ← Layout raíz (MODIFICAR levemente)
│   └── modal.tsx
├── components/
│   └── (existentes)
├── services/                ← CREAR esta carpeta
│   ├── api.ts               ← Configuración de axios
│   ├── auth.service.ts      ← Llamadas al backend de auth
│   └── location.service.ts  ← Llamadas de estaciones
├── constants/
│   └── Colors.ts            ← Colores institucionales USC
└── .env                     ← URL del backend
```

---

## 5. Pantalla de Bienvenida / Login

### 5.1 Módulo de servicio API

Primero crea la capa de comunicación con el backend:

**`services/api.ts`**

```typescript
// services/api.ts
// Instancia centralizada de axios con configuración base.
// Todos los servicios importan esta instancia en lugar de axios directamente.

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// En desarrollo usa la IP de tu máquina en la red local, NO localhost.
// localhost en el emulador Android apunta al propio dispositivo, no a tu PC.
// Para Android Emulator: 10.0.2.2
// Para dispositivo físico: IP local de tu PC (ej: 192.168.1.100)
// Para iOS Simulator: localhost funciona
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,  // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de REQUEST: agrega el token JWT automáticamente
// a cada petición que requiera autenticación.
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('campusquest_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPONSE: manejo centralizado de errores HTTP
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado: limpiar el token guardado y redirigir al login
      SecureStore.deleteItemAsync('campusquest_token');
    }
    return Promise.reject(error);
  }
);

export default api;
```

**`services/auth.service.ts`**

```typescript
// services/auth.service.ts
// Funciones que encapsulan las llamadas HTTP relacionadas con autenticación.

import api from './api';
import * as SecureStore from 'expo-secure-store';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    username: string;
    team_id: string;
    role: string;
  };
}

/**
 * Envía credenciales al backend, guarda el token de forma segura
 * y devuelve los datos del usuario.
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  
  // Guarda el token en almacenamiento seguro del dispositivo
  await SecureStore.setItemAsync('campusquest_token', response.data.token);
  
  return response.data;
};

/**
 * Elimina el token guardado y cierra la sesión local.
 */
export const logout = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('campusquest_token');
};

/**
 * Verifica si hay una sesión activa buscando el token guardado.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await SecureStore.getItemAsync('campusquest_token');
  return !!token;
};
```

**`services/location.service.ts`**

```typescript
// services/location.service.ts
// Funciones para consultar las estaciones del campus desde el backend.

import api from './api';

export interface CampusLocation {
  loc_id: string;
  name: string;
  block: number;
  floor: number;
  location: {
    type: 'Point';
    coordinates: [number, number];  // [longitud, latitud]
  };
}

/**
 * Obtiene todas las estaciones del campus para mostrar en el mapa.
 */
export const fetchLocations = async (): Promise<CampusLocation[]> => {
  const response = await api.get<{ success: boolean; data: CampusLocation[] }>('/locations');
  return response.data.data;
};
```

---

### 5.2 Componente WelcomeScreen

Reemplaza el contenido de **`app/(tabs)/index.tsx`** con:

```tsx
// app/(tabs)/index.tsx
// Pantalla de bienvenida con logo institucional, formulario de login
// y manejo de estados de carga y error.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { login } from '../../services/auth.service';

export default function WelcomeScreen() {
  // Estados locales para los campos del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Estado de carga: deshabilita el botón mientras espera respuesta del backend
  const [isLoading, setIsLoading] = useState(false);

  // Mensaje de error para mostrar debajo del formulario
  const [error, setError] = useState('');

  /**
   * Maneja el envío del formulario de login.
   * Valida campos, llama al servicio y navega si es exitoso.
   */
  const handleLogin = async () => {
    // Validación básica del lado cliente
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setError('');       // Limpia errores previos
    setIsLoading(true); // Muestra spinner

    try {
      const result = await login({ username: username.trim(), password });
      
      // Login exitoso: navegar a la pantalla del mapa
      // replace() reemplaza el historial para que el usuario no pueda
      // volver al login con el botón de atrás
      router.replace('/(tabs)/explore');

    } catch (err: any) {
      // Muestra el mensaje de error del backend o uno genérico
      const message = err.response?.data?.message || 'Error de conexión. Verifica tu internet.';
      setError(message);
    } finally {
      setIsLoading(false); // Oculta el spinner siempre, sin importar el resultado
    }
  };

  return (
    // KeyboardAvoidingView evita que el teclado tape los campos de texto
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Sección del Logo ──────────────────────────────── */}
        <View style={styles.logoSection}>
          {/* 
            Reemplaza el source con tu logo real:
            require('../../assets/images/usc-logo.png')
            El logo oficial de la USC debe estar en la carpeta assets/images/
          */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>🎓</Text>
          </View>

          <Text style={styles.universityName}>Universidad{'\n'}Santiago de Cali</Text>
          <Text style={styles.appTitle}>CampusQuest</Text>
          <Text style={styles.appSubtitle}>Gymkhana Institucional · Citadela Pampalinda</Text>
        </View>

        {/* ── Formulario de Login ───────────────────────────── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>

          {/* Campo: Usuario */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Usuario</Text>
            <TextInput
              style={[styles.textInput, error ? styles.inputError : null]}
              placeholder="Tu usuario USC"
              placeholderTextColor="#a0a0a0"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError(''); // Limpia error al escribir
              }}
              autoCapitalize="none"     // No capitaliza automáticamente
              autoCorrect={false}        // Sin autocorrección
              keyboardType="default"
              returnKeyType="next"       // El botón Enter mueve al campo de password
            />
          </View>

          {/* Campo: Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={[styles.textInput, error ? styles.inputError : null]}
              placeholder="Tu contraseña"
              placeholderTextColor="#a0a0a0"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry={true}    // Oculta el texto (••••)
              returnKeyType="done"
              onSubmitEditing={handleLogin}  // Permite hacer login con Enter
            />
          </View>

          {/* Mensaje de error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Botón de Login */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              // Spinner blanco mientras espera respuesta del servidor
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar al Campus</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Footer ───────────────────────────────────────── */}
        <Text style={styles.footer}>
          Facultad de Ingeniería · USC · Cali, Colombia
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
// Paleta de colores basada en la identidad visual de la USC:
// Azul oscuro institucional + verde esmeralda + blanco

const USC_BLUE = '#003087';      // Azul institucional USC
const USC_GREEN = '#00843D';     // Verde corporativo USC
const USC_LIGHT_BLUE = '#E8F0FE'; // Fondo suave azulado

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: USC_BLUE,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // ── Logo Section ──
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoPlaceholderText: {
    fontSize: 48,
  },
  universityName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Form Card ──
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    // Sombra en iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Sombra en Android
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: USC_BLUE,
    marginBottom: 24,
    textAlign: 'center',
  },

  // ── Inputs ──
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#DDE3F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a2e',
    backgroundColor: USC_LIGHT_BLUE,
  },
  inputError: {
    borderColor: '#E53935',  // Rojo para indicar error
    backgroundColor: '#FFF5F5',
  },

  // ── Error Box ──
  errorBox: {
    backgroundColor: '#FFF3F3',
    borderLeftWidth: 3,
    borderLeftColor: '#E53935',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Login Button ──
  loginButton: {
    backgroundColor: USC_GREEN,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: USC_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Footer ──
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 24,
  },
});
```

---

## 6. Pantalla del Mapa del Campus (OpenStreetMap)

### 6.1 Instalar react-native-maps

```bash
# Ya lo instalaste en el paso 4.1. Verifica en package.json que esté:
# "react-native-maps": "^1.x.x"
```

Para usar **OpenStreetMap** (OSM) en lugar de Google Maps, `react-native-maps` soporta un `urlTemplate` personalizado que apunta a los tiles de OSM. Esto **no requiere API key de Google**, lo cual es ideal para proyectos universitarios.

### 6.2 Componente ExploreScreen con el mapa

Reemplaza el contenido de **`app/(tabs)/explore.tsx`** con:

```tsx
// app/(tabs)/explore.tsx
// Pantalla del mapa del campus USC con marcadores de estaciones del gymkhana.
// Usa OpenStreetMap (tiles gratuitos, sin API key) mediante react-native-maps.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import MapView, { Marker, UrlTile, Callout, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchLocations, CampusLocation } from '../../services/location.service';

// ─── Constantes del Campus USC ────────────────────────────────────────────────
// Coordenadas del centro de la Citadela Pampalinda de la USC
const USC_CENTER = {
  latitude: 3.4033961,
  longitude: -76.54964,
  latitudeDelta: 0.003,   // Zoom: cuanto menor, más cerca. 0.003 ≈ 300m de alto
  longitudeDelta: 0.003,
};

// Colores de las estaciones en el mapa
const STATION_COLORS: Record<string, string> = {
  LOC_ENG_07: '#1565C0',   // Ingeniería → azul
  LOC_LIB_03: '#6A1B9A',   // Biblioteca → morado
  LOC_LAB_04: '#2E7D32',   // Laboratorios → verde
  LOC_WEL_00: '#E65100',   // Bienestar → naranja
  LOC_REC_00: '#C62828',   // Recreación → rojo
  DEFAULT:    '#003087',   // Azul USC por defecto
};

export default function ExploreScreen() {
  // Estado de las estaciones cargadas desde el backend
  const [locations, setLocations] = useState<CampusLocation[]>([]);

  // Estado de la estación seleccionada (para el panel de info)
  const [selectedStation, setSelectedStation] = useState<CampusLocation | null>(null);

  // Estado de carga del backend
  const [isLoading, setIsLoading] = useState(true);

  // Estado de error
  const [error, setError] = useState<string>('');

  // Referencia al componente MapView para controlarlo programáticamente
  const mapRef = useRef<MapView>(null);

  // Posición GPS actual del usuario
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // ── Efectos al montar el componente ────────────────────────────────────────

  useEffect(() => {
    loadLocations();
    requestLocationPermission();
  }, []);

  /**
   * Carga las estaciones desde el backend y las guarda en el estado.
   * Si el backend no responde, muestra datos de fallback para no bloquear al usuario.
   */
  const loadLocations = async () => {
    try {
      setIsLoading(true);
      const data = await fetchLocations();
      setLocations(data);
    } catch (err) {
      console.error('Error cargando ubicaciones:', err);
      setError('No se pudieron cargar las estaciones. Usando datos locales.');
      // Datos de fallback basados en el modelo MongoDB del gymkhana
      setLocations(FALLBACK_LOCATIONS);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Solicita permiso de ubicación y obtiene la posición actual.
   * Necesario para la funcionalidad de geofencing.
   */
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de ubicación',
          'Se necesita acceso a tu ubicación para verificar que estás en cada estación.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      // Obtiene la posición actual una vez (no rastreo continuo)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      console.error('Error obteniendo ubicación:', err);
    }
  };

  /**
   * Anima el mapa para centrar y hacer zoom a una estación específica.
   */
  const focusOnStation = (loc: CampusLocation) => {
    const [longitude, latitude] = loc.location.coordinates;
    setSelectedStation(loc);

    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.001,  // Zoom muy cercano al seleccionar
      longitudeDelta: 0.001,
    }, 800);  // 800ms de animación
  };

  /**
   * Vuelve a centrar el mapa en el campus completo.
   */
  const resetCamera = () => {
    setSelectedStation(null);
    mapRef.current?.animateToRegion(USC_CENTER, 600);
  };

  // ── Renderizado ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003087" />
        <Text style={styles.loadingText}>Cargando mapa del campus...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Encabezado ──────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Mapa del Campus</Text>
        <Text style={styles.headerSubtitle}>Citadela Pampalinda · USC</Text>
      </View>

      {/* ── Aviso de error (no bloquea la pantalla) ─────── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* ── Mapa Principal ──────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}   // PROVIDER_DEFAULT usa Apple Maps en iOS / OSM en Android
        initialRegion={USC_CENTER}
        showsUserLocation={true}       // Muestra el punto azul de la posición del usuario
        showsMyLocationButton={true}
        mapType="none"                 // 'none' permite usar tiles personalizados (OSM)
        rotateEnabled={false}          // Deshabilita rotación para evitar confusión
      >
        {/*
          UrlTile: Carga los tiles de OpenStreetMap.
          Esta es la clave para usar OSM en vez de Google Maps.
          urlTemplate: URL con {z}/{x}/{y} que MapView reemplaza automáticamente.
          zIndex: -1 asegura que los marcadores queden encima de los tiles.
        */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />

        {/* ── Marcadores de Estaciones ─────────────────── */}
        {locations.map((loc) => {
          const [longitude, latitude] = loc.location.coordinates;
          const isSelected = selectedStation?.loc_id === loc.loc_id;
          const color = STATION_COLORS[loc.loc_id] || STATION_COLORS.DEFAULT;

          return (
            <Marker
              key={loc.loc_id}
              coordinate={{ latitude, longitude }}
              onPress={() => focusOnStation(loc)}
              // Escala el marcador cuando está seleccionado para feedback visual
              anchor={{ x: 0.5, y: 0.5 }}
            >
              {/* Marcador personalizado con número de bloque */}
              <View style={[
                styles.markerContainer,
                { backgroundColor: color },
                isSelected && styles.markerSelected,
              ]}>
                <Text style={styles.markerText}>B{loc.block}</Text>
              </View>

              {/* Callout: burbuja que aparece al tocar el marcador */}
              <Callout tooltip={false} onPress={() => focusOnStation(loc)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{loc.name}</Text>
                  <Text style={styles.calloutSub}>
                    Bloque {loc.block}{loc.floor > 1 ? ` · Piso ${loc.floor}` : ''}
                  </Text>
                  <Text style={styles.calloutAction}>Toca para más info →</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* ── Panel de Información de Estación Seleccionada ── */}
      {selectedStation && (
        <View style={styles.stationPanel}>
          <View style={styles.stationPanelHeader}>
            <Text style={styles.stationPanelTitle}>{selectedStation.name}</Text>
            <TouchableOpacity onPress={resetCamera} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.stationPanelDetail}>
            📍 Bloque {selectedStation.block}
            {selectedStation.floor > 1 ? ` · Piso ${selectedStation.floor}` : ''}
          </Text>
          <Text style={styles.stationPanelId}>ID: {selectedStation.loc_id}</Text>
          <TouchableOpacity style={styles.goButton}>
            <Text style={styles.goButtonText}>🎯 Ir a esta estación</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Lista de Estaciones (mini-leyenda) ─────────── */}
      {!selectedStation && (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Estaciones del Gymkhana</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc.loc_id}
                style={[
                  styles.legendItem,
                  { borderLeftColor: STATION_COLORS[loc.loc_id] || STATION_COLORS.DEFAULT }
                ]}
                onPress={() => focusOnStation(loc)}
              >
                <Text style={styles.legendItemText} numberOfLines={2}>{loc.name}</Text>
                <Text style={styles.legendItemBlock}>Bloque {loc.block}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Botón de resetear vista ─────────────────────── */}
      {selectedStation && (
        <TouchableOpacity style={styles.resetButton} onPress={resetCamera}>
          <Text style={styles.resetButtonText}>🏫 Ver Campus Completo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Datos de Fallback (si el backend no responde) ────────────────────────────
// Basados directamente en el modelo MongoDB del documento del gymkhana

const FALLBACK_LOCATIONS: CampusLocation[] = [
  {
    loc_id: 'LOC_ENG_07',
    name: 'Facultad de Ingeniería',
    block: 7,
    floor: 1,
    location: { type: 'Point', coordinates: [-76.5485, 3.4021] },
  },
  {
    loc_id: 'LOC_LIB_03',
    name: 'Biblioteca Santiago Cadena Copete',
    block: 3,
    floor: 3,
    location: { type: 'Point', coordinates: [-76.5490, 3.4025] },
  },
  {
    loc_id: 'LOC_LAB_04',
    name: 'Edificio de Laboratorios',
    block: 4,
    floor: 2,
    location: { type: 'Point', coordinates: [-76.5488, 3.4030] },
  },
  {
    loc_id: 'LOC_WEL_00',
    name: 'Edificio de Bienestar',
    block: 0,
    floor: 1,
    location: { type: 'Point', coordinates: [-76.5492, 3.4035] },
  },
  {
    loc_id: 'LOC_REC_00',
    name: 'Edificio de Juegos y Recreación',
    block: 0,
    floor: 1,
    location: { type: 'Point', coordinates: [-76.5495, 3.4028] },
  },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#555',
  },

  // ── Header ──
  header: {
    backgroundColor: '#003087',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // ── Error Banner ──
  errorBanner: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB74D',
  },
  errorBannerText: {
    color: '#E65100',
    fontSize: 12,
  },

  // ── Map ──
  map: {
    flex: 1,
  },

  // ── Markers ──
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFD700',  // Borde dorado para el seleccionado
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Callout ──
  callout: {
    width: 180,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003087',
    marginBottom: 2,
  },
  calloutSub: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  calloutAction: {
    fontSize: 11,
    color: '#00843D',
    fontWeight: '600',
  },

  // ── Station Info Panel ──
  stationPanel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  stationPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationPanelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#003087',
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  stationPanelDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  stationPanelId: {
    fontSize: 11,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  goButton: {
    backgroundColor: '#00843D',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  goButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Legend (lista horizontal) ──
  legend: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendItem: {
    backgroundColor: '#F8F9FE',
    borderRadius: 10,
    padding: 10,
    marginLeft: 16,
    width: 130,
    borderLeftWidth: 3,
  },
  legendItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    lineHeight: 16,
  },
  legendItemBlock: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },

  // ── Reset Button ──
  resetButton: {
    backgroundColor: '#003087',
    margin: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

---

## 7. Navegación y Layout Principal

Actualiza **`app/(tabs)/_layout.tsx`** para configurar los tabs:

```tsx
// app/(tabs)/_layout.tsx
// Define la navegación por pestañas de la app.
// Cada Tab.Screen corresponde a un archivo en esta carpeta.

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Ocultar los headers de cada pantalla (usamos headers personalizados)
        headerShown: false,
        // Color del tab activo
        tabBarActiveTintColor: '#003087',
        // Color del tab inactivo
        tabBarInactiveTintColor: '#AABBCC',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E6F0',
          // Altura extra en iOS para el home indicator
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Tab 1: Login / Bienvenida */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Mapa del Campus */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Mapa Campus',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## 8. Variables de Entorno

Crea el archivo **`.env`** en la raíz del proyecto Expo:

```env
# .env — Variables del cliente React Native
# En Expo, las variables públicas deben empezar con EXPO_PUBLIC_

# URL del backend:
# Emulador Android: EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
# Dispositivo físico: EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000/api
# iOS Simulator: EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

> **Importante:** Agrega `.env` a tu `.gitignore`. Las variables `EXPO_PUBLIC_*` son visibles en el bundle, así que **no pongas secretos ahí**. Solo URLs de endpoints públicos.

---

## 9. Flujo de Datos Completo

```
Usuario escribe usuario/contraseña en WelcomeScreen
         │
         ▼
auth.service.ts → POST /api/auth/login
         │
         ▼
auth.controller.js
  ├─ Busca usuario en MongoDB (User.findOne)
  ├─ Compara contraseña con bcrypt.compare()
  ├─ Genera JWT con jwt.sign()
  └─ Retorna { token, user }
         │
         ▼
expo-secure-store guarda el token en Keychain/Keystore
         │
         ▼
router.replace('/(tabs)/explore') — navega al mapa
         │
         ▼
ExploreScreen monta → useEffect → loadLocations()
         │
         ▼
location.service.ts → GET /api/locations
  (axios.interceptors agrega el JWT automáticamente al header)
         │
         ▼
location.controller.js → Location.find({})
  (MongoDB devuelve todas las estaciones con GeoJSON)
         │
         ▼
ExploreScreen renderiza MapView con UrlTile (OSM)
  + Marker por cada estación del campus
```

---

## 10. Pruebas y Depuración

### Iniciar ambos servicios

**Terminal 1 — Backend:**
```bash
cd campusquest-backend
npm run dev
# Debe mostrar:
# Servidor corriendo en http://localhost:3000
# MongoDB conectado: cluster0.xxxxx.mongodb.net
```

**Terminal 2 — Frontend (Expo):**
```bash
cd react-native-starter
npx expo start
# Escanea el QR con Expo Go, o presiona 'a' para Android / 'i' para iOS
```

### Problemas comunes y soluciones

| Problema | Causa probable | Solución |
|---|---|---|
| `Network Error` en el login | La app no encuentra el backend | Usa `10.0.2.2` (Android Emulator) o tu IP local en `.env` |
| Mapa en blanco | Los tiles de OSM tardan o hay error de CORS | Espera unos segundos; si persiste, verifica la conexión a internet |
| `Token inválido` | JWT expirado o `JWT_SECRET` cambió | Cierra sesión y vuelve a entrar |
| Geofencing siempre falla | Emulador no tiene GPS real | Configura ubicación simulada en Android Studio (Tools → Location) |
| `MongoDB connection error` | IP no está en la whitelist de Atlas | Ve a Network Access en Atlas y agrega tu IP actual |
| Marcadores no aparecen | `coordinates` en orden incorrecto | GeoJSON usa `[longitud, latitud]`, no `[latitud, longitud]` |

### Verificar el flujo completo con curl

```bash
# 1. Crear un usuario de prueba (solo si tienes una ruta de registro)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"estudiante1","password":"pass123","team_id":"TEAM_01"}'

# 2. Login y guardar el token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"estudiante1","password":"pass123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 3. Consultar ubicaciones con el token
curl http://localhost:3000/api/locations \
  -H "Authorization: Bearer $TOKEN"
```

---

> **Resumen del stack:**  
> React Native (Expo Router) ← HTTP/JWT → Express.js ← Mongoose → MongoDB Atlas  
> OpenStreetMap tiles via `react-native-maps` `UrlTile` (sin costo, sin API key de Google)

---

*Documento generado para la Sesión 2 del Bootcamp CampusQuest · USC · Abril 2026*
