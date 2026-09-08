"use client";

import dynamic from 'next/dynamic';

const MapWrapper = dynamic(() => import('@/components/map/MapWrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <div className="text-lg font-medium font-sans">Loading Map...</div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden font-sans">
      <MapWrapper />
    </main>
  );
}
