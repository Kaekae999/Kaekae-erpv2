interface Props {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function Input({
  label,
  placeholder,
  value,
  onChange,
}: Props) {
  return (
    <div className="space-y-2">

      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-amber-500"
      />

    </div>
  );
}