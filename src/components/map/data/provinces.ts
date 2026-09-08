export interface Province {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

export const sriLankaProvinces: Province[] = [
  { id: 'all', name: 'All of Sri Lanka', center: [7.8731, 80.7718], zoom: 7 },
  { id: 'western', name: 'Western Province', center: [6.9063, 80.0051], zoom: 10 },
  { id: 'southern', name: 'Southern Province', center: [6.1770, 80.3750], zoom: 10 },
  { id: 'central', name: 'Central Province', center: [7.2906, 80.6337], zoom: 10 },
  { id: 'northern', name: 'Northern Province', center: [9.3392, 80.3150], zoom: 9 },
  { id: 'eastern', name: 'Eastern Province', center: [8.0833, 81.3333], zoom: 9 },
  { id: 'north_western', name: 'North Western Province', center: [7.7126, 80.1171], zoom: 10 },
  { id: 'north_central', name: 'North Central Province', center: [8.1883, 80.4137], zoom: 9 },
  { id: 'uva', name: 'Uva Province', center: [6.9847, 81.0560], zoom: 10 },
  { id: 'sabaragamuwa', name: 'Sabaragamuwa Province', center: [6.6828, 80.3993], zoom: 10 },
];
