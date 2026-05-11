// app/challenge.tsx
// Pantalla de reto: fuera del layout de tabs (pantalla completa).
// Flujo: Escaneo AR del QR → Pista → Quiz → Resultado
//
// Dependencia requerida: npx expo install expo-camera
//
// El QR físico en cada estación debe contener el loc_id exacto,
// p.ej: "LOC_ENG_07". Cuando la cámara lo detecta, avanza a la pista.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// expo-camera v14+ — instalar con: npx expo install expo-camera
import { CameraView, useCameraPermissions } from 'expo-camera';

import { CHALLENGES } from '../data/challenges';

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Phase = 'scanning' | 'hint' | 'quiz' | 'result';

const USC_BLUE  = '#003087';
const USC_GREEN = '#00843D';
const USE_NATIVE_DRIVER = Platform.OS !== 'web'; // Animated: driver nativo no disponible en web

// ── Componente principal ──────────────────────────────────────────────────────
export default function ChallengeScreen() {
  // loc_id viene del query param: /challenge?loc_id=LOC_ENG_07
  const params = useLocalSearchParams<{ loc_id: string }>();
  const locId  = Array.isArray(params.loc_id) ? params.loc_id[0] : params.loc_id;
  const challenge = locId ? CHALLENGES[locId] : null;

  // ── Estado de la pantalla ─────────────────────────────────────────
  const [phase,          setPhase]          = useState<Phase>('scanning');
  const [permission, requestPermission]     = useCameraPermissions();
  const [alreadyScanned, setAlreadyScanned] = useState(false);
  const [currentQ,       setCurrentQ]       = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered,       setAnswered]       = useState(false);
  const [score,          setScore]          = useState(0);

  // ── Animaciones ───────────────────────────────────────────────────
  const scanLineAnim = useRef(new Animated.Value(0)).current;   // línea de escaneo
  const slideUpAnim  = useRef(new Animated.Value(300)).current; // tarjeta entra desde abajo
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  // Anima la línea de escaneo en loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Anima la entrada de la tarjeta cuando cambia la fase
  useEffect(() => {
    if (phase === 'hint' || phase === 'quiz' || phase === 'result') {
      slideUpAnim.setValue(320);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideUpAnim, {
          toValue: 0,
          tension: 55,
          friction: 9,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    }
  }, [phase]);

  // ── Handlers ──────────────────────────────────────────────────────
  /** Llamado cuando expo-camera detecta un código QR */
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (alreadyScanned || phase !== 'scanning') return;
    // El QR debe contener el loc_id exacto de la estación
    if (data === locId) {
      setAlreadyScanned(true);
      setPhase('hint');
    }
  };

  /** Simula el escaneo para demo o cuando no hay cámara disponible */
  const handleDemoScan = () => {
    if (phase !== 'scanning') return;
    setAlreadyScanned(true);
    setPhase('hint');
  };

  /** Selección de respuesta en el quiz */
  const handleAnswerSelect = (answerId: string) => {
    if (answered || !challenge) return;
    setSelectedAnswer(answerId);
    setAnswered(true);
    const answer = challenge.questions[currentQ].answers.find((a) => a.id === answerId);
    if (answer?.isCorrect) setScore((s) => s + 1);
  };

  /** Avanza a la siguiente pregunta o al resultado */
  const handleNext = () => {
    if (!challenge) return;
    const nextQ = currentQ + 1;
    if (nextQ >= challenge.questions.length) {
      setPhase('result');
    } else {
      setCurrentQ(nextQ);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  // ── Guardia: estación no encontrada ──────────────────────────────
  if (!challenge) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.6)" />
        <Text style={styles.errorTitle}>Estación no encontrada</Text>
        <Text style={styles.errorSub}>loc_id: {locId ?? 'sin parámetro'}</Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => router.back()}>
          <Text style={styles.errorBackText}>← Volver al mapa</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  FASE 1: ESCANEO AR
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'scanning') {
    const scanLineY = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 200],
    });
    const cameraReady = permission?.granted ?? false;

    return (
      <View style={styles.scanRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Fondo: cámara real o degradado simulado */}
        {cameraReady ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fakeCamera]} />
        )}

        {/* Overlay oscuro con la UI de AR */}
        <View style={styles.scanOverlay}>

          {/* ── Barra superior ── */}
          <View style={styles.scanTopBar}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.arLiveBadge}>
              <View style={styles.arLiveDot} />
              <Text style={styles.arLiveText}>AR LIVE</Text>
            </View>
            <View style={styles.circleBtn} />
          </View>

          {/* ── Nombre de la estación ── */}
          <View style={styles.stationTag}>
            <Text style={styles.stationTagIcon}>{challenge.block > 0 ? `B${challenge.block}` : '★'}</Text>
            <Text style={styles.stationTagName}>{challenge.title}</Text>
          </View>

          {/* ── Marco de escaneo animado ── */}
          <View style={styles.scanFrameArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {/* Línea que barre de arriba a abajo */}
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
              />
            </View>
            <Text style={styles.scanInstruction}>
              Apunta la cámara al código QR{'\n'}pegado en la estación
            </Text>
          </View>

          {/* ── Acciones inferiores ── */}
          <View style={styles.scanActions}>
            {/* Pedir permiso si no está concedido */}
            {!cameraReady && (
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                <Ionicons name="camera-outline" size={16} color={USC_BLUE} />
                <Text style={styles.permissionText}>Activar cámara</Text>
              </TouchableOpacity>
            )}
            {/* Botón de demo — siempre visible */}
            <TouchableOpacity style={styles.demoScanBtn} onPress={handleDemoScan}>
              <Ionicons name="flash-outline" size={15} color="#FFF" />
              <Text style={styles.demoScanText}>Simular escaneo (demo)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  FASE 2: PISTA AR
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'hint') {
    return (
      <View style={styles.hintRoot}>
        {/* Fondo oscuro con textura de "AR" */}
        <View style={styles.hintBg} />
        {/* Rejilla decorativa para efecto AR */}
        <View style={styles.hintGrid} pointerEvents="none" />

        {/* Cabecera */}
        <SafeAreaView style={styles.hintTopBar}>
          <TouchableOpacity style={styles.circleBtnDark} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.arHintBadge}>
            <Text style={styles.arHintBadgeText}>🔍 PISTA AR</Text>
          </View>
          <View style={styles.circleBtnDark} />
        </SafeAreaView>

        {/* Tarjeta de pista que sube desde abajo */}
        <Animated.View
          style={[
            styles.hintCard,
            { transform: [{ translateY: slideUpAnim }], opacity: fadeAnim },
          ]}
        >
          <Text style={styles.hintStationName}>{challenge.title}</Text>

          <View style={styles.hintDivider} />

          {/* Ícono decorativo de AR */}
          <View style={styles.hintIconRow}>
            <View style={styles.hintIconCircle}>
              <Text style={styles.hintIconText}>💡</Text>
            </View>
            <Text style={styles.hintLabel}>Tu pista para el reto</Text>
          </View>

          <Text style={styles.hintBody}>{challenge.arHint}</Text>

          <TouchableOpacity
            style={styles.hintContinueBtn}
            onPress={() => setPhase('quiz')}
            activeOpacity={0.85}
          >
            <Text style={styles.hintContinueBtnText}>¡Entendido! Ir al reto →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  FASE 3: QUIZ
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'quiz') {
    const question   = challenge.questions[currentQ];
    const totalQ     = challenge.questions.length;
    const isLastQ    = currentQ + 1 >= totalQ;
    const correctAnswer = question.answers.find((a) => a.id === selectedAnswer);

    return (
      <SafeAreaView style={styles.quizRoot}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

        <ScrollView
          contentContainerStyle={styles.quizScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.quizTopBar}>
            <TouchableOpacity style={styles.circleBtnLight} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={USC_BLUE} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>
              Pregunta {currentQ + 1} / {totalQ}
            </Text>
            <View style={styles.quizScoreBadge}>
              <Text style={styles.quizScoreText}>⭐ {score}</Text>
            </View>
          </View>

          {/* Chip de la estación */}
          <View style={[styles.quizChip, { backgroundColor: challenge.color + '18' }]}>
            <Text style={[styles.quizChipText, { color: challenge.color }]}>
              {challenge.title}
            </Text>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQ) / totalQ) * 100}%` as any, backgroundColor: challenge.color },
              ]}
            />
          </View>

          {/* Tarjeta de pregunta */}
          <Animated.View
            style={[
              styles.questionCard,
              { transform: [{ translateY: slideUpAnim }], opacity: fadeAnim },
            ]}
          >
            <Text style={styles.questionText}>{question.text}</Text>
          </Animated.View>

          {/* Opciones de respuesta */}
          {question.answers.map((answer) => {
            const isSelected = selectedAnswer === answer.id;
            const showResult = answered;

            let chipStyle   = styles.answerChip;
            let letterBg    = styles.answerLetterBg;
            let textColor   = styles.answerText;

            if (showResult && answer.isCorrect) {
              chipStyle  = { ...styles.answerChip, ...styles.answerChipCorrect };
              letterBg   = { ...styles.answerLetterBg, ...styles.answerLetterCorrect };
              textColor  = { ...styles.answerText, ...styles.answerTextLight };
            } else if (showResult && isSelected && !answer.isCorrect) {
              chipStyle  = { ...styles.answerChip, ...styles.answerChipWrong };
              letterBg   = { ...styles.answerLetterBg, ...styles.answerLetterWrong };
              textColor  = { ...styles.answerText, ...styles.answerTextLight };
            } else if (!showResult && isSelected) {
              chipStyle  = { ...styles.answerChip, ...styles.answerChipSelected };
            }

            return (
              <TouchableOpacity
                key={answer.id}
                style={chipStyle}
                onPress={() => handleAnswerSelect(answer.id)}
                disabled={answered}
                activeOpacity={0.75}
              >
                <View style={letterBg}>
                  <Text style={styles.answerLetterText}>{answer.id.toUpperCase()}</Text>
                </View>
                <Text style={[styles.answerText, textColor]} numberOfLines={3}>
                  {answer.text}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Explicación después de responder */}
          {answered && correctAnswer && (
            <Animated.View
              style={[
                styles.explanation,
                correctAnswer.isCorrect ? styles.explanationCorrect : styles.explanationWrong,
                { opacity: fadeAnim },
              ]}
            >
              <Text style={styles.explanationTitle}>
                {correctAnswer.isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto'}
              </Text>
              <Text style={styles.explanationBody}>{correctAnswer.explanation}</Text>
            </Animated.View>
          )}

          {/* Botón siguiente */}
          {answered && (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>
                {isLastQ ? 'Ver mi resultado →' : 'Siguiente pregunta →'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  FASE 4: RESULTADO
  // ═══════════════════════════════════════════════════════════════════
  const total = challenge.questions.length;
  const pct   = Math.round((score / total) * 100);
  const resultData = pct >= 80
    ? { emoji: '🏆', title: '¡Excelente!',        bg: USC_GREEN }
    : pct >= 50
    ? { emoji: '👍', title: '¡Bien hecho!',        bg: '#0288D1' }
    : { emoji: '📚', title: '¡Sigue practicando!', bg: '#E65100' };

  return (
    <SafeAreaView style={[styles.resultRoot, { backgroundColor: resultData.bg }]}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[styles.resultContent, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        <Text style={styles.resultEmoji}>{resultData.emoji}</Text>
        <Text style={styles.resultTitle}>{resultData.title}</Text>
        <Text style={styles.resultStation}>{challenge.title}</Text>

        {/* Círculo de puntaje */}
        <View style={styles.resultScoreCircle}>
          <Text style={styles.resultScoreNum}>{score}/{total}</Text>
          <Text style={styles.resultScorePct}>{pct}%</Text>
        </View>

        <Text style={styles.resultMessage}>
          {pct >= 80
            ? '¡Dominas este reto! Sigue explorando el campus.'
            : pct >= 50
            ? 'Buen intento. Revisa los temas para mejorar.'
            : 'No te rindas. Lee la pista de nuevo y vuelve a intentarlo.'}
        </Text>

        <TouchableOpacity
          style={styles.resultMapBtn}
          onPress={() => router.replace('/(tabs)/explore')}
          activeOpacity={0.85}
        >
          <Text style={styles.resultMapBtnText}>🗺️ Volver al mapa</Text>
        </TouchableOpacity>

        {/* Opción de reintentar */}
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setCurrentQ(0);
            setScore(0);
            setSelectedAnswer(null);
            setAnswered(false);
            setAlreadyScanned(false);
            setPhase('scanning');
          }}
        >
          <Text style={styles.retryBtnText}>↺ Reintentar este reto</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');

const styles = StyleSheet.create({

  // ── Error ──
  errorContainer: {
    flex: 1, backgroundColor: USC_BLUE,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  errorTitle:   { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 12, textAlign: 'center' },
  errorSub:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  errorBackBtn: {
    marginTop: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
  },
  errorBackText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // ── Scan ──
  scanRoot:    { flex: 1, backgroundColor: '#000' },
  fakeCamera:  {
    // Degradado simulado cuando no hay cámara
    backgroundColor: '#0d0d2b',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingHorizontal: 20,
  },
  scanTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  arLiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(200,0,0,0.85)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  arLiveDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF5252' },
  arLiveText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  stationTag: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,48,135,0.75)',
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
  },
  stationTagIcon: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  stationTagName: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  scanFrameArea: { alignItems: 'center' },
  scanFrame: {
    width: 218, height: 218,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32, height: 32,
    borderColor: '#00E5FF', borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    left: 4, right: 4, height: 2,
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 5,
  },
  scanInstruction: {
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center', fontSize: 14, lineHeight: 22,
  },

  scanActions: { alignItems: 'center', gap: 12 },
  permissionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
  },
  permissionText: { color: USC_BLUE, fontWeight: '700', fontSize: 14 },
  demoScanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20,
  },
  demoScanText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  // ── Hint ──
  hintRoot: { flex: 1, justifyContent: 'flex-end' },
  hintBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#080820' },
  hintGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    // decorativo — en producción puedes poner una imagen de rejilla
  },
  hintTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 28,
    paddingHorizontal: 20,
  },
  circleBtnDark: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  arHintBadge: {
    backgroundColor: 'rgba(0,229,255,0.15)',
    borderWidth: 1, borderColor: '#00E5FF',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14,
  },
  arHintBadgeText: { color: '#00E5FF', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },

  hintCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 24,
  },
  hintStationName: { fontSize: 21, fontWeight: '800', color: USC_BLUE, marginBottom: 14 },
  hintDivider:     { height: 1, backgroundColor: '#E8EDF5', marginBottom: 16 },
  hintIconRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  hintIconCircle:  {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#E8F5FC', justifyContent: 'center', alignItems: 'center',
  },
  hintIconText:    { fontSize: 20 },
  hintLabel:       { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  hintBody: {
    fontSize: 16, color: '#2a2a3e', lineHeight: 27,
    marginBottom: 28,
  },
  hintContinueBtn: {
    backgroundColor: USC_BLUE, borderRadius: 16,
    height: 54, justifyContent: 'center', alignItems: 'center',
  },
  hintContinueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // ── Quiz ──
  quizRoot:  { flex: 1, backgroundColor: '#F5F7FA' },
  quizScroll: { padding: 20, paddingTop: 12 },
  quizTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
    paddingTop: Platform.OS === 'android' ? 16 : 4,
  },
  circleBtnLight: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center', alignItems: 'center',
  },
  quizProgress:   { fontSize: 14, fontWeight: '600', color: '#555' },
  quizScoreBadge: {
    backgroundColor: USC_BLUE,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  quizScoreText:  { color: '#FFF', fontWeight: '700', fontSize: 13 },

  quizChip: {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 10,
  },
  quizChipText: { fontSize: 12, fontWeight: '700' },

  progressBar: {
    height: 4, backgroundColor: '#E0E6F0', borderRadius: 2,
    marginBottom: 16, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  questionCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  questionText: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', lineHeight: 27 },

  answerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    marginBottom: 9, borderWidth: 1.5, borderColor: '#E0E6F0',
  },
  answerChipSelected: { borderColor: USC_BLUE, backgroundColor: '#EEF2FF' },
  answerChipCorrect:  { borderColor: USC_GREEN, backgroundColor: USC_GREEN },
  answerChipWrong:    { borderColor: '#E53935', backgroundColor: '#E53935' },
  answerLetterBg: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  answerLetterCorrect: { backgroundColor: 'rgba(255,255,255,0.3)' },
  answerLetterWrong:   { backgroundColor: 'rgba(255,255,255,0.3)' },
  answerLetterText: { fontSize: 12, fontWeight: '800', color: USC_BLUE },
  answerText:      { flex: 1, fontSize: 14, fontWeight: '500', color: '#333', lineHeight: 20 },
  answerTextLight: { color: '#FFF' },

  explanation: {
    borderRadius: 14, padding: 14,
    marginTop: 6, marginBottom: 10,
  },
  explanationCorrect: {
    backgroundColor: '#E8F5E9', borderLeftWidth: 4, borderLeftColor: USC_GREEN,
  },
  explanationWrong: {
    backgroundColor: '#FFEBEE', borderLeftWidth: 4, borderLeftColor: '#E53935',
  },
  explanationTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 5 },
  explanationBody:  { fontSize: 13, color: '#444', lineHeight: 20 },

  nextBtn: {
    backgroundColor: USC_BLUE, borderRadius: 16,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // ── Result ──
  resultRoot:    { flex: 1 },
  resultContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 36,
  },
  resultEmoji:   { fontSize: 76, marginBottom: 12 },
  resultTitle:   { fontSize: 30, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 6 },
  resultStation: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 30, textAlign: 'center' },
  resultScoreCircle: {
    width: 148, height: 148, borderRadius: 74,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  resultScoreNum: { fontSize: 36, fontWeight: '900', color: '#FFF' },
  resultScorePct: { fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  resultMessage:  {
    fontSize: 15, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', lineHeight: 23, marginBottom: 36,
    maxWidth: SW * 0.8,
  },
  resultMapBtn: {
    backgroundColor: '#FFF', borderRadius: 18,
    paddingHorizontal: 36, paddingVertical: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  resultMapBtnText: { color: USC_BLUE, fontSize: 17, fontWeight: '800' },
  retryBtn: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 18, paddingHorizontal: 28, paddingVertical: 12,
  },
  retryBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
});