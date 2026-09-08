import { 
  Building2, 
  Stethoscope, 
  GraduationCap, 
  ShieldAlert, 
  Bus, 
  Train, 
  ShoppingCart, 
  Landmark, 
  Pill, 
  Fuel, 
  Briefcase 
} from 'lucide-react';

export interface CategoryConfig {
  id: string;
  name: string;
  icon: any; // Lucide Icon Component
  color: string;
  queryTags: string[]; // Overpass API tags (e.g. ['amenity=hospital', 'healthcare=hospital'])
  defaultEnabled: boolean;
}

export const POI_CATEGORIES: CategoryConfig[] = [
  {
    id: 'hospitals',
    name: 'Hospitals',
    icon: Stethoscope,
    color: '#dc2626', // Red 600
    queryTags: ['amenity=hospital', 'amenity=clinic', 'healthcare=hospital'],
    defaultEnabled: true,
  },
  {
    id: 'schools',
    name: 'Schools',
    icon: GraduationCap,
    color: '#d97706', // Amber 600
    queryTags: ['amenity=school', 'amenity=kindergarten', 'amenity=college'],
    defaultEnabled: true,
  },
  {
    id: 'police',
    name: 'Police Stations',
    icon: ShieldAlert,
    color: '#2563eb', // Blue 600
    queryTags: ['amenity=police'],
    defaultEnabled: true,
  },
  {
    id: 'bus_stops',
    name: 'Bus Stops',
    icon: Bus,
    color: '#059669', // Emerald 600
    queryTags: ['highway=bus_stop', 'amenity=bus_station'],
    defaultEnabled: true,
  },
  {
    id: 'railway',
    name: 'Railway Stations',
    icon: Train,
    color: '#0f766e', // Teal 700
    queryTags: ['railway=station', 'railway=halt'],
    defaultEnabled: false,
  },
  {
    id: 'supermarkets',
    name: 'Supermarkets',
    icon: ShoppingCart,
    color: '#7c3aed', // Violet 600
    queryTags: ['shop=supermarket', 'shop=convenience'],
    defaultEnabled: false,
  },
  {
    id: 'banks',
    name: 'Banks & ATMs',
    icon: Landmark,
    color: '#ea580c', // Orange 600
    queryTags: ['amenity=bank', 'amenity=atm'],
    defaultEnabled: false,
  },
  {
    id: 'pharmacies',
    name: 'Pharmacies',
    icon: Pill,
    color: '#db2777', // Pink 600
    queryTags: ['amenity=pharmacy'],
    defaultEnabled: false,
  },
  {
    id: 'fuel',
    name: 'Fuel Stations',
    icon: Fuel,
    color: '#475569', // Slate 600
    queryTags: ['amenity=fuel'],
    defaultEnabled: false,
  },
  {
    id: 'gov_offices',
    name: 'Gov Offices',
    icon: Briefcase,
    color: '#0284c7', // Sky 600
    queryTags: ['office=government', 'amenity=townhall'],
    defaultEnabled: false,
  },
  {
    id: 'public_services',
    name: 'Public Services',
    icon: Building2,
    color: '#334155', // Slate 700
    queryTags: ['amenity=post_office', 'amenity=library', 'amenity=fire_station'],
    defaultEnabled: false,
  }
];
