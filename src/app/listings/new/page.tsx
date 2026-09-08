"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FormStepper } from "@/components/shared/FormStepper";
import { FileUploadZone } from "@/components/shared/FileUploadZone";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, MapPin, Camera, FileText, ClipboardList, DollarSign, ChevronLeft, ShieldCheck, Clock, Eye, Building2 } from "lucide-react";
import { PROPERTY_TYPES_OPTIONS, DISTRICTS, CITIES } from "@/lib/data";

const STEPS = [
  { n: 1, label: "Basic Info",         description: "Title, type, price" },
  { n: 2, label: "Property Details",   description: "Size, beds, baths" },
  { n: 3, label: "Location",           description: "Province, city" },
  { n: 4, label: "Photos",             description: "Upload images" },
  { n: 5, label: "Documents",          description: "Verification docs" },
  { n: 6, label: "Review & Submit",    description: "Final check" },
];

const CONDITIONS = ["Brand New", "Semi-New (0-5 yrs)", "Good Condition (5-15 yrs)", "Needs Renovation", "Land Only"];
const PROVINCES = ["Western", "Central", "Southern", "Northern", "Eastern", "North Western", "North Central", "Uva", "Sabaragamuwa"];

import { createClient } from "@/lib/supabase/client";
import { PropertyCategory, ListingType, PropertyCondition } from "@/types/database.types";

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/auth");
    }
    checkUser();
  }, [router]);

  // Step 1 — Basic Info
  const [s1, setS1] = useState({ title: "", category: "house", listingType: "sale", price: "", description: "" });
  // Step 2 — Details
  const [s2, setS2] = useState({ landSize: "", buildingSize: "", beds: "3", baths: "2", parking: "1", condition: "good_condition", yearBuilt: "" });
  // Step 3 — Location
  const [s3, setS3] = useState({ province: "Western", district: "Colombo", city: "Colombo 7", address: "", lat: "", lng: "" });
  // Step 4 — Photos & Media
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState("");
  // Step 5 — Documents
  const [docs, setDocs] = useState<any[]>([]);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to list a property.");

      // 1. Insert Property
      const { data: prop, error: propErr } = await supabase.from("properties").insert({
        seller_id: user.id,
        title: s1.title,
        description: s1.description,
        category: s1.category as PropertyCategory,
        listing_type: s1.listingType as ListingType,
        price: parseFloat(s1.price),
        price_label: `LKR ${Number(s1.price).toLocaleString()}`,
        land_size: parseFloat(s2.landSize) || 0,
        building_size: parseFloat(s2.buildingSize) || 0,
        beds: parseInt(s2.beds) || 0,
        baths: parseInt(s2.baths) || 0,
        parking: parseInt(s2.parking) || 0,
        condition: s2.condition as PropertyCondition,
        year_built: parseInt(s2.yearBuilt) || null,
        province: s3.province,
        district: s3.district,
        city: s3.city,
        address: s3.address,
        latitude: parseFloat(s3.lat) || null,
        longitude: parseFloat(s3.lng) || null,
        status: "submitted",
        verified: false,
        featured: false,
        views: 0,
        inquiries_count: 0
      }).select().single();

      if (propErr) throw new Error(`Failed to insert property: ${propErr.message}`);
      const propertyId = prop.id;

      // 2. Upload Images
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo.file) continue;
        const ext = photo.name.split('.').pop();
        const fileName = `${propertyId}-${Date.now()}-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("property-images").upload(fileName, photo.file);
        if (uploadErr) console.warn("Failed to upload image:", uploadErr);
        
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(fileName);
        
        await supabase.from("property_images").insert({
          property_id: propertyId,
          storage_path: urlData.publicUrl,
          file_name: fileName,
          sort_order: i,
          is_cover: i === 0
        });
      }

      // 3. Upload Documents
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        if (!doc.file) continue;
        const ext = doc.name.split('.').pop();
        const fileName = `${propertyId}-${Date.now()}-${i}.${ext}`;
        // documents bucket is private, so we just store the path and use createSignedUrl later when viewing
        const { error: uploadErr } = await supabase.storage.from("property-documents").upload(fileName, doc.file);
        if (uploadErr) console.warn("Failed to upload doc:", uploadErr);
        
        await supabase.from("property_documents").insert({
          property_id: propertyId,
          document_type: "other",
          storage_path: fileName,
          file_name: doc.name,
          status: "pending",
          uploaded_by: user.id
        });
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-10 shadow-xl border border-border space-y-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground font-heading">Listing Submitted!</h2>
          <p className="text-muted-foreground mt-2 leading-relaxed text-sm">Your property has been submitted for administrative review. Our team will verify the details within <strong>24 hours</strong>.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-left">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-amber-600"/><p className="font-bold text-amber-800 text-sm">Current Status</p></div>
          <StatusBadge status="pending" />
          <p className="text-xs text-amber-700 mt-2">Once approved, your property will be publicly listed on PROPIX.</p>
        </div>
        {docs.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0"/>
            <p className="text-xs text-emerald-700">{docs.length} confidential document{docs.length > 1 ? "s" : ""} securely received.</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/seller"><Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-11">Go to My Dashboard</Button></Link>
          <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => { setStep(1); setSubmitted(false); setPhotos([]); setDocs([]); }}>List Another Property</Button>
        </div>
      </div>
    </div>
  );

  const inp = "w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30";
  const sel = "w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white appearance-none";
  const lbl = "text-xs font-bold text-foreground uppercase tracking-wider mb-2 block";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-muted/30 pt-16">
        <header className="bg-white border-b border-border sticky top-16 z-30">
          <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/seller"><Button variant="ghost" size="sm" className="gap-1.5"><ChevronLeft className="w-4 h-4"/>Back</Button></Link>
              <span className="text-foreground font-semibold hidden sm:block">List Your Property</span>
            </div>
            <StatusBadge status="draft" />
          </div>
        </header>

        <div className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
          <div className="mb-10">
            <FormStepper steps={STEPS} currentStep={step} onStepClick={(n) => n < step && setStep(n)} />
          </div>

          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Home className="w-5 h-5 text-primary"/></div><div><h2 className="font-bold text-foreground text-xl font-heading">Basic Information</h2><p className="text-sm text-muted-foreground">Tell us about your property</p></div></div>
              <div><label className={lbl}>Listing Title *</label><input value={s1.title} onChange={e => setS1({...s1, title: e.target.value})} placeholder="e.g. Luxury 4-Bedroom House in Colombo 7" className={inp}/></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Property Type *</label><select value={s1.category} onChange={e => setS1({...s1, category: e.target.value})} className={sel}>{PROPERTY_TYPES_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label className={lbl}>Listing Type *</label>
                  <div className="flex gap-2">
                    {[["sale","For Sale"],["rent","For Rent"]].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setS1({...s1, listingType: v})} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${s1.listingType === v ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div><label className={lbl}>Asking Price (LKR) *</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">LKR</span><input type="number" value={s1.price} onChange={e => setS1({...s1, price: e.target.value})} placeholder="e.g. 25000000" className={`${inp} pl-14`}/></div><p className="text-xs text-muted-foreground mt-1">Enter the full amount in Sri Lankan Rupees</p></div>
              <div><label className={lbl}>Description *</label><textarea rows={5} value={s1.description} onChange={e => setS1({...s1, description: e.target.value})} placeholder="Describe your property — key features, unique selling points, nearby landmarks, condition..." className={`${inp} resize-none`}/></div>
              <Button onClick={() => setStep(2)} disabled={!s1.title || !s1.price || !s1.description} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">Next: Property Details →</Button>
            </div>
          )}

          {/* Step 2 — Property Details */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-primary"/></div><div><h2 className="font-bold text-foreground text-xl font-heading">Property Details</h2><p className="text-sm text-muted-foreground">Measurements and specifications</p></div></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Land Size (Perches)</label><input type="number" value={s2.landSize} onChange={e => setS2({...s2, landSize: e.target.value})} placeholder="e.g. 20" className={inp}/></div>
                <div><label className={lbl}>Building Size (Sq Ft)</label><input type="number" value={s2.buildingSize} onChange={e => setS2({...s2, buildingSize: e.target.value})} placeholder="e.g. 2400" className={inp}/></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={lbl}>Bedrooms</label><select value={s2.beds} onChange={e => setS2({...s2, beds: e.target.value})} className={sel}>{["0","1","2","3","4","5","6+"].map(n => <option key={n}>{n}</option>)}</select></div>
                <div><label className={lbl}>Bathrooms</label><select value={s2.baths} onChange={e => setS2({...s2, baths: e.target.value})} className={sel}>{["0","1","2","3","4","5+"].map(n => <option key={n}>{n}</option>)}</select></div>
                <div><label className={lbl}>Parking</label><select value={s2.parking} onChange={e => setS2({...s2, parking: e.target.value})} className={sel}>{["0","1","2","3","4+"].map(n => <option key={n}>{n}</option>)}</select></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Property Condition</label><select value={s2.condition} onChange={e => setS2({...s2, condition: e.target.value})} className={sel}>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className={lbl}>Year Built</label><input type="number" value={s2.yearBuilt} onChange={e => setS2({...s2, yearBuilt: e.target.value})} placeholder="e.g. 2018" className={inp}/></div>
              </div>
              <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl">← Back</Button><Button onClick={() => setStep(3)} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">Next: Location →</Button></div>
            </div>
          )}

          {/* Step 3 — Location */}
          {step === 3 && (
            <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-primary"/></div><div><h2 className="font-bold text-foreground text-xl font-heading">Location Details</h2><p className="text-sm text-muted-foreground">Where is your property?</p></div></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Province *</label><select value={s3.province} onChange={e => setS3({...s3, province: e.target.value})} className={sel}>{PROVINCES.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label className={lbl}>District *</label><select value={s3.district} onChange={e => setS3({...s3, district: e.target.value})} className={sel}>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select></div>
              </div>
              <div><label className={lbl}>City / Area *</label><select value={s3.city} onChange={e => setS3({...s3, city: e.target.value})} className={sel}>{(CITIES[s3.district] ?? [s3.district]).map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className={lbl}>Full Address *</label><input value={s3.address} onChange={e => setS3({...s3, address: e.target.value})} placeholder="Street number, street name, landmarks..." className={inp}/></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Latitude</label><input type="text" value={s3.lat} onChange={e => setS3({...s3, lat: e.target.value})} placeholder="e.g. 6.9271" className={inp}/></div>
                <div><label className={lbl}>Longitude</label><input type="text" value={s3.lng} onChange={e => setS3({...s3, lng: e.target.value})} placeholder="e.g. 79.8612" className={inp}/></div>
              </div>
              {/* Map placeholder */}
              <div className="rounded-xl border border-border overflow-hidden bg-muted/50 h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="w-8 h-8 text-primary/40"/>
                <p className="text-sm font-medium">Map Location</p>
                <p className="text-xs text-center max-w-xs">In the full version, drag the pin to set your exact property location on the map.</p>
                <div className="mt-1 px-3 py-1.5 bg-primary/10 rounded-full text-xs text-primary font-medium">📍 {s3.city}, {s3.district}</div>
              </div>
              <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl">← Back</Button><Button onClick={() => setStep(4)} disabled={!s3.address} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">Next: Photos →</Button></div>
            </div>
          )}

          {/* Step 4 — Photos & Media */}
          {step === 4 && (
            <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Camera className="w-5 h-5 text-primary"/></div><div><h2 className="font-bold text-foreground text-xl font-heading">Property Media</h2><p className="text-sm text-muted-foreground">Upload images and video links</p></div></div>
              <FileUploadZone accept=".jpg,.jpeg,.png,.webp" multiple imagePreview files={photos} onChange={setPhotos} label="Drag & drop photos here" hint="or click to browse — JPG, PNG, WEBP up to 10MB each" />
              <div><label className={lbl}>Video Tour Link (Optional)</label><input type="url" value={videos} onChange={e => setVideos(e.target.value)} placeholder="e.g. https://youtube.com/watch?v=..." className={inp}/></div>
              <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-11 rounded-xl">← Back</Button><Button onClick={() => setStep(5)} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">Next: Documents →</Button></div>
            </div>
          )}

          {/* Step 5 — Documents */}
          {step === 5 && (
            <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-amber-600"/></div><div><h2 className="font-bold text-foreground text-xl font-heading">Verification Documents</h2><p className="text-sm text-muted-foreground">Confidential — for admin verification only</p></div></div>
              <FileUploadZone accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple confidential files={docs} onChange={setDocs} label="Drop documents here (Deed, Survey Plan, etc.)" hint="PDF, DOC, JPG accepted — max 20MB each" />
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <p className="text-xs font-bold text-foreground mb-2">Recommended Documents</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                  <li>Title Deed (mandatory for verification)</li>
                  <li>Survey Plan / Land Registry Document</li>
                  <li>Building Permit (for constructed properties)</li>
                  <li>Certificate of Conformity (COC)</li>
                  <li>Deed of Transfer (if recently purchased)</li>
                </ul>
              </div>
              <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(4)} className="flex-1 h-11 rounded-xl">← Back</Button><Button onClick={() => setStep(6)} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">Next: Review →</Button></div>
            </div>
          )}

          {/* Step 6 — Review & Submit */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><ClipboardList className="w-5 h-5 text-primary"/></div><div><h2 className="font-bold text-foreground text-xl font-heading">Review & Submit</h2><p className="text-sm text-muted-foreground">Check everything before submitting for verification</p></div></div>
                <div className="space-y-5">
                  <div className="bg-muted/40 rounded-xl p-5">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Basic Information</p>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Title:</span><p className="font-medium">{s1.title || "—"}</p></div>
                      <div><span className="text-muted-foreground">Type:</span><p className="font-medium capitalize">{s1.category} · {s1.listingType === "sale" ? "For Sale" : "For Rent"}</p></div>
                      <div><span className="text-muted-foreground">Asking Price:</span><p className="font-bold text-primary">LKR {Number(s1.price).toLocaleString() || "—"}</p></div>
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-5">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Property Details</p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {s2.landSize && <div><span className="text-muted-foreground">Land:</span><p className="font-medium">{s2.landSize}P</p></div>}
                      {s2.buildingSize && <div><span className="text-muted-foreground">Building:</span><p className="font-medium">{s2.buildingSize} sqft</p></div>}
                      <div><span className="text-muted-foreground">Beds:</span><p className="font-medium">{s2.beds}</p></div>
                      <div><span className="text-muted-foreground">Baths:</span><p className="font-medium">{s2.baths}</p></div>
                      <div><span className="text-muted-foreground">Condition:</span><p className="font-medium">{s2.condition}</p></div>
                      {s2.yearBuilt && <div><span className="text-muted-foreground">Built:</span><p className="font-medium">{s2.yearBuilt}</p></div>}
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-5">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Location</p>
                    <p className="text-sm font-medium">{s3.address && `${s3.address}, `}{s3.city}, {s3.district}, {s3.province} Province</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10"><p className="text-2xl font-bold text-primary">{photos.length}</p><p className="text-xs text-muted-foreground mt-1">Photos</p></div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200"><p className="text-2xl font-bold text-amber-700">{docs.length}</p><p className="text-xs text-muted-foreground mt-1">Documents</p></div>
                    <div className="bg-muted/60 rounded-xl p-4 text-center border border-border"><p className="text-2xl font-bold text-foreground">6</p><p className="text-xs text-muted-foreground mt-1">Steps Done</p></div>
                  </div>
                </div>
              </div>
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(5)} className="flex-1 h-12 rounded-xl">← Back</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-base">
                  {loading ? "Submitting..." : "Submit for Verification 🚀"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}