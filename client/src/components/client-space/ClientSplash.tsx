import { Loader2 } from "lucide-react";

export default function ClientSplash({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#172033]">
      <div className="flex flex-col items-center gap-4">
        <div className="brand-mark">
          <span className="text-sm font-bold">SC</span>
        </div>
        <Loader2 size={18} className="animate-spin text-white/60" />
        <p className="text-sm text-white/60">{label}</p>
      </div>
    </div>
  );
}
