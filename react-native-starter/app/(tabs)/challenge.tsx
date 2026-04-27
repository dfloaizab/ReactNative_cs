// app/challenge.tsx
// Pantalla de Reto con AR — CampusQuest USC
//
// Flujo:
//  1. Solicita permiso de cámara
//  2. Muestra CameraView de fondo (expo-camera)
//  3. Anima el visor de escaneo (overlay UI)
//  4. Al detectar el marcador fiducial → muestra GLView con Three.js (3D)
//  5. Muestra el reto del punto de interés (pregunta + respuesta)
//  6. Feedback de éxito / fallo y navegación de regreso
//
// ─── Dependencias requeridas ────────────────────────────────────────────────
//  npx expo install expo-camera expo-gl expo-three three
//  npx expo install @types/three (devDependency)
//
// ─── Detección de marcador fiducial ─────────────────────────────────────────
//  En esta implementación se usa un botón de "escaneo" manual que simula la
//  detección. Para detección real de marcadores ArUco en producción, ver la
//  sección de "Producción" en wrap-up.md (require bare workflow +
//  react-native-vision-camera con frame processor).
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { useLocalSearchParams, router, Stack } from 'expo-router';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ScanState = 'SCANNING' | 'DETECTED' | 'CHALLENGE' | 'SUCCESS' | 'FAILED';

interface Challenge {
  question: string;
  hint: string;
  answer: string; // en minúsculas para comparación
  points: number;
}

// ─── Base de retos por punto de interés ──────────────────────────────────────
// En producción esto vendría del backend (MongoDB Atlas)

const CHALLENGES_DB: Record<string, Challenge> = {
  LOC_ENG_07: {
    question:
      '¿En qué año fue fundada la Facultad de Ingeniería de la Universidad Santiago de Cali?',
    hint: 'Busca la placa conmemorativa en la entrada del bloque 7.',
    answer: '1969',
    points: 150,
  },
  LOC_LIB_03: {
    question:
      '¿Cuántos libros tiene en su colección la Biblioteca Santiago Cadena Copete?',
    hint: 'La respuesta está en el panel informativo del piso 1.',
    answer: '80000',
    points: 100,
  },
  LOC_LAB_04: {
    question:
      '¿Qué tipo de microscopio se encuentra en el Laboratorio de Biología del piso 2?',
    hint: 'El equipo está marcado con una etiqueta amarilla.',
    answer: 'electrónico',
    points: 120,
  },
  LOC_WEL_00: {
    question:
      '¿Cuántas canchas deportivas tiene el campus de la Citadela Pampalinda?',
    hint: 'Observa el plano del campus en el Edificio de Bienestar.',
    answer: '4',
    points: 80,
  },
  LOC_REC_00: {
    question:
      '¿Cuál es el deporte más practicado por los estudiantes según el censo de Bienestar USC 2024?',
    hint: 'El afiche con los resultados está en el tablero de Juegos y Recreación.',
    answer: 'fútbol',
    points: 90,
  },
  DEFAULT: {
    question:
      '¿Cuál es el lema institucional de la Universidad Santiago de Cali?',
    hint: 'Observa el escudo oficial de la universidad.',
    answer: 'scientia et labor',
    points: 50,
  },
};

// ─── Constantes visuales ──────────────────────────────────────────────────────

const USC_BLUE  = '#003087';
const USC_GREEN = '#00843D';
const USC_GOLD  = '#F5A623';
const { width: W, height: H } = Dimensions.get('window');

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ChallengeScreen() {
  // Parámetros recibidos de explore.tsx al navegar
  const params = useLocalSearchParams<{
    loc_id: string;
    name: string;
    block: string;
  }>();
  const locId   = params.loc_id  ?? 'DEFAULT';
  const locName = params.name    ?? 'Punto de interés';
  const block   = params.block   ?? '?';

  // Permisos de cámara
  const [permission, requestPermission] = useCameraPermissions();

  // Estado de la máquina de estados del reto
  const [scanState, setScanState] = useState<ScanState>('SCANNING');

  // Input de la respuesta del estudiante
  const [userAnswer, setUserAnswer] = useState('');

  // Reto activo (cargado según loc_id)
  const challenge = CHALLENGES_DB[locId] ?? CHALLENGES_DB.DEFAULT;

  // ── Animaciones ──────────────────────────────────────────────────────────────
  const scanPulse   = useRef(new Animated.Value(1)).current;      // pulso del visor
  const scanOpacity = useRef(new Animated.Value(1)).current;      // fade del visor
  const arOpacity   = useRef(new Animated.Value(0)).current;      // fade in del modelo 3D
  const challengeY  = useRef(new Animated.Value(300)).current;    // slide up del panel de reto
  const successScale = useRef(new Animated.Value(0)).current;     // pop del badge de éxito
  const cornerAnim  = useRef(new Animated.Value(0)).current;      // animación de esquinas del visor

  // ── Referencia al renderer Three.js ─────────────────────────────────────────
  const rendererRef   = useRef<Renderer | null>(null);
  const animFrameRef  = useRef<number>(0);
  const meshRef       = useRef<THREE.Mesh | null>(null);
  const glRef         = useRef<WebGLRenderingContext | null>(null);

  // ─── Efectos al montar ────────────────────────────────────────────────────────

  useEffect(() => {
    startScanAnimation();
    return () => {
      // Limpia el loop de animación al desmontar
      cancelAnimationFrame(animFrameRef.current);
      rendererRef.current?.dispose();
    };
  }, []);

  // ─── Animación del visor de escaneo (bucle pulsante) ─────────────────────────

  const startScanAnimation = useCallback(() => {
    // Pulso de escala
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(scanPulse, { toValue: 1.0,  duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Animación de esquinas del visor
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(cornerAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])
    ).start();
  }, [scanPulse, cornerAnim]);

  // ─── Lógica de detección del marcador ────────────────────────────────────────
  // En producción: reemplaza esta función con la callback del frame processor
  // de react-native-vision-camera que retorna el ID del marcador ArUco detectado.

  const handleMarkerDetected = useCallback(() => {
    if (scanState !== 'SCANNING') return;

    Vibration.vibrate(200); // feedback háptico al detectar

    // 1. Fade out del visor de escaneo
    Animated.timing(scanOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();

    // 2. Fade in del contenido 3D
    Animated.timing(arOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    setScanState('DETECTED');

    // 3. Después de 1.5 s, mostrar el panel de reto
    setTimeout(() => {
      setScanState('CHALLENGE');
      Animated.spring(challengeY, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }, 1500);
  }, [scanState, scanOpacity, arOpacity, challengeY]);

  // ─── Verificación de respuesta ────────────────────────────────────────────────

  const handleSubmitAnswer = useCallback(() => {
    const normalized = userAnswer.trim().toLowerCase();
    const correct    = challenge.answer.toLowerCase();

    if (normalized === correct) {
      setScanState('SUCCESS');
      Vibration.vibrate([0, 100, 50, 100]); // patrón de éxito
      Animated.spring(successScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
    } else {
      setScanState('FAILED');
    }
  }, [userAnswer, challenge.answer, successScale]);

  const handleRetry = useCallback(() => {
    setUserAnswer('');
    setScanState('CHALLENGE');
  }, []);

  // ─── Setup de Three.js en GLView ─────────────────────────────────────────────
  //
  // Crea una escena con:
  //  • Escudo USC (IcosahedronGeometry con material USC_BLUE)
  //  • Esfera dorada orbitante (para simular contenido AR flotante)
  //  • Luz ambiental + direccional
  //  • Loop de animación con requestAnimationFrame

  const onContextCreate = useCallback(async (gl: WebGLRenderingContext) => {
    glRef.current = gl;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0); // fondo transparente para overlay
    rendererRef.current = renderer;

    // ── Escena y cámara ───────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 3);

    // ── Luces ─────────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(USC_GOLD.replace('#', '0x') as unknown as number, 1.5, 8);
    pointLight.position.set(-2, 3, 2);
    scene.add(pointLight);

    // ── Objeto principal: "Escudo USC" (Icosaedro) ────────────────────────────
    const shieldGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const shieldMat = new THREE.MeshPhongMaterial({
      color: 0x003087,        // USC_BLUE
      emissive: 0x001a4d,
      specular: 0xffffff,
      shininess: 80,
      transparent: true,
      opacity: 0.92,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 0.2, 0);
    scene.add(shield);
    meshRef.current = shield;

    // ── Wireframe encima del escudo ───────────────────────────────────────────
    const wireGeo = new THREE.IcosahedronGeometry(0.73, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xf5a623,   // USC_GOLD
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.copy(shield.position);
    scene.add(wire);

    // ── Esfera orbitante (verde USC) ──────────────────────────────────────────
    const orbGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const orbMat = new THREE.MeshPhongMaterial({
      color: 0x00843d,   // USC_GREEN
      emissive: 0x004d20,
      specular: 0xffffff,
      shininess: 120,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    scene.add(orb);

    // ── Anillo base (plataforma AR) ───────────────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(1.1, 0.03, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf5a623,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.5;
    scene.add(ring);

    // ── Partículas flotantes ──────────────────────────────────────────────────
    const particleCount = 40;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3]     = (Math.random() - 0.5) * 4;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf5a623,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Loop de animación ─────────────────────────────────────────────────────
    let t = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      t += 0.016;

      // Rota el escudo
      shield.rotation.y += 0.012;
      shield.rotation.x = Math.sin(t * 0.5) * 0.15;
      wire.rotation.copy(shield.rotation);

      // Levitación suave
      shield.position.y = 0.2 + Math.sin(t * 1.2) * 0.08;
      wire.position.y   = shield.position.y;

      // Órbita de la esfera verde
      orb.position.x = Math.cos(t * 1.5) * 1.1;
      orb.position.z = Math.sin(t * 1.5) * 1.1;
      orb.position.y = Math.sin(t * 2) * 0.3;

      // Anillo girando
      ring.rotation.z += 0.005;

      // Partículas
      particles.rotation.y += 0.003;

      renderer.render(scene, camera);
      gl.endFrameEXP(); // requerido por expo-gl
    };
    animate();
  }, []);

  // ─── Render condicional: permisos ─────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={USC_BLUE} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Se necesita la cámara</Text>
        <Text style={styles.permissionText}>
          La pantalla de Reto AR usa la cámara para detectar los marcadores en
          cada punto del campus.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Conceder permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Volver al mapa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render principal ─────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Oculta el header nativo de Expo Router */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Cámara de fondo (siempre activa) ──────────────────────────────── */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* ── Overlay 3D con Three.js (aparece tras detectar marcador) ────────── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: arOpacity }]}
        pointerEvents="none"
      >
        <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      </Animated.View>

      {/* ── Encabezado de la pantalla ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{locName}</Text>
          <Text style={styles.headerSub}>Bloque {block} · Gymkhana USC</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>{challenge.points} pts</Text>
        </View>
      </View>

      {/* ── Visor de escaneo (estado SCANNING) ───────────────────────────── */}
      {scanState === 'SCANNING' && (
        <Animated.View
          style={[styles.scannerContainer, { opacity: scanOpacity }]}
          pointerEvents="box-none"
        >
          <Text style={styles.scannerLabel}>APUNTA AL MARCADOR AR</Text>

          {/* Marco animado del visor */}
          <Animated.View
            style={[styles.scanFrame, { transform: [{ scale: scanPulse }] }]}
          >
            {/* Esquinas del visor */}
            {['TL', 'TR', 'BL', 'BR'].map((pos) => (
              <View key={pos} style={[styles.corner, styles[`corner${pos}` as keyof typeof styles]]} />
            ))}

            {/* Línea de escaneo animada */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  top: cornerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['5%', '90%'],
                  }),
                },
              ]}
            />
          </Animated.View>

          <Text style={styles.scannerHint}>
            💡 {challenge.hint}
          </Text>

          {/*
            ──────────────────────────────────────────────────────────────────────
            BOTÓN DE ESCANEO MANUAL (demo)
            ──────────────────────────────────────────────────────────────────────
            En producción, este botón se elimina y la detección ocurre
            automáticamente via el frame processor de react-native-vision-camera.
            Ver wrap-up.md → Sección "Producción: Detección Real de Marcadores".
            ──────────────────────────────────────────────────────────────────────
          */}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleMarkerDetected}
            activeOpacity={0.8}
          >
            <Text style={styles.scanButtonText}>🎯 Simular escaneo</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Panel de reto (estado CHALLENGE) ─────────────────────────────── */}
      {(scanState === 'CHALLENGE' || scanState === 'FAILED') && (
        <Animated.View
          style={[styles.challengePanel, { transform: [{ translateY: challengeY }] }]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Indicador de marcador detectado */}
            <View style={styles.detectedBadge}>
              <Text style={styles.detectedBadgeText}>✓ Marcador detectado</Text>
            </View>

            <Text style={styles.challengeLabel}>RETO</Text>
            <Text style={styles.challengeQuestion}>{challenge.question}</Text>

            {/* Feedback de respuesta incorrecta */}
            {scanState === 'FAILED' && (
              <View style={styles.failedBanner}>
                <Text style={styles.failedText}>
                  ✗ Respuesta incorrecta. Intenta de nuevo.
                </Text>
              </View>
            )}

            {/* Input de respuesta */}
            <TextInput
              style={styles.answerInput}
              placeholder="Escribe tu respuesta…"
              placeholderTextColor="#aaa"
              value={userAnswer}
              onChangeText={setUserAnswer}
              returnKeyType="done"
              onSubmitEditing={handleSubmitAnswer}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                !userAnswer.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitAnswer}
              disabled={!userAnswer.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>Enviar respuesta</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}

      {/* ── Badge de éxito (estado SUCCESS) ──────────────────────────────── */}
      {scanState === 'SUCCESS' && (
        <View style={styles.successOverlay}>
          <Animated.View
            style={[styles.successCard, { transform: [{ scale: successScale }] }]}
          >
            <Text style={styles.successEmoji}>🏆</Text>
            <Text style={styles.successTitle}>¡Reto completado!</Text>
            <Text style={styles.successPoints}>+{challenge.points} puntos</Text>
            <Text style={styles.successLocation}>{locName}</Text>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.continueButtonText}>Volver al mapa →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Permisos ──
  permissionContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: USC_BLUE, paddingHorizontal: 32,
  },
  permissionIcon:        { fontSize: 64, marginBottom: 20 },
  permissionTitle:       { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12, textAlign: 'center' },
  permissionText:        { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permissionButton: {
    backgroundColor: USC_GREEN, borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 32, marginBottom: 16,
  },
  permissionButtonText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink:              { marginTop: 4 },
  backLinkText:          { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

  // ── Header ──
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 30,
    paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,48,135,0.82)',
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  backButtonText: { color: '#fff', fontSize: 20, lineHeight: 22 },
  headerInfo:    { flex: 1 },
  headerTitle:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  pointsBadge: {
    backgroundColor: USC_GOLD, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pointsBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // ── Scanner ──
  scannerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    paddingHorizontal: 32,
  },
  scannerLabel: {
    color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 2,
    marginBottom: 24, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanFrame: {
    width: 240, height: 240, position: 'relative',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 32,
  },
  scanLine: {
    position: 'absolute', left: '8%', right: '8%', height: 2,
    backgroundColor: USC_GREEN, opacity: 0.9,
    shadowColor: USC_GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6,
  },
  // Esquinas del visor
  corner: {
    position: 'absolute', width: 28, height: 28,
    borderColor: '#fff', borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },

  scannerHint: {
    color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center',
    lineHeight: 19, marginBottom: 24,
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  scanButton: {
    backgroundColor: USC_BLUE, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  scanButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Challenge Panel ──
  challengePanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: H * 0.62,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 12,
  },
  detectedBadge: {
    alignSelf: 'flex-start', backgroundColor: '#E8F5E9', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 16,
  },
  detectedBadgeText: { color: USC_GREEN, fontSize: 12, fontWeight: '700' },
  challengeLabel: {
    fontSize: 10, fontWeight: '800', color: '#999', letterSpacing: 2, marginBottom: 6,
  },
  challengeQuestion: {
    fontSize: 17, fontWeight: '700', color: USC_BLUE, lineHeight: 24, marginBottom: 16,
  },
  failedBanner: {
    backgroundColor: '#FFF3F3', borderLeftWidth: 3, borderLeftColor: '#E53935',
    borderRadius: 8, padding: 10, marginBottom: 12,
  },
  failedText: { color: '#C62828', fontSize: 13, fontWeight: '500' },
  answerInput: {
    borderWidth: 1.5, borderColor: '#DDE3F0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 16,
    color: '#1a1a2e', backgroundColor: '#F5F7FF', marginBottom: 14,
  },
  submitButton: {
    backgroundColor: USC_GREEN, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: USC_GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── Success ──
  successOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 50,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  successCard: {
    backgroundColor: '#fff', borderRadius: 28,
    padding: 36, alignItems: 'center', width: W * 0.82,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  successEmoji:    { fontSize: 64, marginBottom: 16 },
  successTitle:    { fontSize: 24, fontWeight: '800', color: USC_BLUE, marginBottom: 8 },
  successPoints:   { fontSize: 36, fontWeight: '900', color: USC_GREEN, marginBottom: 6 },
  successLocation: { fontSize: 14, color: '#888', marginBottom: 28, textAlign: 'center' },
  continueButton: {
    backgroundColor: USC_BLUE, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 36,
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
