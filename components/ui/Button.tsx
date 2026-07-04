import { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function Button({ children, className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-slate-950 text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
