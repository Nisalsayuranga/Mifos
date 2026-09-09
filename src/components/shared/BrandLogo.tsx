"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "light" | "dark"; // light = white text (for dark backgrounds), dark = emerald text (for white backgrounds)
  size?: "sm" | "md" | "lg" | "xl";
  layout?: "horizontal" | "vertical";
  className?: string;
}

export function BrandLogo({
  variant = "dark",
  size = "md",
  layout = "horizontal",
  className,
}: BrandLogoProps) {
  const isLight = variant === "light";

  if (layout === "vertical") {
    const markSizes = {
      sm: { w: 48, h: 48, cls: "h-12 w-auto" },
      md: { w: 64, h: 64, cls: "h-16 w-auto" },
      lg: { w: 84, h: 84, cls: "h-20 md:h-24 w-auto" },
      xl: { w: 120, h: 120, cls: "h-28 md:h-32 w-auto" },
    };

    const textSizes = {
      sm: "text-base tracking-[0.18em]",
      md: "text-lg tracking-[0.2em]",
      lg: "text-2xl md:text-3xl tracking-[0.22em]",
      xl: "text-3xl md:text-4xl tracking-[0.24em]",
    };

    const subSizes = {
      sm: "text-[9px] tracking-[0.3em]",
      md: "text-[10px] tracking-[0.32em]",
      lg: "text-xs md:text-sm tracking-[0.35em]",
      xl: "text-sm md:text-base tracking-[0.38em]",
    };

    const s = markSizes[size];

    return (
      <div className={cn("flex flex-col items-center text-center select-none group", className)}>
        <div className="relative transition-transform duration-300 group-hover:scale-105">
          <Image
            src="/rupasinghe-realty-mark.png"
            alt="RUPASINGHE REALTY"
            width={s.w}
            height={s.h}
            className={cn("object-contain drop-shadow-md", s.cls)}
            priority
          />
        </div>
        <div className="mt-2.5 flex flex-col items-center">
          <span
            className={cn(
              "font-heading font-extrabold uppercase leading-tight font-serif",
              textSizes[size],
              isLight ? "text-white" : "text-[#013B30]"
            )}
            style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", letterSpacing: "0.18em" }}
          >
            RUPASINGHE
          </span>
          <div className="flex items-center justify-center gap-2 mt-1 w-full">
            <span className="h-[1px] flex-1 max-w-[40px] bg-gradient-to-r from-transparent to-[#C5A059]" />
            <span
              className={cn("font-semibold uppercase text-[#C5A059] leading-none", subSizes[size])}
              style={{ letterSpacing: "0.32em" }}
            >
              REALTY
            </span>
            <span className="h-[1px] flex-1 max-w-[40px] bg-gradient-to-l from-transparent to-[#C5A059]" />
          </div>
        </div>
      </div>
    );
  }

  // Horizontal layout (for navbars, header, footers)
  const hSizes = {
    sm: { h: 32, w: 32, imgCls: "h-8 w-auto", title: "text-sm tracking-[0.14em]", sub: "text-[8px] tracking-[0.26em]", lineW: "w-2.5" },
    md: { h: 42, w: 42, imgCls: "h-10 md:h-11 w-auto", title: "text-base md:text-lg tracking-[0.16em]", sub: "text-[9px] md:text-[10px] tracking-[0.3em]", lineW: "w-3.5" },
    lg: { h: 52, w: 52, imgCls: "h-12 md:h-14 w-auto", title: "text-xl md:text-2xl tracking-[0.18em]", sub: "text-xs tracking-[0.32em]", lineW: "w-5" },
    xl: { h: 64, w: 64, imgCls: "h-16 w-auto", title: "text-2xl md:text-3xl tracking-[0.2em]", sub: "text-sm tracking-[0.35em]", lineW: "w-6" },
  };

  const s = hSizes[size];

  return (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
        <Image
          src="/rupasinghe-realty-mark.png"
          alt="RUPASINGHE REALTY"
          width={s.w}
          height={s.h}
          className={cn("object-contain drop-shadow-sm", s.imgCls)}
          priority
        />
      </div>
      <div className="flex flex-col justify-center">
        <span
          className={cn(
            "font-extrabold uppercase leading-none transition-colors",
            s.title,
            isLight ? "text-white" : "text-[#013B30]"
          )}
          style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
        >
          RUPASINGHE
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={cn("h-[1px] bg-[#C5A059]", s.lineW)} />
          <span
            className={cn("font-semibold uppercase text-[#C5A059] leading-none", s.sub)}
            style={{ letterSpacing: "0.28em" }}
          >
            REALTY
          </span>
          <span className={cn("h-[1px] bg-[#C5A059]", s.lineW)} />
        </div>
      </div>
    </div>
  );
}
