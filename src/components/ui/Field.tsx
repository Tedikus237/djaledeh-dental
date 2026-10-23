import React from "react";

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input 
        className={`w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black ${error ? 'border-red-500' : ''} ${className || ""}`} 
        {...props} 
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// --- TEXTAREA ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className, ...props }: TextareaProps) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea 
        className={`w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black ${error ? 'border-red-500' : ''} ${className || ""}`} 
        rows={4}
        {...props} 
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// --- SELECT ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Select({ label, hint, error, className, children, ...props }: SelectProps) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select 
        className={`w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black ${error ? 'border-red-500' : ''} ${className || ""}`} 
        {...props}
      >
        {children}
      </select>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// --- LIGNE (pour OngletIdentification) ---
export function Ligne({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || "-"}</span>
    </div>
  );
}