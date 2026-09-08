export function Statistics() {
  const stats = [
    { value: "12,000+", label: "Properties Listed", sub: "Across Sri Lanka" },
    { value: "8,500+", label: "Happy Clients", sub: "Buyers & Sellers" },
    { value: "500+", label: "Expert Agents", sub: "Verified Professionals" },
    { value: "24 hrs", label: "Avg. Verification", sub: "Admin Review Time" },
  ];
  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white font-heading">{s.value}</p>
              <p className="text-white/90 font-semibold mt-1">{s.label}</p>
              <p className="text-white/55 text-sm mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
