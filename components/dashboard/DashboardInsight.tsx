interface Props {
  totalModal: number;
  totalGram: number;
  totalBatch: number;
  rataHarga: number;
}

export default function DashboardInsight({
  totalModal,
  totalGram,
  totalBatch,
  rataHarga,
}: Props) {
  return (
    <div className="bg-slate-950 text-white rounded-3xl p-8 mb-8 shadow-xl">
      <p className="text-slate-400 text-sm mb-2">Business Intelligence</p>

      <h2 className="text-3xl font-bold mb-4">
        Selamat datang, Zea 👋
      </h2>

      <p className="text-slate-300 leading-7 max-w-4xl">
        Saat ini terdapat <b className="text-yellow-400">{totalBatch} batch</b>{" "}
        aktif dengan total persediaan{" "}
        <b className="text-yellow-400">
          {totalGram.toLocaleString("id-ID")} gr
        </b>
        . Nilai modal usaha tercatat sebesar{" "}
        <b className="text-yellow-400">
          Rp {totalModal.toLocaleString("id-ID")}
        </b>{" "}
        dengan harga beli rata-rata{" "}
        <b className="text-yellow-400">
          Rp {rataHarga.toLocaleString("id-ID")}
        </b>
        .
      </p>
    </div>
  );
}