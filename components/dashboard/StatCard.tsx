import { ReactNode } from "react";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: Props) {
  return (
    <div className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">

      <div className="flex justify-between">

        <div>

          <p className="text-slate-500 text-sm font-medium">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mt-3">
            {value}
          </h2>

          {subtitle && (
            <p className="text-sm text-emerald-600 mt-3">
              {subtitle}
            </p>
          )}

        </div>

        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-yellow-400 transition">

            {icon}

          </div>
        )}

      </div>

    </div>
  );
}