// app/(tabs)/explore.web.tsx
// Versión web del mapa — usa un iframe de OpenStreetMap directamente.
// Se carga SOLO cuando Expo corre en navegador.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const USC_LAT = 3.4033961;
const USC_LNG = -76.54964;
const ZOOM = 17;

// URL de OpenStreetMap con las coordenadas del campus USC
const OSM_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${USC_LNG - 0.003},${USC_LAT - 0.002},${USC_LNG + 0.003},${USC_LAT + 0.002}&layer=mapnik&marker=${USC_LAT},${USC_LNG}`;

const STATIONS = [
  { loc_id: 'LOC_ENG_07', name: 'Facultad de Ingeniería',            block: 7, color: '#1565C0' },
  { loc_id: 'LOC_LIB_03', name: 'Biblioteca Santiago Cadena Copete', block: 3, color: '#6A1B9A' },
  { loc_id: 'LOC_LAB_04', name: 'Edificio de Laboratorios',          block: 4, color: '#2E7D32' },
  { loc_id: 'LOC_WEL_00', name: 'Edificio de Bienestar',             block: 0, color: '#E65100' },
  { loc_id: 'LOC_REC_00', name: 'Juegos y Recreación',               block: 0, color: '#C62828' },
];

export default function ExploreScreenWeb() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Mapa del Campus</Text>
        <Text style={styles.headerSub}>Citadela Pampalinda · USC · Cali</Text>
      </View>

      {/* Iframe OSM — solo funciona en web */}
      <View style={styles.mapWrapper}>
        <iframe
          src={OSM_URL}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 0,
          }}
          title="Mapa Campus USC"
          loading="lazy"
        />
      </View>

      {/* Lista de estaciones */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Estaciones del Gymkhana</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATIONS.map((s) => (
            <TouchableOpacity
              key={s.loc_id}
              style={[
                styles.stationChip,
                { borderLeftColor: s.color },
                selected === s.loc_id && styles.stationChipSelected,
              ]}
              onPress={() => setSelected(s.loc_id === selected ? null : s.loc_id)}
            >
              <View style={[styles.blockBadge, { backgroundColor: s.color }]}>
                <Text style={styles.blockBadgeText}>B{s.block}</Text>
              </View>
              <Text style={styles.stationName} numberOfLines={2}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F7FA' },
  header:      { backgroundColor: '#003087', paddingTop: 40, paddingBottom: 12, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  mapWrapper:  { flex: 1 },
  panel:       { backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 0,
                 borderTopLeftRadius: 16, borderTopRightRadius: 16,
                 shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
                 shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 },
  panelTitle:  { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase',
                 letterSpacing: 0.5, paddingHorizontal: 16, marginBottom: 10 },
  stationChip: { backgroundColor: '#F8F9FE', borderRadius: 10, padding: 10,
                 marginLeft: 12, width: 140, borderLeftWidth: 3 },
  stationChipSelected: { backgroundColor: '#EEF2FF', transform: [{ scale: 1.03 }] },
  blockBadge:  { width: 32, height: 32, borderRadius: 16, justifyContent: 'center',
                 alignItems: 'center', marginBottom: 6 },
  blockBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  stationName: { fontSize: 12, fontWeight: '600', color: '#333', lineHeight: 16 },
});