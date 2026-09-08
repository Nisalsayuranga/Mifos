import { PropertyRow } from "@/types/database.types";
import { Property, formatLKR } from "@/lib/data";

/**
 * Converts a Supabase PropertyRow (snake_case) into the frontend Property interface (camelCase).
 * 
 * @param row The raw property row from Supabase (typically joined with images/features)
 */
export function adaptProperty(row: any): Property {
  // Extract images from joined query
  let images: string[] = [];
  if (row.property_images && Array.isArray(row.property_images)) {
    images = row.property_images.map((img: any) => img.storage_path || img);
  }

  // Extract features from joined query
  let features: string[] = [];
  if (row.property_features && Array.isArray(row.property_features)) {
    features = row.property_features.map((f: any) => f.feature_name || f);
  }

  // Compute location if city and district exist
  const location = row.city && row.district 
    ? `${row.city}, ${row.district}` 
    : row.district || row.city || "Unknown Location";

  return {
    id: row.id,
    title: row.title,
    category: row.category as Property["category"],
    listingType: row.listing_type as Property["listingType"],
    price: row.price,
    priceLabel: row.price_label || formatLKR(row.price),
    location,
    district: row.district || "",
    province: row.province || "",
    address: row.address || "",
    beds: row.beds || 0,
    baths: row.baths || 0,
    landSize: row.land_size || 0,
    buildingSize: row.building_size || 0,
    parking: row.parking || 0,
    description: row.description || "",
    features,
    images,
    status: row.status as Property["status"],
    verified: row.verified || false,
    featured: row.featured || false,
    sellerId: row.seller_id,
    agentId: row.agent_id || undefined,
    createdAt: row.created_at,
    views: row.views || 0,
    inquiries: row.inquiries_count || 0,
  };
}
