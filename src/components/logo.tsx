import Link from "next/link";
import { Boxes } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-400 text-slate-950 shadow-lg shadow-sky-400/20"><Boxes size={19} /></span>
      {!compact && <span className="text-lg">Blox<span className="text-sky-400">Search</span></span>}
    </Link>
  );
}
