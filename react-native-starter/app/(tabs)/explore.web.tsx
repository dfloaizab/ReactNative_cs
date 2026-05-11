// app/(tabs)/explore.web.tsx
// Versión web del mapa — usa un iframe de OpenStreetMap directamente.
// Se carga SOLO cuando Expo corre en navegador.
//
// CAMBIOS: las estaciones ahora navegan a /challenge?loc_id=XXX
// al presionarlas.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

const USC_LAT = 3.4033961;
const USC_LNG = -76.54964;

// BBox ligeramente expandido para ver el entorno del campus
const OSM_URL =
  `https://www.openstreetmap.org/export/embed.html` +
  `?bbox=${USC_LNG - 0.003},${USC_LAT - 0.002},${USC_LNG + 0.003},${USC_LAT + 0.002}` +
  `&layer=mapnik&marker=${USC_LAT},${USC_LNG}`;

const STATIONS = [
  { loc_id: 'LOC_ENG_07', name: 'Facultad de Ingeniería',            block: 7, color: '#1565C0', icon: '🏛️' },
  { loc_id: 'LOC_LIB_03', name: 'Biblioteca Santiago Cadena Copete', block: 3, color: '#6A1B9A', icon: '📚' },
  { loc_id: 'LOC_LAB_04', name: 'Edificio de Laboratorios',          block: 4, color: '#2E7D32', icon: '🔬' },
  { loc_id: 'LOC_WEL_00', name: 'Edificio de Bienestar',             block: 0, color: '#E65100', icon: '❤️' },
  { loc_id: 'LOC_REC_00', name: 'Juegos y Recreación',               block: 0, color: '#C62828', icon: '⚽' },
];

export default function ExploreScreenWeb() {
  const [selected, setSelected] = useState<string | null>(null);

  /**
   * Al presionar una estación: selecciónala visualmente y luego
   * navega al reto correspondiente pasando el loc_id como query param.
   */
  const handleStationPress = (loc_id: string) => {
    setSelected(loc_id);
    // Pequeño delay para que el usuario vea el feedback visual
    setTimeout(() => {
      router.push(`/challenge?loc_id=${loc_id}`);
    }, 150);
  };

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Mapa del Campus</Text>
        <Text style={styles.headerSub}>Citadela Pampalinda · USC · Cali</Text>
      </View>

      {/* ── Mapa OSM (iframe, solo web) ──────────────────────────── */}
      <View style={styles.mapWrapper}>
        {/* @ts-ignore — iframe es exclusivo de la plataforma web */}
        <iframe
          src={OSM_URL}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Mapa Campus USC"
          loading="lazy"
        />
      </View>

      {/* ── Panel de estaciones ──────────────────────────────────── */}
      <View style={styles.panel}>
        <View style={styles.panelTitleRow}>
          <Text style={styles.panelTitle}>Estaciones del Gymkhana</Text>
          <Text style={styles.panelHint}>Toca una estación para comenzar su reto →</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {STATIONS.map((s) => (
            <TouchableOpacity
              key={s.loc_id}
              style={[
                styles.stationChip,
                { borderLeftColor: s.color },
                selected === s.loc_id && styles.stationChipSelected,
              ]}
              onPress={() => handleStationPress(s.loc_id)}
              activeOpacity={0.7}
            >
              {/* Ícono + badge de bloque */}
              <View style={styles.chipTop}>
                <Text style={styles.chipIcon}>{s.icon}</Text>
                <View style={[styles.blockBadge, { backgroundColor: s.color }]}>
                  <Text style={styles.blockBadgeText}>
                    {s.block > 0 ? `B${s.block}` : '·'}
                  </Text>
                </View>
              </View>
              <Text style={styles.stationName} numberOfLines={2}>{s.name}</Text>
              {/* Indicador "Ir al reto" */}
              <Text style={[styles.goLabel, { color: s.color }]}>Ir al reto ›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#003087',
    paddingTop: 40, paddingBottom: 12, paddingHorizontal: 20,
  },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  mapWrapper:   { flex: 1 },

  panel: {
    backgroundColor: '#FFF',
    paddingTop: 14, paddingBottom: 20,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
  },
  panelTitleRow: { paddingHorizontal: 16, marginBottom: 10 },
  panelTitle: {
    fontSize: 12, fontWeight: '700', color: '#666',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  panelHint:  { fontSize: 11, color: '#999', marginTop: 2 },
  chipScroll: { paddingLeft: 12 },

  stationChip: {
    backgroundColor: '#F8F9FE', borderRadius: 12, padding: 12,
    marginRight: 10, width: 148, borderLeftWidth: 3,
  },
  stationChipSelected: {
    backgroundColor: '#EEF2FF',
    // @ts-ignore — 'transform' con scale funciona en web via RN-web
    transform: [{ scale: 1.04 }],
  },
  chipTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  chipIcon: { fontSize: 22 },
  blockBadge: {
    minWidth: 30, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  blockBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  stationName:    { fontSize: 12, fontWeight: '600', color: '#333', lineHeight: 16, marginBottom: 6 },
  goLabel:        { fontSize: 11, fontWeight: '700' },
});