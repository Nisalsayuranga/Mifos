import Link from "next/link";
import { PropertyCard } from "@/components/property/PropertyCard";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { adaptProperty } from "@/lib/adapters";

export async function FeaturedProperties() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select(`
      *,
      property_images (storage_path)
    `)
    .eq("featured", true)
    .eq("status", "published")
    .limit(6);
    
  // Map back to the frontend Property type format
  const properties = (data || []).map(d => adaptProperty(d));
  
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">Hand-Picked For You</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-heading">Featured Properties</h2>
            <p className="text-muted-foreground mt-2">Verified listings from trusted sellers across Sri Lanka</p>
          </div>
          <Link href="/search" className="hidden md:flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link href="/search" className="inline-flex items-center gap-2 text-primary font-semibold text-sm">
            View All Properties <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
