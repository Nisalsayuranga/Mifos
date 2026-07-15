'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Plus, Search, UserPlus, Sparkles, Filter, MoreVertical, RefreshCcw, 
  Pencil, Trash2, ShieldCheck, UserCog, Camera, CameraOff, MapPin, Image
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Reusable Live Webcam Capture Component
const WebcamCapture = ({ 
  onCapture, 
  label, 
  initialImage,
  autoStart = false
}: { 
  onCapture: (base64: string | null) => void; 
  label: string; 
  initialImage?: string | null; 
  autoStart?: boolean; 
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCapturedImage(initialImage || null);
  }, [initialImage]);

  // Enumerate active camera inputs
  const enumerateCameras = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !activeDeviceId) {
        setActiveDeviceId(videoDevices[0].deviceId);
      }
    } catch (e) {
      console.error("Camera enumeration failed:", e);
    }
  };

  const startCamera = async (deviceIdToUse?: string) => {
    const targetId = deviceIdToUse || activeDeviceId;
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const videoConstraints: MediaTrackConstraints = {};
      if (targetId && targetId.trim() !== "") {
        videoConstraints.deviceId = { exact: targetId };
      }
      // Use ideal resolution parameters to maintain compatibility across high/low resolution cameras
      videoConstraints.width = { ideal: 640 };
      videoConstraints.height = { ideal: 480 };

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints
      });
      
      setStream(mediaStream);
      setError(null);

      // Enumerate/Re-enumerate devices now that permissions have been successfully granted
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !activeDeviceId) {
        setActiveDeviceId(videoDevices[0].deviceId);
      }

      // Delay slightly to ensure video element is mounted in DOM
      setTimeout(() => {
        const videoElement = document.getElementById(`webcam-video-${label}`) as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = mediaStream;
        }
      }, 150);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Webcam access denied or unavailable: " + (err.message || err.name));
    }
  };

  useEffect(() => {
    enumerateCameras();
    if (autoStart && !capturedImage) {
      // Auto-initiate stream on mount/tab change
      startCamera();
    }
  }, [autoStart]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    const videoElement = document.getElementById(`webcam-video-${label}`) as HTMLVideoElement;
    const canvasElement = document.getElementById(`webcam-canvas-${label}`) as HTMLCanvasElement;
    if (videoElement && canvasElement) {
      const context = canvasElement.getContext('2d');
      if (context) {
        canvasElement.width = videoElement.videoWidth || 640;
        canvasElement.height = videoElement.videoHeight || 480;
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        const base64 = canvasElement.toDataURL('image/jpeg', 0.85);
        setCapturedImage(base64);
        onCapture(base64);
        stopCamera();
      }
    }
  };

  const switchCamera = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(d => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    setActiveDeviceId(nextDevice.deviceId);
    if (stream) {
      startCamera(nextDevice.deviceId);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    onCapture(null);
    startCamera();
  };

  const cancelWebcam = () => {
    stopCamera();
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const activeLabel = devices.find(d => d.deviceId === activeDeviceId)?.label || "Default Camera";

  return (
    <div className="space-y-2 bg-slate-900/50 border border-white/10 rounded-2xl p-4 transition-all">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-primary" /> {label}
        </span>
        <div className="flex items-center gap-1.5">
          {devices.length > 1 && stream && (
            <button
              type="button"
              onClick={switchCamera}
              className="bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1"
              title={`Switch camera input source (Active: ${activeLabel})`}
            >
              <RefreshCcw className="w-3 h-3 animate-spin duration-1000" /> Switch Cam
            </button>
          )}
          {capturedImage && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
              Captured
            </Badge>
          )}
        </div>
      </div>
      
      {capturedImage ? (
        <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950">
          <img src={capturedImage} alt={label} className="w-full h-36 object-cover" />
          <button 
            type="button" 
            onClick={reset}
            className="absolute bottom-2 right-2 bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 hover:bg-slate-950 transition-all cursor-pointer"
          >
            Retake Photo
          </button>
        </div>
      ) : stream ? (
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-primary/20">
          <video 
            id={`webcam-video-${label}`} 
            autoPlay 
            playsInline 
            className="w-full h-36 object-cover scale-x-[-1]" 
          />
          <canvas id={`webcam-canvas-${label}`} className="hidden" />
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-4">
            <button 
              type="button" 
              onClick={capture}
              className="bg-primary hover:bg-primary/90 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg transition-all cursor-pointer"
            >
              Capture Screen
            </button>
            <button 
              type="button" 
              onClick={cancelWebcam}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="h-36 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 gap-2">
          {error ? (
            <p className="text-[10px] font-bold text-rose-400 px-4 text-center">{error}</p>
          ) : (
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Web Camera is offline</p>
          )}
          <button 
            type="button" 
            onClick={() => startCamera()}
            className="bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <Camera className="w-3 h-3" /> Start Webcam
          </button>
        </div>
      )}
    </div>
  );
};

export default function ClientsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [nic, setNic] = useState('');
  const [firstName, setFirstName] = useState(''); // Mapped to Name with Initials
  const [lastName, setLastName] = useState('.');  // Fallback placeholder to maintain backward compatibility
  const [phone, setPhone] = useState('');         // Mapped to TP
  const [address, setAddress] = useState('');
  const [nicFrontImage, setNicFrontImage] = useState<string | null>(null);
  const [nicBackImage, setNicBackImage] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [activeKycTab, setActiveKycTab] = useState<'nic_front' | 'nic_back' | 'signature'>('nic_front');

  const [branchId, setBranchId] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);

  const loadClients = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setBranchId(user.branchId || 'HQ');
        setUserId(user.id || '');
        setUserRole(user.role || 'TELLER');
      }

      const storedUserParsed = storedUser ? JSON.parse(storedUser) : null;
      const res = await fetch(`/api/clients?branchId=${storedUserParsed?.branchId || ''}&role=${storedUserParsed?.role || ''}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch(err) {
      console.error(err);
      toast.error("Failed to load customer directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('register') === 'true') {
        setIsOpen(true);
        const nicParam = params.get('nic');
        if (nicParam) {
          setNic(nicParam);
        }
      }
    }
  }, []);

  const handleSave = async () => {
    if (!nic || !firstName) {
      toast.error("Missing Information", {
        description: "NIC and Name with Initials are required."
      });
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(editingClient ? "Updating customer profile..." : "Saving customer profile...");

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PATCH' : 'POST';

      // Serialize Front and Back NIC scan base64 frames into a single robust JSON payload string
      const serializedNicImage = JSON.stringify({ front: nicFrontImage, back: nicBackImage });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nic, 
          firstName, // Name with Initials
          lastName: '.',
          phone, 
          address,
          nicImage: serializedNicImage,
          signatureImage,
          branchId, 
          createdByUserId: userId 
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      toast.success(editingClient ? "Customer updated successfully!" : "Customer saved successfully!", { id: toastId });
      
      setIsOpen(false);
      setEditingClient(null);
      setNic(''); setFirstName(''); setPhone(''); setAddress('');
      setNicFrontImage(null); setNicBackImage(null); setSignatureImage(null);
      setActiveKycTab('nic_front');
      await loadClients();
    } catch(err: any) {
      console.error(err);
      toast.error("Error saving customer", {
        description: err.message || "Please check your network connection.",
        id: toastId
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (client: any) => {
    setEditingClient(client);
    setNic(client.nationalId || '');
    setFirstName(client.firstName || '');
    setPhone(client.phone || '');
    setAddress(client.address || '');
    
    let front = null;
    let back = null;
    if (client.nic_image) {
      try {
        const parsed = JSON.parse(client.nic_image);
        front = parsed.front || null;
        back = parsed.back || null;
      } catch (e) {
        front = client.nic_image; // Fallback legacy format support
      }
    }
    setNicFrontImage(front);
    setNicBackImage(back);
    setSignatureImage(client.signature_image || null);
    setActiveKycTab('nic_front');
    setIsOpen(true);
  };

  const handleDelete = async (client: any) => {
    if (!confirm(`Are you sure you want to remove ${client.firstName}?`)) return;

    const toastId = toast.loading("Deleting customer...");
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Customer removed successfully", { id: toastId });
      loadClients();
    } catch (err) {
      toast.error("Could not delete customer", { id: toastId });
    }
  };

  const filteredClients = clients.filter(client => 
    client.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.nationalId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-8 rounded-2xl border-white/40 shadow-2xl gap-6">
        <div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 mb-3 px-3 py-0.5 font-black uppercase tracking-widest text-[10px]">
            <Sparkles className="w-3 h-3 mr-1" /> Customer List
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Our <span className="text-gradient">Customers</span></h1>
          <p className="text-slate-500 font-medium tracking-tight">Manage all customer information for this branch.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 h-14 px-8 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 card-hover w-full md:w-auto shrink-0 transition-all">
          <UserPlus className="h-4 w-4" /> Add New Customer
        </Button>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] md:w-full md:max-w-4xl max-h-[95vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
          <div className="h-2 bg-primary animate-pulse" />
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
                 {editingClient ? <UserCog className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
                 {editingClient ? "Edit Customer Record" : "Register New Customer"}
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                {editingClient ? "Update current customer KYC and profile." : "Enter customer details and capture webcam images for KYC verification."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left Column: Form Inputs */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="nic" className="font-black text-[10px] uppercase tracking-widest text-slate-400">NIC Number (Primary Key)</Label>
                  <Input value={nic} onChange={e=>setNic(e.target.value)} id="nic" placeholder="e.g. 941234567V or 199412345678" className="h-12 bg-white/50 rounded-xl font-mono font-bold text-slate-800" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="firstName" className="font-black text-[10px] uppercase tracking-widest text-slate-400">Name with Initials</Label>
                  <Input value={firstName} onChange={e=>setFirstName(e.target.value)} id="firstName" placeholder="e.g. A.B.C. Perera" className="h-12 bg-white/50 rounded-xl font-bold text-slate-800" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone" className="font-black text-[10px] uppercase tracking-widest text-slate-400">TP (Phone Number)</Label>
                  <Input value={phone} onChange={e=>setPhone(e.target.value)} id="phone" placeholder="e.g. 077 123 4567" className="h-12 bg-white/50 rounded-xl font-mono font-bold text-slate-800" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address" className="font-black text-[10px] uppercase tracking-widest text-slate-400">Address</Label>
                  <textarea 
                    value={address} 
                    onChange={e=>setAddress(e.target.value)} 
                    id="address" 
                    placeholder="Enter customer permanent address..." 
                    className="w-full h-24 p-3 bg-white/50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" 
                  />
                </div>
              </div>

              {/* Right Column: Smart Tabbed Switcher (NIC Front, NIC Back, Signature) */}
              <div className="space-y-4">
                {/* Segmented Control Tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner w-full">
                  <button
                    type="button"
                    onClick={() => setActiveKycTab('nic_front')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeKycTab === 'nic_front'
                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    🪪 NIC Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveKycTab('nic_back')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeKycTab === 'nic_back'
                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    🪪 NIC Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveKycTab('signature')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeKycTab === 'signature'
                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    ✍️ Signature
                  </button>
                </div>

                {/* Webcam capture widget container with autoStart */}
                <div className="min-h-[220px]">
                  {activeKycTab === 'nic_front' && (
                    <WebcamCapture 
                      key="nic_front_capture"
                      label="NIC Front Side Webcam Scan" 
                      onCapture={(base64) => setNicFrontImage(base64)} 
                      initialImage={nicFrontImage} 
                      autoStart={true}
                    />
                  )}

                  {activeKycTab === 'nic_back' && (
                    <WebcamCapture 
                      key="nic_back_capture"
                      label="NIC Back Side Webcam Scan" 
                      onCapture={(base64) => setNicBackImage(base64)} 
                      initialImage={nicBackImage} 
                      autoStart={true}
                    />
                  )}

                  {activeKycTab === 'signature' && (
                    <WebcamCapture 
                      key="signature_capture"
                      label="Signature Web Camera Scan" 
                      onCapture={(base64) => setSignatureImage(base64)} 
                      initialImage={signatureImage} 
                      autoStart={true}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100/50">
              <Button variant="ghost" className="font-bold text-slate-500 h-12 rounded-xl" onClick={() => { setIsOpen(false); setEditingClient(null); }}>Cancel</Button>
              <Button 
                disabled={isSaving}
                onClick={handleSave} 
                className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-primary/20 gap-2 cursor-pointer"
              >
                {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : null}
                {isSaving ? "Saving Record..." : "Register Customer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Directory Controls */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by Name or NIC..." 
            className="pl-12 h-14 bg-white/50 border-white/40 glass focus:ring-primary shadow-lg shadow-slate-200/50 rounded-2xl" 
          />
        </div>
        <Button variant="outline" className="h-14 px-6 border-white/40 glass font-black text-[10px] uppercase tracking-widest text-slate-500 gap-2 rounded-2xl">
           <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      {/* Table Section */}
      <div className="w-full overflow-x-auto glass border-white/40 rounded-[2.5rem] shadow-2xl min-h-[500px] flex flex-col bg-white/40">
        <Table>
          <TableHeader className="bg-slate-50/50 border-b border-slate-100">
            <TableRow>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">NIC Number</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Name & TP</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Address</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Webcam KYC Scans</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Joined Date</TableHead>
              <TableHead className="px-8 py-5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50">
            {loading ? (
               <TableRow><TableCell colSpan={7} className="h-64 text-center font-black text-slate-300 animate-pulse tracking-widest uppercase">Initializing directory metadata...</TableCell></TableRow>
            ) : filteredClients.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-64 text-center">
                    <p className="text-slate-400 font-bold mb-4">No customer fingerprints detected.</p>
                    <Button variant="outline" onClick={() => setIsOpen(true)} className="border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest h-12 rounded-xl hover:bg-primary hover:text-white transition-all px-8">Generate First Entry</Button>
                 </TableCell>
               </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="group hover:bg-primary/5 transition-all duration-300">
                  <TableCell className="px-8 py-6 font-black text-slate-900 group-hover:text-primary transition-colors underline decoration-primary/10 underline-offset-4">{client.nationalId || 'N/A'}</TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 leading-none mb-1">{client.firstName}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{client.phone || 'No Phone'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6 max-w-[200px] truncate text-slate-500 font-bold text-xs">{client.address || 'No Address'}</TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {(() => {
                        let nicFront = null;
                        let nicBack = null;
                        if (client.nic_image) {
                          try {
                            const parsed = JSON.parse(client.nic_image);
                            nicFront = parsed.front || null;
                            nicBack = parsed.back || null;
                          } catch (e) {
                            nicFront = client.nic_image; // Fallback legacy format support
                          }
                        }
                        return (
                          <>
                            {nicFront ? (
                              <div className="relative group/thumb cursor-pointer">
                                <img 
                                  src={nicFront} 
                                  alt="NIC Front" 
                                  className="w-10 h-8 rounded-lg object-cover border border-slate-200 shadow-sm transition-transform group-hover/thumb:scale-150 group-hover/thumb:z-50"
                                />
                                <span className="bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded absolute -bottom-1.5 -right-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">FRONT</span>
                              </div>
                            ) : (
                              <div className="w-10 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-200" title="No NIC Front Scan">
                                <CameraOff className="w-3.5 h-3.5 text-slate-300" />
                              </div>
                            )}

                            {nicBack ? (
                              <div className="relative group/thumb cursor-pointer">
                                <img 
                                  src={nicBack} 
                                  alt="NIC Back" 
                                  className="w-10 h-8 rounded-lg object-cover border border-slate-200 shadow-sm transition-transform group-hover/thumb:scale-150 group-hover/thumb:z-50"
                                />
                                <span className="bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded absolute -bottom-1.5 -right-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">BACK</span>
                              </div>
                            ) : (
                              <div className="w-10 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-200" title="No NIC Back Scan">
                                <CameraOff className="w-3.5 h-3.5 text-slate-300" />
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {client.signature_image ? (
                        <div className="relative group/thumb cursor-pointer">
                          <img 
                            src={client.signature_image} 
                            alt="Signature Preview" 
                            className="w-10 h-8 rounded-lg object-cover border border-slate-200 shadow-sm transition-transform group-hover/thumb:scale-150 group-hover/thumb:z-50"
                          />
                          <span className="bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded absolute -bottom-1.5 -right-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">SIG</span>
                        </div>
                      ) : (
                        <div className="w-10 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-200" title="No Signature Webcam Scan">
                          <CameraOff className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    {(() => {
                      let hasFront = false;
                      let hasBack = false;
                      if (client.nic_image) {
                        try {
                          const parsed = JSON.parse(client.nic_image);
                          hasFront = !!parsed.front;
                          hasBack = !!parsed.back;
                        } catch (e) {
                          hasFront = true; // Legacy fallback is marked complete
                          hasBack = true;
                        }
                      }
                      const kycComplete = hasFront && hasBack && !!client.signature_image;
                      return (
                        <Badge className={`border font-black text-[9px] uppercase tracking-widest px-3 ${
                          kycComplete
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {kycComplete ? 'KYC Verified' : 'Pending KYC'}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="px-8 py-6 text-slate-500 font-bold text-xs uppercase tracking-widest">
                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="text-slate-300 hover:text-primary hover:bg-primary/10 transition-all h-10 w-10 rounded-xl inline-flex items-center justify-center border-none bg-transparent cursor-pointer outline-none">
                         <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 glass p-2 rounded-2xl border-white/40 shadow-2xl">
                        <div className="px-4 py-2 font-black text-[9px] uppercase tracking-widest text-slate-400">Operations</div>
                        <DropdownMenuSeparator className="bg-slate-100/50" />
                        <DropdownMenuItem onClick={() => openEditDialog(client)} className="gap-3 px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer outline-none">
                          <Pencil className="w-4 h-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(client)} className="gap-3 px-4 py-3 rounded-xl font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" /> Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
