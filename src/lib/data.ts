// PROPIX Mock Data — Sri Lankan Real Estate Platform

export type PropertyStatus = "approved" | "pending" | "rejected" | "draft" | "published";
export type PropertyCategory = "house" | "apartment" | "land" | "commercial" | "villa" | "agricultural";
export type ListingType = "sale" | "rent";

export interface Property {
  id: string;
  title: string;
  category: PropertyCategory;
  listingType: ListingType;
  price: number;
  priceLabel: string;
  location: string;
  district: string;
  province: string;
  address: string;
  beds: number;
  baths: number;
  landSize: number;   // perches
  buildingSize: number; // sqft
  parking: number;
  description: string;
  features: string[];
  images: string[];
  status: PropertyStatus;
  verified: boolean;
  featured: boolean;
  sellerId: string;
  agentId?: string;
  createdAt: string;
  views: number;
  inquiries: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller" | "agent" | "admin";
  phone: string;
  avatar?: string;
  joinedAt: string;
}

export interface ValuationRequest {
  id: string;
  propertyAddress: string;
  district: string;
  type: "digital" | "professional";
  status: "pending" | "completed" | "scheduled";
  requestedBy: string;
  requestedAt: string;
  estimatedValue?: number;
  scheduledDate?: string;
}

export interface ConsultationRequest {
  id: string;
  propertyTitle: string;
  consultationType: "buying" | "selling" | "investment" | "general";
  status: "requested" | "assigned" | "scheduled" | "completed";
  requestedBy: string;
  assignedAgent?: string;
  scheduledDate?: string;
  requestedAt: string;
}

export interface FinancingRequest {
  id: string;
  applicantName: string;
  employmentStatus: string;
  monthlyIncome: number;
  requestedLoan: number;
  propertyValue: number;
  status: "submitted" | "under_review" | "referred" | "approved" | "rejected";
  submittedAt: string;
}

// ─── Properties ───────────────────────────────────────────────
export const PROPERTIES: Property[] = [
  {
    id: "prop-001",
    title: "Luxury 4-Bedroom House in Colombo 7",
    category: "house",
    listingType: "sale",
    price: 75000000,
    priceLabel: "LKR 75,000,000",
    location: "Colombo 7, Colombo",
    district: "Colombo",
    province: "Western",
    address: "12/A, Horton Place, Colombo 07",
    beds: 4, baths: 3, landSize: 20, buildingSize: 3200, parking: 2,
    description: "An exceptional family home nestled in the heart of Colombo 7. This meticulously maintained property features spacious living areas, a modern kitchen, and a beautifully landscaped garden. Ideal for families seeking luxury and convenience in one of Colombo's most prestigious addresses.",
    features: ["Swimming Pool", "Garden", "Security 24/7", "Air Conditioning", "Modern Kitchen", "Solar Panels"],
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    ],
    status: "approved", verified: true, featured: true,
    sellerId: "user-seller-01", agentId: "user-agent-01",
    createdAt: "2025-01-15", views: 1240, inquiries: 18,
  },
  {
    id: "prop-002",
    title: "Modern 3-Bedroom Apartment in Rajagiriya",
    category: "apartment",
    listingType: "sale",
    price: 32000000,
    priceLabel: "LKR 32,000,000",
    location: "Rajagiriya, Gampaha",
    district: "Gampaha",
    province: "Western",
    address: "Apt 5B, Sunrise Towers, Rajagiriya",
    beds: 3, baths: 2, landSize: 0, buildingSize: 1450, parking: 1,
    description: "A stunning modern apartment in the sought-after Rajagiriya area. Features high-end finishes, panoramic city views, and access to world-class amenities. Walking distance to supermarkets, schools, and public transport.",
    features: ["Gym", "Security 24/7", "Parking", "Elevator", "CCTV", "Balcony"],
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    status: "approved", verified: true, featured: true,
    sellerId: "user-seller-01", agentId: "user-agent-02",
    createdAt: "2025-01-20", views: 890, inquiries: 12,
  },
  {
    id: "prop-003",
    title: "Prime Commercial Land in Kandy City",
    category: "land",
    listingType: "sale",
    price: 18500000,
    priceLabel: "LKR 18,500,000",
    location: "Kandy City, Kandy",
    district: "Kandy",
    province: "Central",
    address: "Peradeniya Road, Kandy",
    beds: 0, baths: 0, landSize: 40, buildingSize: 0, parking: 0,
    description: "A rare opportunity to acquire a prime land parcel in the heart of Kandy city. Suitable for commercial development, residential construction, or investment. All utilities available at boundary.",
    features: ["Corner Plot", "All Utilities", "Road Frontage", "Level Ground"],
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    ],
    status: "approved", verified: true, featured: false,
    sellerId: "user-seller-02",
    createdAt: "2025-02-01", views: 340, inquiries: 6,
  },
  {
    id: "prop-004",
    title: "Beachfront Villa in Galle Fort Area",
    category: "villa",
    listingType: "sale",
    price: 145000000,
    priceLabel: "LKR 145,000,000",
    location: "Galle Fort, Galle",
    district: "Galle",
    province: "Southern",
    address: "Church Street, Galle Fort",
    beds: 5, baths: 4, landSize: 30, buildingSize: 4800, parking: 3,
    description: "An extraordinary colonial-era villa within the historic Galle Fort. Lovingly restored with modern amenities while preserving its heritage charm. Features a private pool, ocean views, and 5 ensuite bedrooms. Perfect for luxury living or high-end tourism.",
    features: ["Swimming Pool", "Ocean View", "Heritage Building", "Garden", "Security", "Air Conditioning"],
    images: [
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    ],
    status: "approved", verified: true, featured: true,
    sellerId: "user-seller-02", agentId: "user-agent-01",
    createdAt: "2025-01-10", views: 2100, inquiries: 31,
  },
  {
    id: "prop-005",
    title: "2-Bedroom Apartment for Rent — Dehiwela",
    category: "apartment",
    listingType: "rent",
    price: 65000,
    priceLabel: "LKR 65,000 / month",
    location: "Dehiwela, Colombo",
    district: "Colombo",
    province: "Western",
    address: "45/C, Mount Lavinia Road, Dehiwela",
    beds: 2, baths: 1, landSize: 0, buildingSize: 900, parking: 1,
    description: "A well-maintained 2-bedroom apartment available for long-term rental. Close to Dehiwela junction, supermarkets, and schools. Fully tiled with fitted kitchen and bathroom.",
    features: ["Parking", "CCTV", "Water Backup", "Balcony"],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
    ],
    status: "approved", verified: true, featured: false,
    sellerId: "user-seller-01",
    createdAt: "2025-02-10", views: 560, inquiries: 22,
  },
  {
    id: "prop-006",
    title: "3-Bedroom House in Kurunegala",
    category: "house",
    listingType: "sale",
    price: 22000000,
    priceLabel: "LKR 22,000,000",
    location: "Kurunegala Town, Kurunegala",
    district: "Kurunegala",
    province: "North Western",
    address: "56, Colombo Road, Kurunegala",
    beds: 3, baths: 2, landSize: 15, buildingSize: 2000, parking: 1,
    description: "A solid family home on the outskirts of Kurunegala town. Spacious living areas, a large garden, and close to schools and the town center. An excellent investment in a rapidly growing region.",
    features: ["Garden", "Parking", "Security", "Air Conditioning"],
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    ],
    status: "approved", verified: false, featured: false,
    sellerId: "user-seller-02",
    createdAt: "2025-02-15", views: 280, inquiries: 4,
  },
  {
    id: "prop-007",
    title: "Agricultural Land — Kalutara District",
    category: "agricultural",
    listingType: "sale",
    price: 8500000,
    priceLabel: "LKR 8,500,000",
    location: "Beruwala, Kalutara",
    district: "Kalutara",
    province: "Western",
    address: "Beruwala Road, Kalutara",
    beds: 0, baths: 0, landSize: 120, buildingSize: 0, parking: 0,
    description: "120-perch agricultural land with access road, close to the Beruwala town. Suitable for coconut/cinnamon cultivation or mixed development. Clean title deed available.",
    features: ["Access Road", "Water Source", "Clean Title", "Agricultural"],
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    ],
    status: "approved", verified: true, featured: false,
    sellerId: "user-seller-02",
    createdAt: "2025-02-20", views: 190, inquiries: 3,
  },
  {
    id: "prop-008",
    title: "Commercial Building — Gampaha Town",
    category: "commercial",
    listingType: "rent",
    price: 180000,
    priceLabel: "LKR 180,000 / month",
    location: "Gampaha Town, Gampaha",
    district: "Gampaha",
    province: "Western",
    address: "Main Street, Gampaha",
    beds: 0, baths: 2, landSize: 10, buildingSize: 3500, parking: 5,
    description: "Ground floor commercial space in a prime Gampaha town location. Suitable for a showroom, bank, restaurant, or office. High foot traffic with excellent visibility.",
    features: ["Parking", "CCTV", "Generator", "Elevator", "Security"],
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    ],
    status: "approved", verified: true, featured: true,
    sellerId: "user-seller-01", agentId: "user-agent-02",
    createdAt: "2025-01-28", views: 450, inquiries: 9,
  },
  {
    id: "prop-009",
    title: "5-Bedroom Luxury Villa — Colombo 3",
    category: "villa",
    listingType: "sale",
    price: 210000000,
    priceLabel: "LKR 210,000,000",
    location: "Colombo 3, Colombo",
    district: "Colombo",
    province: "Western",
    address: "Alfred Place, Colombo 03",
    beds: 5, baths: 5, landSize: 25, buildingSize: 6000, parking: 4,
    description: "Ultra-luxury residence in the prestigious Colombo 3 neighborhood. Featuring a private pool, home cinema, smart home automation, and a rooftop terrace with panoramic city views. The epitome of Sri Lankan luxury living.",
    features: ["Swimming Pool", "Home Cinema", "Smart Home", "Rooftop Terrace", "Security 24/7", "Generator", "Solar Panels"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
    ],
    status: "pending", verified: false, featured: false,
    sellerId: "user-seller-01",
    createdAt: "2025-03-01", views: 0, inquiries: 0,
  },
  {
    id: "prop-010",
    title: "1-Bedroom Studio — Mount Lavinia",
    category: "apartment",
    listingType: "rent",
    price: 38000,
    priceLabel: "LKR 38,000 / month",
    location: "Mount Lavinia, Colombo",
    district: "Colombo",
    province: "Western",
    address: "Hotel Road, Mount Lavinia",
    beds: 1, baths: 1, landSize: 0, buildingSize: 550, parking: 1,
    description: "A cozy studio apartment steps from the beach in Mount Lavinia. Fully furnished with air conditioning and modern kitchen. Perfect for a single professional or couple.",
    features: ["Furnished", "Air Conditioning", "Beach Access", "Security"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    ],
    status: "approved", verified: true, featured: false,
    sellerId: "user-seller-02",
    createdAt: "2025-02-25", views: 710, inquiries: 28,
  },
  {
    id: "prop-011",
    title: "Residential Land — Kottawa Junction",
    category: "land",
    listingType: "sale",
    price: 14000000,
    priceLabel: "LKR 14,000,000",
    location: "Kottawa, Colombo",
    district: "Colombo",
    province: "Western",
    address: "Highlevel Road, Kottawa",
    beds: 0, baths: 0, landSize: 16, buildingSize: 0, parking: 0,
    description: "16-perch residential land with easy access to Highlevel Road. Suitable for a single family home or duplex. Close to Kottawa town, schools, and bus routes.",
    features: ["Road Frontage", "All Utilities", "Flat Land"],
    images: [
      "https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&q=80",
    ],
    status: "rejected", verified: false, featured: false,
    sellerId: "user-seller-02",
    createdAt: "2025-01-05", views: 120, inquiries: 2,
  },
  {
    id: "prop-012",
    title: "Luxury Penthouse — Colombo 5",
    category: "apartment",
    listingType: "sale",
    price: 95000000,
    priceLabel: "LKR 95,000,000",
    location: "Colombo 5, Colombo",
    district: "Colombo",
    province: "Western",
    address: "Jawatte Road, Colombo 05",
    beds: 4, baths: 4, landSize: 0, buildingSize: 4200, parking: 2,
    description: "An exclusive penthouse atop one of Colombo 5's premier residential towers. Features a wraparound terrace, private plunge pool, and unobstructed views of the Indian Ocean and city skyline.",
    features: ["Private Pool", "Terrace", "Ocean View", "Smart Home", "Concierge", "Gym"],
    images: [
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80",
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80",
    ],
    status: "approved", verified: true, featured: true,
    sellerId: "user-seller-01", agentId: "user-agent-01",
    createdAt: "2025-01-18", views: 1890, inquiries: 24,
  },
];

// ─── Users ────────────────────────────────────────────────────
export const USERS: User[] = [
  { id: "user-seller-01", name: "Priya Wickramasinghe", email: "priya@example.com", role: "seller", phone: "+94 77 123 4567", joinedAt: "2024-06-01" },
  { id: "user-seller-02", name: "Roshan Perera", email: "roshan@example.com", role: "seller", phone: "+94 71 234 5678", joinedAt: "2024-08-15" },
  { id: "user-buyer-01", name: "Amali Fernando", email: "amali@example.com", role: "buyer", phone: "+94 76 345 6789", joinedAt: "2024-10-01" },
  { id: "user-buyer-02", name: "Kasun Jayasuriya", email: "kasun@example.com", role: "buyer", phone: "+94 70 456 7890", joinedAt: "2025-01-05" },
  { id: "user-admin-01", name: "Admin PROPIX", email: "admin@propix.lk", role: "admin", phone: "+94 11 234 5678", joinedAt: "2024-01-01" },
  { id: "user-agent-01", name: "Dinesh Rajapaksa", email: "dinesh@propix.lk", role: "agent", phone: "+94 77 567 8901", joinedAt: "2024-03-01" },
  { id: "user-agent-02", name: "Sachini Mendis", email: "sachini@propix.lk", role: "agent", phone: "+94 75 678 9012", joinedAt: "2024-04-15" },
];

// ─── Valuations ───────────────────────────────────────────────
export const VALUATION_REQUESTS: ValuationRequest[] = [
  { id: "val-001", propertyAddress: "45 Horton Place, Colombo 7", district: "Colombo", type: "professional", status: "scheduled", requestedBy: "user-buyer-01", requestedAt: "2025-02-10", estimatedValue: 78000000, scheduledDate: "2025-03-05" },
  { id: "val-002", propertyAddress: "Peradeniya Road, Kandy", district: "Kandy", type: "digital", status: "completed", requestedBy: "user-buyer-02", requestedAt: "2025-01-28", estimatedValue: 19200000 },
  { id: "val-003", propertyAddress: "Colombo Road, Kurunegala", district: "Kurunegala", type: "professional", status: "pending", requestedBy: "user-seller-02", requestedAt: "2025-02-20" },
];

// ─── Consultations ────────────────────────────────────────────
export const CONSULTATION_REQUESTS: ConsultationRequest[] = [
  { id: "con-001", propertyTitle: "Luxury 4-Bedroom House in Colombo 7", consultationType: "buying", status: "scheduled", requestedBy: "user-buyer-01", assignedAgent: "user-agent-01", scheduledDate: "2025-03-08", requestedAt: "2025-02-15" },
  { id: "con-002", propertyTitle: "Prime Commercial Land in Kandy", consultationType: "investment", status: "assigned", requestedBy: "user-buyer-02", assignedAgent: "user-agent-02", requestedAt: "2025-02-18" },
  { id: "con-003", propertyTitle: "General Consultation", consultationType: "general", status: "requested", requestedBy: "user-buyer-01", requestedAt: "2025-02-22" },
];

// ─── Financing ────────────────────────────────────────────────
export const FINANCING_REQUESTS: FinancingRequest[] = [
  { id: "fin-001", applicantName: "Amali Fernando", employmentStatus: "employed", monthlyIncome: 180000, requestedLoan: 25000000, propertyValue: 32000000, status: "referred", submittedAt: "2025-02-12" },
  { id: "fin-002", applicantName: "Kasun Jayasuriya", employmentStatus: "self_employed", monthlyIncome: 250000, requestedLoan: 60000000, propertyValue: 75000000, status: "under_review", submittedAt: "2025-02-19" },
];

// ─── Helpers ──────────────────────────────────────────────────
export function formatLKR(amount: number): string {
  if (amount >= 1000000) return `LKR ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `LKR ${(amount / 1000).toFixed(0)}K`;
  return `LKR ${amount.toLocaleString()}`;
}

export function getPropertyById(id: string): Property | undefined {
  return PROPERTIES.find((p) => p.id === id);
}

export function getApprovedProperties(): Property[] {
  return PROPERTIES.filter((p) => p.status === "approved");
}

export function getFeaturedProperties(): Property[] {
  return PROPERTIES.filter((p) => p.status === "approved" && p.featured);
}

export const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Kurunegala", "Puttalam", "Anuradhapura",
  "Polonnaruwa", "Badulla", "Monaragala", "Ratnapura", "Kegalle",
];

export const CITIES: Record<string, string[]> = {
  "Colombo": ["Colombo 1", "Colombo 2", "Colombo 3", "Colombo 5", "Colombo 6", "Colombo 7", "Dehiwela", "Mount Lavinia", "Kottawa", "Rajagiriya", "Borella", "Homagama"],
  "Gampaha": ["Gampaha Town", "Negombo", "Wattala", "Ja-Ela", "Kiribathgoda", "Kadawatha", "Ragama"],
  "Kalutara": ["Kalutara Town", "Panadura", "Beruwala", "Aluthgama", "Matugama"],
  "Kandy": ["Kandy City", "Peradeniya", "Katugastota", "Gampola", "Nawalapitiya"],
  "Galle": ["Galle Fort", "Galle City", "Hikkaduwa", "Ambalangoda", "Elpitiya"],
  "Kurunegala": ["Kurunegala Town", "Kuliyapitiya", "Mawathagama", "Giriulla"],
};

export const PROPERTY_TYPES_OPTIONS = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment / Condominium" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Residential Land" },
  { value: "commercial", label: "Commercial Property" },
  { value: "agricultural", label: "Agricultural Land" },
];

export const DEMO_ACCOUNTS = [
  { role: "seller", email: "priya@example.com", name: "Priya Wickramasinghe", userType: "seller" },
  { role: "buyer", email: "amali@example.com", name: "Amali Fernando", userType: "buyer" },
  { role: "admin", email: "admin@propix.lk", name: "Admin PROPIX", userType: "admin" },
  { role: "agent", email: "dinesh@propix.lk", name: "Dinesh Rajapaksa", userType: "agent" },
];
