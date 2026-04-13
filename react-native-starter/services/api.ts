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