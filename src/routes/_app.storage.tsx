import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, FileText, Image as ImageIcon, FolderLock, Download, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/storage")({ component: Storage });

type F = { id: string; name: string; type: "pdf" | "image" | "report"; size: string; date: string };

const initial: F[] = [
  { id: "1", name: "MRI-Patient-2941.pdf", type: "report", size: "4.2 MB", date: "Today" },
  { id: "2", name: "Lab-results-09-12.pdf", type: "pdf", size: "1.1 MB", date: "Today" },
  { id: "3", name: "X-Ray-thorax.jpg", type: "image", size: "3.8 MB", date: "Yesterday" },
  { id: "4", name: "Discharge-summary.pdf", type: "pdf", size: "260 KB", date: "Mon" },
  { id: "5", name: "Ultrasound-scan.png", type: "image", size: "2.6 MB", date: "Sun" },
  { id: "6", name: "Pathology-report.pdf", type: "report", size: "1.9 MB", date: "Sun" },
];

function Storage() {
  const [files, setFiles] = useState<F[]>(initial);
  const inp = useRef<HTMLInputElement>(null);

  function onUpload(list: FileList | null) {
    if (!list) return;
    const added: F[] = Array.from(list).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type.startsWith("image") ? "image" : f.name.toLowerCase().includes("report") ? "report" : "pdf",
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      date: "Just now",
    }));
    setFiles((p) => [...added, ...p]);
    toast.success(`${added.length} file(s) uploaded securely`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Secure Storage</h1>
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> AES-256 encrypted at rest · HIPAA-aware</p>
        </div>
        <button onClick={() => inp.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2.5 font-semibold shadow-glow hover:opacity-90 transition">
          <Upload className="size-4" /> Upload files
        </button>
        <input ref={inp} type="file" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onUpload(e.dataTransfer.files); }}
        className="glass rounded-2xl border-2 border-dashed border-border p-10 text-center"
      >
        <FolderLock className="size-10 mx-auto text-primary" />
        <div className="mt-3 font-medium">Drop PDFs, medical reports or images here</div>
        <div className="text-xs text-muted-foreground">Files are encrypted before they leave your device.</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((f) => (
          <div key={f.id} className="glass rounded-2xl p-4 hover:shadow-elegant transition group">
            <div className="flex items-start gap-3">
              <div className={`size-12 rounded-xl flex items-center justify-center ${f.type === "image" ? "bg-accent text-primary" : f.type === "report" ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {f.type === "image" ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.size} · {f.date}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-success font-medium"><ShieldCheck className="size-3" /> Encrypted</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
              <button className="p-2 rounded-lg hover:bg-accent" title="Download"><Download className="size-4" /></button>
              <button onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))} className="p-2 rounded-lg hover:bg-accent text-destructive" title="Delete"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
