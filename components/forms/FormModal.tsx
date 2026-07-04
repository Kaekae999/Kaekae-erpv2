"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function FormModal({
  open,
  title,
  children,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 md:p-6">
      <button
        type="button"
        aria-label="Tutup modal"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-bold truncate">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
