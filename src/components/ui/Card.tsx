import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  accent?: string;
}

export function Card({ title, accent, className, children, ...props }: CardProps) {
  void accent;
  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className || ""}`} {...props}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

// Accepte children, title, eyebrow
export function CardTitle({ children, title, eyebrow, className }: { children?: React.ReactNode, title?: string, eyebrow?: string, className?: string }) {
  return (
    <div className={`mb-2 ${className || ""}`}>
      {eyebrow && <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">{eyebrow}</p>}
      <h3 className="text-lg font-medium text-gray-900">{title || children}</h3>
    </div>
  );
}

// Accepte children, eyebrow, actions
interface PageHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">{eyebrow}</p>}
        {(title || children) && <h1 className="text-3xl font-bold text-gray-900">{title || children}</h1>}
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}