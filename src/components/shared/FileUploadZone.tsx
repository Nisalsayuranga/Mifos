"use client";
import { useState, useRef } from "react";
import { Upload, X, FileText, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile { name: string; size: number; type: string; url?: string; file: File; }

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  confidential?: boolean;
  imagePreview?: boolean;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  className?: string;
}

export function FileUploadZone({ accept = "*/*", multiple = true, label = "Drop files here", hint = "or click to browse", confidential = false, imagePreview = false, files, onChange, className }: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (rawFiles: File[]) => {
    const newFiles: UploadedFile[] = rawFiles.map((f) => ({
      name: f.name, size: f.size, type: f.type, file: f,
      url: imagePreview && f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    onChange(multiple ? [...files, ...newFiles] : newFiles);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => addFiles(Array.from(e.target.files || []));
  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <div className={cn("space-y-4", className)}>
      {confidential && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Strictly Confidential.</strong> Documents are encrypted and only accessible to verified PROPIX administrators for listing verification. They will never be publicly shared.
          </p>
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragging ? (confidential ? "border-amber-400 bg-amber-50" : "border-primary bg-primary/5 scale-[1.01]")
                   : (confidential ? "border-slate-200 hover:border-amber-400 hover:bg-amber-50/40" : "border-border hover:border-primary hover:bg-muted/50")
        )}
      >
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleChange} />
        <div className="flex flex-col items-center gap-2">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", confidential ? "bg-amber-100" : "bg-primary/10")}>
            {confidential ? <Lock className="w-6 h-6 text-amber-600" /> : <Upload className="w-6 h-6 text-primary" />}
          </div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
          {accept !== "*/*" && <p className="text-xs text-muted-foreground">{accept.split(",").join(", ")} accepted</p>}
        </div>
      </div>

      {files.length > 0 && (
        <div className={cn("space-y-2", imagePreview && "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3")}>
          {files.map((f, i) => (
            imagePreview && f.url ? (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-2 left-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">Cover</span>}
                <button type="button" onClick={() => remove(i)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl px-4 py-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", confidential ? "bg-amber-100" : "bg-primary/10")}>
                  <FileText className={cn("w-4 h-4", confidential ? "text-amber-600" : "text-primary")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                </div>
                {confidential && <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"><Lock className="w-2.5 h-2.5" />Confidential</span>}
                <button type="button" onClick={() => remove(i)} className="w-6 h-6 hover:bg-red-100 text-muted-foreground hover:text-red-600 rounded-full flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          ))}
          {imagePreview && (
            <button type="button" onClick={() => inputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Upload className="w-5 h-5" />
              <span className="text-xs font-medium">Add More</span>
            </button>
          )}
        </div>
      )}
      {files.length === 0 && !confidential && (
        <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-xs">No files uploaded yet. Listings with more photos get <strong>3x more inquiries</strong>.</p>
        </div>
      )}
    </div>
  );
}
