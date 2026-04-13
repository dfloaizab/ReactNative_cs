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