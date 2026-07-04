import { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => ReactNode;
  className?: string;
  type?: "text" | "number" | "currency";
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

function formatNumber(value: unknown) {
  const number = Number(value ?? 0);
  return number.toLocaleString("id-ID");
}

function formatValue<T>(column: Column<T>, value: T[keyof T], row: T) {
  if (column.render) return column.render(value, row);
  if (column.type === "currency") return `Rp ${formatNumber(value)}`;
  if (column.type === "number") return formatNumber(value);
  return String(value ?? "");
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
}: Props<T>) {
  const showActions = Boolean(onEdit || onDelete);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.accessor)}
                  className={`p-4 text-left text-sm font-bold text-slate-700 whitespace-nowrap ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}

              {showActions && (
                <th className="p-4 text-left text-sm font-bold text-slate-700 w-32 whitespace-nowrap">
                  Aksi
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t hover:bg-slate-50 transition">
                {columns.map((column) => (
                  <td
                    key={String(column.accessor)}
                    className={`p-4 text-sm text-slate-700 align-top ${column.className ?? ""}`}
                  >
                    {formatValue(column, row[column.accessor], row)}
                  </td>
                ))}

                {showActions && (
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                        >
                          <Pencil size={18} />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="p-8 text-center text-slate-500"
                >
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
