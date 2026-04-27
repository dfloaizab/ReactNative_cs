# CampusQuest USC — Wrap-up de Desarrollo
## Pantallas `explore` → `challenge` con AR en React Native / Expo

> **Stack:** React Native · Expo SDK 51+ · Expo Router v3 · Three.js · expo-gl  
> **Plataformas:** Android 12+ · iOS 15+  
> **Contexto:** Gymkhana institucional — Universidad Santiago de Cali, Citadela Pampalinda

---

## 1. Arquitectura general

```
CampusQuest/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Login (USC_BLUE / USC_GREEN palette)
│   │   ├── explore.tsx        # Fallback → re-exporta explore.web
│   │   ├── explore.native.tsx # Mapa nativo (react-native-maps + OSM)
│   │   └── explore.web.tsx    # Mapa web (iframe OSM)
│   └── challenge.tsx          # ← NUEVA: Reto AR (expo-camera + Three.js)
├── services/
│   ├── auth.service.ts        # Login JWT contra backend Node/Express
│   └── location.service.ts   # fetchLocations() desde MongoDB Atlas
└── assets/
    └── markers/               # Imágenes de marcadores ArUco para imprimir
        ├── LOC_ENG_07.png
        ├── LOC_LIB_03.png
        └── ...
```

---

## 2. Librerías necesarias — instalación

```bash
# Ya incluidas en Expo SDK (no requieren instalación extra):
#   expo-camera, expo-location, expo-router

# Nuevas dependencias para la pantalla challenge:
npx expo install expo-gl expo-three three
npx expo install expo-three          # bridge expo-gl ↔ three.js

# Tipos TypeScript (devDependency):
npm install --save-dev @types/three

# Si usas Expo Go (managed workflow) — estas ya funcionan:
#   expo-camera      → CameraView, useCameraPermissions
#   expo-gl          → GLView (WebGL en RN)
#   expo-three       → Renderer adaptado para expo-gl
#   three            → escena 3D (geometrías, materiales, luces)
```

> **Nota:** `expo-three` requiere `three` >= 0.170.0. Verifica compatibilidad
> con `npx expo-three doctor` si hay conflictos.

---

## 3. Navegación: explore → challenge

La navegación usa **Expo Router v3** con file-based routing.

### 3.1 Llamada desde explore (nativo)

```tsx
// app/(tabs)/explore.native.tsx
import { router } from 'expo-router';

const handleGoToChallenge = (station: CampusLocation) => {
  router.push({
    pathname: '/challenge',   // resuelve a app/challenge.tsx
    params: {
      loc_id: station.loc_id,
      name:   station.name,
      block:  String(station.block),
    },
  });
};
```

### 3.2 Recepción en challenge

```tsx
// app/challenge.tsx
import { useLocalSearchParams } from 'expo-router';

const params = useLocalSearchParams<{
  loc_id: string;
  name: string;
  block: string;
}>();
```

### 3.3 Regreso al mapa

```tsx
router.back();   // vuelve a explore manteniendo el estado del mapa
```

---

## 4. Flujo de la pantalla Challenge

```
[explore] → tap "🎯 Ir al Reto AR"
      │
      ▼
[challenge] — Estado: SCANNING
  • CameraView activa (fondo)
  • Visor animado (esquinas + línea de escaneo)
  • Pista del reto visible
  • Botón "Simular escaneo" (demo) / Frame Processor (producción)
      │
      ▼ (marcador detectado)
[challenge] — Estado: DETECTED
  • Vibración háptica (200 ms)
  • Fade out del visor
  • Fade in del GLView (Three.js)
  • Modelo 3D: Icosaedro USC azul + esfera verde orbitante + partículas
      │
      │ (tras 1.5 s)
      ▼
[challenge] — Estado: CHALLENGE
  • Panel slide-up con la pregunta del reto
  • Input de respuesta
  • Botón "Enviar respuesta"
      │
      ├── Correcto → Estado: SUCCESS → badge +puntos → router.back()
      └── Incorrecto → Estado: FAILED → mensaje → retry
```

---

## 5. Implementación AR: detección de marcadores fiduciales

### 5.1 Contexto del marcador fiducial

Un **marcador fiducial** es una imagen 2D impresa con un patrón único reconocible
por visión computacional. En este proyecto se usan marcadores **ArUco** (estándar
OpenCV), uno diferente por punto de interés.

```
Marcador ArUco id=7 (Facultad de Ingeniería):
┌─────────────────┐
│ ■ ■ ■ ■ ■ ■ ■  │  ← borde negro
│ ■ □ ■ □ □ ■ ■  │
│ ■ ■ □ ■ □ □ ■  │  ← patrón binario único
│ ■ □ □ ■ ■ □ ■  │
│ ■ ■ ■ ■ ■ ■ ■  │
└─────────────────┘
     id = 7
```

Generación de marcadores: https://chev.me/arucogen/

### 5.2 Detección en Expo Go (managed workflow) — demo actual

El flujo actual usa un botón manual que simula la detección. Esto es suficiente
para demostrar el flujo completo sin salir del managed workflow de Expo.

```tsx
// challenge.tsx — detección simulada (demo)
const handleMarkerDetected = useCallback(() => {
  Vibration.vibrate(200);
  // ... transiciones de estado
}, []);
```

### 5.3 Producción: Detección Real con Vision Camera

Para detectar marcadores ArUco en tiempo real, se requiere el **bare workflow**
(o Expo prebuild):

```bash
npx expo prebuild --clean       # genera carpetas android/ y ios/
npx expo install react-native-vision-camera
npm install vision-camera-plugin-frame-processor-aruco
```

```tsx
// Implementación de producción (bare workflow)
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { detectAruco } from 'vision-camera-plugin-frame-processor-aruco';
import { runOnJS } from 'react-native-reanimated';

const device = useCameraDevice('back');

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const markers = detectAruco(frame, { dictionary: 'ARUCO_MIP_36h12' });
  if (markers.length > 0) {
    runOnJS(handleMarkerDetected)(markers[0].id);
  }
}, [handleMarkerDetected]);
```

### 5.4 Alternativa sin bare workflow: AR.js en WebView

Si prefieres permanecer en managed workflow con detección real:

```tsx
import { WebView } from 'react-native-webview';

const AR_HTML = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
  <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"></script>
</head>
<body style="margin:0;overflow:hidden;">
  <a-scene embedded arjs>
    <a-marker preset="hiro" id="hiro-marker">
      <a-box position="0 0.5 0" material="color: #003087;"></a-box>
    </a-marker>
    <a-entity camera></a-entity>
  </a-scene>
  <script>
    document.querySelector('#hiro-marker').addEventListener('markerFound', () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'markerFound', id: 'hiro' }));
    });
  </script>
</body>
</html>`;

// En la pantalla:
<WebView
  source={{ html: AR_HTML }}
  onMessage={(e) => {
    const data = JSON.parse(e.nativeEvent.data);
    if (data.event === 'markerFound') handleMarkerDetected();
  }}
/>
```

> ⚠️ La WebView necesita permisos de cámara en el manifest de Android
> (`android.permission.CAMERA`) y en el Info.plist de iOS.

---

## 6. Escena 3D con Three.js + expo-gl

### Elementos de la escena (`challenge.tsx → onContextCreate`)

| Elemento | Geometría | Material | Propósito |
|---|---|---|---|
| Escudo USC | `IcosahedronGeometry(0.7)` | `MeshPhongMaterial` azul USC | Objeto AR principal |
| Wireframe | `IcosahedronGeometry(0.73)` | `MeshBasicMaterial` dorado | Efecto tech/AR |
| Esfera orbitante | `SphereGeometry(0.12)` | `MeshPhongMaterial` verde | Dinámico / llamativo |
| Anillo base | `TorusGeometry(1.1, 0.03)` | `MeshBasicMaterial` dorado | Plataforma AR visual |
| Partículas | `BufferGeometry` (40 pts) | `PointsMaterial` | Atmósfera |

### Transparencia del overlay

```tsx
// El GLView se posiciona encima de la cámara con fondo transparente
renderer.setClearColor(0x000000, 0); // alpha = 0 → transparente

// Animación fade-in al detectar el marcador
Animated.timing(arOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
```

### Loop de animación (patrón expo-gl obligatorio)

```tsx
const animate = () => {
  animFrameRef.current = requestAnimationFrame(animate);
  // ... transformaciones
  renderer.render(scene, camera);
  gl.endFrameEXP(); // ← REQUERIDO: flush del frame en expo-gl
};
```

---

## 7. Base de datos de retos (CHALLENGES_DB)

Actualmente está hardcoded en `challenge.tsx` para simplicidad. En producción
debe venir del backend MongoDB:

```typescript
// services/challenge.service.ts
export interface Challenge {
  loc_id: string;
  question: string;
  hint: string;
  answer: string;
  points: number;
}

export const fetchChallenge = async (locId: string): Promise<Challenge> => {
  const response = await fetch(`${API_URL}/challenges/${locId}`);
  return response.json();
};
```

Modelo MongoDB sugerido:

```json
{
  "_id": "ObjectId(...)",
  "loc_id": "LOC_ENG_07",
  "question": "¿En qué año fue fundada la Facultad de Ingeniería?",
  "hint": "Busca la placa en la entrada del bloque 7.",
  "answer": "1969",
  "points": 150,
  "marker_id": 7,
  "marker_dictionary": "ARUCO_MIP_36h12",
  "created_at": "ISODate(...)"
}
```

---

## 8. Consideraciones de UX y accesibilidad

- **Háptica:** `Vibration.vibrate()` confirma la detección sin depender del audio.
- **Feedback visual dual:** badge "✓ Marcador detectado" + transición 3D.
- **Error recovery:** si la respuesta es incorrecta, el estado pasa a `FAILED`
  manteniendo el modelo 3D visible y permitiendo reintentar sin volver a escanear.
- **KeyboardAvoidingView:** el panel de reto se adapta al teclado en iOS y Android.
- **Permisos progresivos:** la solicitud de cámara ocurre solo cuando el usuario
  navega a la pantalla de reto, no al iniciar la app.

---

## 9. Testing rápido en Expo Go

1. `npx expo start`
2. Escanear QR con **Expo Go**
3. Login → mapa → tap en cualquier marcador → "Ir al Reto AR"
4. Conceder permiso de cámara
5. Tap "Simular escaneo" → aparece modelo 3D
6. Responder el reto
7. Verificar badge de éxito y navegación de regreso

---

## 10. Próximos pasos

- [ ] Integrar `vision-camera-plugin-frame-processor-aruco` (bare workflow)
- [ ] Imprimir marcadores ArUco y ubicarlos físicamente en el campus
- [ ] Conectar `fetchChallenge()` al backend Express + MongoDB Atlas
- [ ] Sistema de puntuación persistente (colección `scores` en MongoDB)
- [ ] Leaderboard en tiempo real (WebSocket o polling)
- [ ] Soporte offline con `expo-sqlite` para caché de retos
- [ ] Modelos `.glb` / `.gltf` reales en lugar de geometría procedural (usar `expo-asset` + cargador GLTF de Three.js)

---

*Generado para el Semillero de Investigación USC — CampusQuest Gymkhana 2026*
