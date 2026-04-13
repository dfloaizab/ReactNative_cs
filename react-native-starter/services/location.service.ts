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