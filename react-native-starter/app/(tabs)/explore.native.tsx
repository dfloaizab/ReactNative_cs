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