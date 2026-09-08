import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROPERTIES, USERS } from "@/lib/data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET() {
  try {
    const results = {
      users: 0,
      profiles: 0,
      properties: 0,
      images: 0,
      features: 0
    };

    // Convert a string ID to a valid hex UUID format (deterministic)
    const getUuid = (str: string) => {
      let hex = '';
      for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16);
      }
      hex = hex.padEnd(32, '0').slice(0, 32);
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
    };

    // 1. Create Users & Profiles
    for (const u of USERS) {
      const userId = getUuid(u.id);
      
      const { data: user, error: authError } = await supabase.auth.admin.createUser({
        id: userId,
        email: u.email,
        email_confirm: true,
        password: "Password123!",
        user_metadata: {
          full_name: u.name,
          role: u.role
        }
      });
      
      if (authError && authError.code !== "email_exists" && !authError.message.includes("already been registered")) {
        console.error("Auth error for", u.email, authError);
      } else {
        results.users++;
        if (u.role === "agent") {
          await supabase.from("agents").upsert({
            id: userId,
            profile_id: userId,
            is_verified: true,
            total_reviews: 10,
            rating: 4.8
          }, { onConflict: "id" });
        }
      }
    }
    
    // 2. Insert Properties
    for (const p of PROPERTIES) {
      const propId = getUuid(p.id);
      
      // Delete if exists
      await supabase.from("properties").delete().eq("id", propId);
      
      const { error: propError } = await supabase.from("properties").insert({
        id: propId,
        seller_id: getUuid(p.sellerId),
        agent_id: p.agentId ? getUuid(p.agentId) : null,
        title: p.title,
        description: p.description,
        category: p.category,
        listing_type: p.listingType,
        price: p.price,
        price_label: p.priceLabel,
        land_size: p.landSize,
        building_size: p.buildingSize,
        beds: p.beds,
        baths: p.baths,
        parking: p.parking,
        district: p.district,
        province: p.province,
        city: p.location.split(',')[0].trim(),
        address: p.address,
        status: p.status === "pending" ? "submitted" : (p.status === "approved" ? "published" : p.status),
        verified: p.verified,
        featured: p.featured,
        views: p.views,
        inquiries_count: p.inquiries,
        created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString()
      });
      
      if (propError) {
        console.error("Prop error:", p.id, propError);
      } else {
        results.properties++;
        
        // Features
        for (const f of p.features) {
          await supabase.from("property_features").insert({
            property_id: propId,
            feature_name: f
          });
          results.features++;
        }
        
        // Images (just referencing the external URLs for now so they render)
        let order = 0;
        for (const img of p.images) {
          await supabase.from("property_images").insert({
            property_id: propId,
            storage_path: img, // storing the full http url directly since frontend uses it as string
            is_cover: order === 0,
            sort_order: order++
          });
          results.images++;
        }
      }
    }
    
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
