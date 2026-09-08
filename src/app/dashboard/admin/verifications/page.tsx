"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, ShieldCheck, Eye, FileText, Bed, Bath, Maximize2, MapPin, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface AdminProperty {
  id: string;
  title: string;
  location: string;
  address: string;
  priceLabel: string;
  images: string[];
  beds: number;
  baths: number;
  landSize: number;
  buildingSize: number;
  description: string;
  documents: any[];
}

export default function VerificationsPage() {
  const [queue, setQueue] = useState<AdminProperty[]>([]);
  const [selected, setSelected] = useState<AdminProperty | null>(null);
  const [statuses, setStatuses] = useState<Record<string, "approved" | "rejected">>({}); 
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [actionDone, setActionDone] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Create client once, not on every render
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadPending() {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_images(storage_path),
          property_documents(id, file_name, storage_path, document_type, created_at)
        `)
        .eq("status", "submitted");

      if (data) {
        const mapped: AdminProperty[] = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          location: `${p.city || ""}, ${p.district || ""}`,
          address: p.address || "",
          priceLabel: p.price_label || `LKR ${p.price}`,
          images: p.property_images?.map((img: any) => img.storage_path) || [],
          beds: p.beds || 0,
          baths: p.baths || 0,
          landSize: p.land_size || 0,
          buildingSize: p.building_size || 0,
          description: p.description || "",
          documents: p.property_documents || []
        }));
        setQueue(mapped);
        if (mapped.length > 0) setSelected(mapped[0]);
      }
      setLoading(false);
    }
    loadPending();
  }, [supabase]);

  const approve = async () => {
    if (!selected) return;
    setActionError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("properties").update({
      status: "published",
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    }).eq("id", selected.id);

    if (error) {
      setActionError(`Approval failed: ${error.message}`);
      return;
    }
    setStatuses(s => ({ ...s, [selected.id]: "approved" }));
    setActionDone(true);
  };

  const reject = async () => {
    if (!selected || !rejectReason.trim()) return;
    setActionError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("properties").update({
      status: "rejected",
      rejection_reason: rejectReason,
      rejected_by: user?.id,
      rejected_at: new Date().toISOString()
    }).eq("id", selected.id);

    if (error) {
      setActionError(`Rejection failed: ${error.message}`);
      return;
    }
    setStatuses(s => ({ ...s, [selected.id]: "rejected" }));
    setRejectOpen(false);
    setActionDone(true);
  };

  const status = selected ? (statuses[selected.id] ?? "pending") : "pending";

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">Listing Verification</h1>
        <p className="text-muted-foreground mt-1">Review and approve or reject property submissions</p>
      </div>

      {/* Workflow Banner */}
      <div className="bg-muted/50 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {["Pending Review","Admin Review","Approved / Rejected","Publicly Published"].map((step, i) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${i === 1 ? "bg-primary text-white" : i === 2 ? "bg-muted text-foreground" : "bg-muted/80 text-muted-foreground"}`}>{step}</div>
              {i < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0"/>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Queue — left column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="px-4 py-3.5 border-b border-border">
              <h2 className="font-bold text-foreground text-sm">Pending Queue ({queue.length})</h2>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {queue.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground"><ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400"/><p className="text-sm font-medium">Queue is clear!</p></div>
              ) : queue.map((p) => (
                <button key={p.id} onClick={() => { setSelected(p); setImgIdx(0); setActionDone(false); }}
                  className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors ${selected?.id === p.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                  <div className="w-12 h-10 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${p.images[0]})` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.location}</p>
                    <div className="mt-1.5"><StatusBadge status={statuses[p.id] ?? "pending"} /></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Review Panel — right columns */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-5">
              {/* Action Done banner */}
              {actionDone && (
                <div className={`rounded-xl border p-4 flex items-center gap-3 ${status === "approved" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  {status === "approved" ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0"/> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0"/>}
                  <div>
                    <p className="font-bold text-sm">{status === "approved" ? "Listing Approved — Now Publicly Published!" : "Listing Rejected — Seller has been notified."}</p>
                    {status === "rejected" && <p className="text-xs text-red-700 mt-0.5">Reason: {rejectReason}</p>}
                  </div>
                  <StatusBadge status={status} className="ml-auto" />
                </div>
              )}

              {/* Property Info — LEFT side of split */}
              <div className="bg-white rounded-xl border border-border shadow-sm">
                <div className="p-5 border-b border-border">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="font-bold text-foreground font-heading">{selected.title}</h2>
                    <StatusBadge status={statuses[selected.id] ?? "pending"} />
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1.5"><MapPin className="w-4 h-4 text-primary"/>{selected.address}</div>
                  <p className="text-2xl font-bold text-primary mt-2">{selected.priceLabel}</p>
                </div>

                {/* Image gallery */}
                <div className="relative aspect-video overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${selected.images[imgIdx]})` }} />
                  {selected.images.length > 1 && (
                    <>
                      <button onClick={() => setImgIdx(i => (i - 1 + selected.images.length) % selected.images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow"><ChevronLeft className="w-4 h-4"/></button>
                      <button onClick={() => setImgIdx(i => (i + 1) % selected.images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow"><ChevronRight className="w-4 h-4"/></button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">{selected.images.map((_,i) => <button key={i} onClick={() => setImgIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i===imgIdx ? "bg-white w-4" : "bg-white/60"}`}/>)}</div>
                    </>
                  )}
                </div>

                <div className="p-5 grid grid-cols-4 gap-4 border-t border-border">
                  {selected.beds > 0 && <div className="text-center"><Bed className="w-4 h-4 text-primary mx-auto mb-1"/><p className="font-bold text-sm">{selected.beds}</p><p className="text-xs text-muted-foreground">Beds</p></div>}
                  {selected.baths > 0 && <div className="text-center"><Bath className="w-4 h-4 text-primary mx-auto mb-1"/><p className="font-bold text-sm">{selected.baths}</p><p className="text-xs text-muted-foreground">Baths</p></div>}
                  {selected.landSize > 0 && <div className="text-center"><Maximize2 className="w-4 h-4 text-primary mx-auto mb-1"/><p className="font-bold text-sm">{selected.landSize}P</p><p className="text-xs text-muted-foreground">Land</p></div>}
                  {selected.buildingSize > 0 && <div className="text-center"><Maximize2 className="w-4 h-4 text-primary mx-auto mb-1"/><p className="font-bold text-sm">{selected.buildingSize}</p><p className="text-xs text-muted-foreground">Sq Ft</p></div>}
                </div>
                <div className="px-5 pb-5">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                </div>
              </div>

              {/* Documents section */}
              <div className="bg-white rounded-xl border border-border shadow-sm p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-600"/>Verification Documents</h3>
                <div className="space-y-2">
                  {selected.documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded by the seller.</p>
                  ) : (
                    selected.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-amber-600"/></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground capitalize">{doc.document_type?.replace(/_/g, " ") || doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">CONFIDENTIAL</span>
                        {doc.storage_path && (
                          <a href={doc.storage_path} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium shrink-0"><Eye className="w-3.5 h-3.5"/></a>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary"/>Documents are encrypted and only visible to verified PROPIX administrators.</p>
              </div>

              {/* Action Error Banner */}
              {actionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0"/>
                  <p className="text-sm font-semibold text-red-700">{actionError}</p>
                  <button onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>
                </div>
              )}

              {/* Action Buttons */}
              {!actionDone && (
                <div className="flex gap-3">
                  <Button onClick={approve} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2">
                    <CheckCircle2 className="w-5 h-5"/>Approve Listing
                  </Button>
                  <Button onClick={() => setRejectOpen(true)} variant="outline" className="flex-1 h-12 rounded-xl font-bold border-red-200 text-red-600 hover:bg-red-50 gap-2">
                    <X className="w-5 h-5"/>Reject Listing
                  </Button>
                </div>
              )}
              <Link href={`/properties/${selected.id}`} className="block">
                <Button variant="outline" className="w-full rounded-xl">View Full Property Page <Eye className="w-4 h-4 ml-2"/></Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border p-16 text-center shadow-sm">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
              <p className="font-bold text-foreground">Select a listing from the queue to review</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold font-heading mb-1">Reject Listing</h3>
            <p className="text-sm text-muted-foreground mb-4">Provide a reason. This will be sent to the seller so they can make corrections and resubmit.</p>
            <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Title deed document is unclear / missing. Please reupload a clearer scan."
              className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button onClick={reject} disabled={!rejectReason.trim()} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">Confirm Rejection</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}