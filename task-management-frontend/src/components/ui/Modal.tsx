import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-fade-slide">
        <div className="border border-[var(--border-hover)] bg-[var(--surface)] shadow-2xl shadow-black/50 rounded-sm overflow-hidden">
          {/* Top accent bar */}
          <div className="h-px bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />
          <div className="px-6 pt-5 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors w-6 h-6 flex items-center justify-center text-xs"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
