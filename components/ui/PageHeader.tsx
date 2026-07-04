import { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-500 mt-2">{description}</p>
      </div>

      {action}
    </div>
  );
}