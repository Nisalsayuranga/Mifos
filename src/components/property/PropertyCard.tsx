"use client";
import Link from "next/link";
import { MapPin, Bed, Bath, Maximize2, Heart, ShieldCheck, Star } from "lucide-react";
import { Property } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const [liked, setLiked] = useState(false);
  const img = property.images[0];
  const isRent = property.listingType === "rent";

  return (
    <Link href={`/properties/${property.id}`} className={cn("group block", className)}>
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${img})` }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", isRent ? "bg-secondary text-white" : "bg-primary text-white")}>
              {isRent ? "For Rent" : "For Sale"}
            </span>
            {property.verified && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
            {property.featured && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500 text-white">
                <Star className="w-3 h-3" /> Featured
              </span>
            )}
          </div>

          {/* Favorite */}
          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
          >
            <Heart className={cn("w-4 h-4 transition-colors", liked ? "fill-red-500 text-red-500" : "text-slate-600")} />
          </button>

          {/* Price overlay */}
          <div className="absolute bottom-3 left-3">
            <span className="text-white font-bold text-lg drop-shadow-md">{property.priceLabel}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground text-sm mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            {property.beds > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Bed className="w-3.5 h-3.5" />
                <span>{property.beds} Beds</span>
              </div>
            )}
            {property.baths > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Bath className="w-3.5 h-3.5" />
                <span>{property.baths} Baths</span>
              </div>
            )}
            {property.landSize > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{property.landSize}P</span>
              </div>
            )}
            {property.buildingSize > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{property.buildingSize} sqft</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
