import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base = "w-full rounded-xl border border-line bg-white px-3.5 text-sm placeholder:text-faint transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:bg-canvas disabled:text-mute";
const err = "border-danger focus:border-danger focus:ring-danger/15";

function Wrap({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

type Extra = { label: string; error?: string };

export function Input({ label, error, className, id, ...p }: InputHTMLAttributes<HTMLInputElement> & Extra) {
  const uid = useId(); const i = id ?? uid;
  return <Wrap label={label} error={error} htmlFor={i}><input id={i} className={cn(base, "h-11", error && err, className)} {...p} /></Wrap>;
}

export function Select({ label, error, className, id, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & Extra) {
  const uid = useId(); const i = id ?? uid;
  return <Wrap label={label} error={error} htmlFor={i}><select id={i} className={cn(base, "h-11", error && err, className)} {...p}>{children}</select></Wrap>;
}

export function Textarea({ label, error, className, id, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & Extra) {
  const uid = useId(); const i = id ?? uid;
  return <Wrap label={label} error={error} htmlFor={i}><textarea id={i} rows={3} className={cn(base, "py-3", error && err, className)} {...p} /></Wrap>;
}
