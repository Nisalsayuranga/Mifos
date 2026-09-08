"use client";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PropertyCard } from "@/components/property/PropertyCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Heart, Share2, Calendar, Phone, MessageSquare, MapPin, Bed, Bath, Maximize2, Car, ShieldCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatLKR } from "@/lib/data";
import { adaptProperty } from "@/lib/adapters";

import { useParams } from "next/navigation";

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperty() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_images (storage_path),
          property_features (feature_name)
        `)
        .eq("id", params.id)
        .single();
        
      if (!error && data) {
        setProperty(adaptProperty(data));
        
        // Fetch similar
        const { data: simData } = await supabase
          .from("properties")
          .select(`*, property_images(storage_path)`)
          .eq("category", data.category)
          .eq("status", "published")
          .neq("id", data.id)
          .limit(3);
          
        if (simData) {
          setSimilar(simData.map(d => adaptProperty(d)));
        }
      }
      setLoading(false);
    }
    fetchProperty();
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!property && !loading) return notFound();
  
  return <PropertyDetailClient property={property} similar={similar} />;
}

function PropertyDetailClient({ property, similar }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  if (!property) return null;
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-muted/30 pt-16">
        <div className="bg-white border-b border-border">
          <div className="container mx-auto px-4 md:px-6 h-12 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-primary transition-colors">Properties</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{property.title}</span>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="relative aspect-video overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url(${property.images[imgIdx]})` }} />
                  {property.images.length > 1 && (
                    <>
                      <button onClick={() => setImgIdx((i:number) => (i - 1 + property.images.length) % property.images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={() => setImgIdx((i:number) => (i + 1) % property.images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md"><ChevronRight className="w-5 h-5" /></button>
                    </>
                  )}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <StatusBadge status={property.listingType === "sale" ? "sale" : "rent"} />
                    {property.verified && <StatusBadge status="verified" />}
                  </div>
                </div>
                {property.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {property.images.map((img:string, i:number) => (
                      <button key={i} onClick={() => setImgIdx(i)} className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? "border-primary" : "border-transparent"}`}>
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading leading-snug">{property.title}</h1>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-2"><MapPin className="w-4 h-4 text-primary shrink-0" /> {property.address}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary font-heading">{property.priceLabel}</p>
                    {property.listingType === "rent" && <p className="text-sm text-muted-foreground">per month</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                  {property.beds > 0 && <div className="text-center"><Bed className="w-5 h-5 text-primary mx-auto mb-1" /><p className="font-bold text-lg">{property.beds}</p><p className="text-xs text-muted-foreground">Bedrooms</p></div>}
                  {property.baths > 0 && <div className="text-center"><Bath className="w-5 h-5 text-primary mx-auto mb-1" /><p className="font-bold text-lg">{property.baths}</p><p className="text-xs text-muted-foreground">Bathrooms</p></div>}
                  {property.landSize > 0 && <div className="text-center"><Maximize2 className="w-5 h-5 text-primary mx-auto mb-1" /><p className="font-bold text-lg">{property.landSize}P</p><p className="text-xs text-muted-foreground">Land</p></div>}
                  {property.buildingSize > 0 && <div className="text-center"><Maximize2 className="w-5 h-5 text-primary mx-auto mb-1" /><p className="font-bold text-lg">{property.buildingSize}</p><p className="text-xs text-muted-foreground">Sq Ft</p></div>}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <h2 className="font-bold text-foreground text-xl font-heading mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">{property.description}</p>
              </div>

              {property.features.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h2 className="font-bold text-foreground text-xl font-heading mb-4">Features & Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.features.map((f:string) => (
                      <div key={f} className="flex items-center gap-2.5 text-sm text-foreground"><div className="w-2 h-2 rounded-full bg-primary shrink-0" />{f}</div>
                    ))}
                  </div>
                </div>
              )}

              {similar.length > 0 && (
                <div>
                  <h2 className="font-bold text-foreground text-xl font-heading mb-4">Similar Properties</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {similar.map((p:any) => <PropertyCard key={p.id} property={p} />)}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  {property.verified && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div><p className="text-xs font-bold text-emerald-800">Verified Listing</p><p className="text-xs text-emerald-700">Documents verified by PROPIX admin</p></div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-1">Listed by</p>
                  <p className="font-bold text-foreground mb-4">PROPIX Verified Seller</p>
                  <div className="space-y-3">
                    <Button onClick={() => setInquiryOpen(true)} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"><Calendar className="w-4 h-4 mr-2" /> Request a Viewing</Button>
                    <Button onClick={() => setInquiryOpen(true)} variant="outline" className="w-full h-11 rounded-xl border-primary text-primary hover:bg-primary/5"><MessageSquare className="w-4 h-4 mr-2" /> Send Inquiry</Button>
                    <Link href="/consultation"><Button variant="outline" className="w-full h-11 rounded-xl"><Phone className="w-4 h-4 mr-2" /> Request Consultation</Button></Link>
                    <div className="flex gap-2">
                      <button onClick={() => setLiked(!liked)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${liked ? "bg-red-50 border-red-200 text-red-600" : "border-border text-foreground hover:border-primary"}`}><Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`} /> {liked ? "Saved" : "Save"}</button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:border-primary transition-colors"><Share2 className="w-4 h-4" /> Share</button>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4 shadow-sm text-center">
                  <p className="text-xs text-muted-foreground">Interested in financing?</p>
                  <Link href="/financing" className="text-sm font-semibold text-primary hover:underline mt-1 block">Explore Loan Options →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {inquiryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setInquiryOpen(false); setInquirySent(false); }} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              {inquirySent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-8 h-8 text-emerald-600" /></div>
                  <h3 className="text-xl font-bold font-heading mb-2">Inquiry Sent!</h3>
                  <p className="text-sm text-muted-foreground">We will connect you with the seller within 24 hours.</p>
                  <Button onClick={() => { setInquiryOpen(false); setInquirySent(false); }} className="mt-5 bg-primary hover:bg-primary/90 text-white rounded-xl px-8">Done</Button>
                </div>
              ) : (
                <InquiryForm property={property} onCancel={() => setInquiryOpen(false)} onSuccess={() => setInquirySent(true)} />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function InquiryForm({ property, onCancel, onSuccess }: { property: any, onCancel: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("I am interested in this property. Please contact me.");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setName(user.user_metadata?.full_name || "");
        setEmail(user.email || "");
      }
    }
    loadUser();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth";
        return;
      }
      
      const { error } = await supabase.from("inquiries").insert({
        property_id: property.id,
        buyer_id: user.id,
        seller_id: property.sellerId,
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
        message: message,
        status: "new"
      });

      if (error) throw new Error(error.message);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send inquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="text-xl font-bold font-heading mb-4">Send an Inquiry</h3>
      <p className="text-sm text-muted-foreground mb-4">About: <span className="font-medium text-foreground">{property.title}</span></p>
      {errorMsg && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-200">{errorMsg}</div>}
      <div className="space-y-3">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name *" className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address *" className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Your message..." className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>
      <div className="flex gap-3 mt-5">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>Cancel</Button>
        <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl" disabled={loading} onClick={handleSubmit}>{loading ? "Sending..." : "Send Inquiry"}</Button>
      </div>
    </>
  );
}