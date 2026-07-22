"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Eye, Download, Printer, X } from "lucide-react";

export default function InvoicePage() {
  const { workspace, company, companies } = useWorkspace();

  const [sales, setSales] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const activeCompanyName =
    companies.find((item) => item.id === company)?.name || "Perusahaan";

  useEffect(() => {
    loadData();
    setSelected(null);
  }, [workspace, company]);

  async function loadData() {
    if (!company) {
      setSales([]);
      setBankAccounts([]);
      return;
    }

    let bankQuery = supabase
      .from("bank_accounts")
      .select("*")
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .limit(2);

    if (workspace !== "all") {
      bankQuery = bankQuery.or(
        `business_type_id.eq.${workspace},business_type_id.is.null`
      );
    }

    const bankResult = await bankQuery;

    const salesResult = await supabase
      .from("sales_headers")
      .select(`
        id,
        company_id,
        transaction_number,
        transaction_date,
        payment_status,
        status,
        goods_amount,
        subtotal_amount,
        discount_amount,
        tax_percent,
        tax_amount,
        grand_total,
        total_amount,
        gross_profit,
        companies(
          id,
          code,
          name,
          tagline,
          address,
          city,
          phone,
          email,
          tax_number,
          registration_number,
          logo_url,
          footer_text
        ),
        customers(
          name,
          address,
          phone
        ),
        sales_details(
          qty,
          price,
          subtotal,
          discount_amount,
          unit_name,
          products(
            code,
            name,
            business_type_id
          )
        )
      `)
      .eq("company_id", company)
      .neq("status", "CANCELLED")
      .order("transaction_date", { ascending: false });

    if (salesResult.error) {
      console.error("Gagal mengambil invoice:", salesResult.error.message);
      return;
    }

    let rows = salesResult.data || [];

    if (workspace !== "all") {
      rows = rows.filter((sale: any) =>
        sale.sales_details?.some(
          (detail: any) =>
            detail.products?.business_type_id === workspace
        )
      );
    }

    setBankAccounts(bankResult.data || []);
    setSales(rows);
  }

  function printInvoice() {
    window.print();
  }

  async function downloadPdf() {
    if (!selected) return;

    const invoiceElement = document.getElementById("invoice-document");

    if (!invoiceElement) {
      alert("Area invoice tidak ditemukan.");
      return;
    }

    setIsDownloading(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: invoiceElement.scrollWidth,
        windowHeight: invoiceElement.scrollHeight,
      });

      const imageData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;

      // Paksa invoice compact agar masuk 1 halaman A4.
      if (imageHeight <= usableHeight + 40) {
        pdf.addImage(
          imageData,
          "JPEG",
          margin,
          margin,
          usableWidth,
          Math.min(imageHeight, usableHeight)
        );

        pdf.save(`INV-${selected.transaction_number}.pdf`);
        return;
      }

      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(
        imageData,
        "JPEG",
        margin,
        position,
        usableWidth,
        imageHeight
      );

      heightLeft -= usableHeight;

      // Toleransi 15 mm untuk mencegah halaman tambahan yang hanya berisi sedikit sisa footer.
      while (heightLeft > 15) {
        position = margin - (imageHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(
          imageData,
          "JPEG",
          margin,
          position,
          usableWidth,
          imageHeight
        );
        heightLeft -= usableHeight;
      }

      pdf.save(`INV-${selected.transaction_number}.pdf`);
    } catch (error) {
      console.error("Gagal download PDF:", error);
      alert(
        "Gagal download PDF. Pastikan paket jspdf dan html2canvas-pro sudah terinstall, lalu cek Console browser."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  function formatRupiah(value: any) {
    return Math.round(Number(value || 0)).toLocaleString("id-ID");
  }

  function getPaymentImage(index: number) {
    if (index === 0) return "/payment/bima.png";
    if (index === 1) return "/payment/livin.png";
    return "";
  }

  function getPaymentLabel(index: number) {
    if (index === 0) return "QR Bima";
    if (index === 1) return "QR Livin";
    return "QR Pembayaran";
  }

  function getSubtotalBarang(sale: any) {
    if (sale?.subtotal_amount !== null && sale?.subtotal_amount !== undefined) {
      return Number(sale.subtotal_amount || 0);
    }

    if (sale?.goods_amount !== null && sale?.goods_amount !== undefined) {
      return Number(sale.goods_amount || 0);
    }

    return (sale?.sales_details || []).reduce(
      (sum: number, detail: any) =>
        sum + Number(detail.subtotal || 0),
      0
    );
  }

  function getDiscountAmount(sale: any) {
    return Number(sale?.discount_amount || 0);
  }

  function getTaxPercent(sale: any) {
    return Number(sale?.tax_percent || 0);
  }

  function getTaxAmount(sale: any) {
    return Number(sale?.tax_amount || 0);
  }

  function getGrandTotal(sale: any) {
    if (sale?.grand_total !== null && sale?.grand_total !== undefined) {
      return Number(sale.grand_total || 0);
    }

    return Number(sale?.total_amount || 0);
  }

  function terbilang(nilai: number) {
    const angka = [
      "",
      "Satu",
      "Dua",
      "Tiga",
      "Empat",
      "Lima",
      "Enam",
      "Tujuh",
      "Delapan",
      "Sembilan",
      "Sepuluh",
      "Sebelas",
    ];

    function baca(n: number): string {
      n = Math.floor(n);

      if (n < 12) return angka[n];

      if (n < 20) {
        return baca(n - 10) + " Belas";
      }

      if (n < 100) {
        return baca(Math.floor(n / 10)) +
          " Puluh " +
          baca(n % 10);
      }

      if (n < 200) {
        return "Seratus " + baca(n - 100);
      }

      if (n < 1000) {
        return baca(Math.floor(n / 100)) +
          " Ratus " +
          baca(n % 100);
      }

      if (n < 2000) {
        return "Seribu " + baca(n - 1000);
      }

      if (n < 1000000) {
        return baca(Math.floor(n / 1000)) +
          " Ribu " +
          baca(n % 1000);
      }

      if (n < 1000000000) {
        return baca(Math.floor(n / 1000000)) +
          " Juta " +
          baca(n % 1000000);
      }

      if (n < 1000000000000) {
        return baca(Math.floor(n / 1000000000)) +
          " Miliar " +
          baca(n % 1000000000);
      }

      return (
        baca(Math.floor(n / 1000000000000)) +
        " Triliun " +
        baca(n % 1000000000000)
      );
    }

    const nilaiBulat = Math.round(Number(nilai || 0));

    if (nilaiBulat === 0) {
      return "Nol Rupiah";
    }

    return `${baca(nilaiBulat)
      .replace(/\s+/g, " ")
      .trim()} Rupiah`;
  }

  return (
    <Layout>
      <PageHeader
        title="Invoice Center"
        description={`Preview dan cetak invoice penjualan ${activeCompanyName}.`}
        action={
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-semibold">
            {activeCompanyName}
          </div>
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b">
          <h2 className="font-bold text-lg">
            Daftar Invoice
          </h2>
        </div>

        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">
                No Invoice
              </th>

              <th className="p-3 text-left">
                Tanggal
              </th>

              <th className="p-3 text-left">
                Perusahaan
              </th>

              <th className="p-3 text-left">
                Customer
              </th>

              <th className="p-3 text-right">
                Total
              </th>

              <th className="p-3 text-center">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {sales.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="p-4 font-semibold">
                  INV-{item.transaction_number}
                </td>

                <td className="p-3">
                  {item.transaction_date}
                </td>

                <td className="p-3">
                  {item.companies?.name || "-"}
                </td>

                <td className="p-3">
                  {item.customers?.name || "-"}
                </td>

                <td className="p-4 text-right font-bold">
                  Rp {formatRupiah(getGrandTotal(item))}
                </td>

                <td className="p-3 text-center">
                  <Button onClick={() => setSelected(item)}>
                    <Eye size={18} />
                    Preview
                  </Button>
                </td>
              </tr>
            ))}

            {sales.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-slate-500"
                >
                  Belum ada invoice untuk perusahaan dan workspace ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-6 print:static print:bg-white print:p-0">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-auto print:max-h-none print:rounded-none print:w-full">

            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
              <h2 className="text-xl font-bold">
                Preview Invoice
              </h2>

              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button onClick={downloadPdf} disabled={isDownloading}>
                  <Download size={18} />
                  {isDownloading ? "Membuat PDF..." : "Download PDF"}
                </Button>

                <Button onClick={printInvoice}>
                  <Printer size={18} />
                  Print
                </Button>

                <button
                  onClick={() => setSelected(null)}
                  className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              id="invoice-document"
              className="relative w-[794px] min-h-[1123px] mx-auto bg-white text-slate-800 overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-5 bg-emerald-900" />

              {(selected?.companies?.logo_url ||
                selected?.companies?.name
                  ?.toUpperCase()
                  .includes("KUSUMO BOGA")) && (
                <img
                  src={
                    selected?.companies?.name
                      ?.toUpperCase()
                      .includes("KUSUMO BOGA")
                      ? "/logo/kusumo-boga.jpg"
                      : selected?.companies?.logo_url
                  }
                  alt=""
                  className="absolute left-1/2 top-[430px] h-[420px] w-[420px] -translate-x-1/2 object-contain opacity-[0.025] pointer-events-none"
                />
              )}

              <div className="relative p-10 pt-12">
                {/* HEADER */}
                <div className="flex items-start justify-between gap-8">
                  <div className="flex items-center gap-5">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden">
                      <img
                        src={
                          selected?.companies?.name
                            ?.toUpperCase()
                            .includes("KUSUMO BOGA")
                            ? "/logo/kusumo-boga.jpg"
                            : selected?.companies?.logo_url ||
                              "/logo/kaekae.png"
                        }
                        alt={`Logo ${selected?.companies?.name || "Perusahaan"}`}
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div>
                      <h1 className="text-[28px] font-black leading-none tracking-wide text-emerald-900">
                        {selected?.companies?.name || "Perusahaan"}
                      </h1>

                      <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.18em] text-amber-600">
                        {selected?.companies?.tagline ||
                          "Premium Business Partner"}
                      </p>
                    </div>
                  </div>

                  <div className="max-w-[360px] text-right">
                    <h2 className="text-[42px] font-black leading-none tracking-tight text-emerald-900">
                      INVOICE
                    </h2>

                    <p className="mt-5 text-[12px] font-semibold italic text-slate-500">
                      {selected?.companies?.address || "-"}
                      {selected?.companies?.city
                        ? `, ${selected.companies.city}`
                        : ""}
                    </p>

                    <p className="mt-1 text-[12px] text-slate-500">
                      {selected?.companies?.phone || "-"} |{" "}
                      {selected?.companies?.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-7 h-[3px] bg-gradient-to-r from-emerald-900 via-amber-500 to-emerald-900" />

                {/* INFORMASI */}
                <div className="mt-8">
                  <div>
                    <div className="bg-emerald-900 px-4 py-2 font-black uppercase tracking-wide text-white">
                      Detail Invoice
                    </div>

                    <div className="bg-amber-50 px-4 py-4 text-[13px]">
                      <div className="mb-2 grid grid-cols-[105px_1fr] gap-2">
                        <span className="font-bold text-slate-500">
                          No. Invoice
                        </span>
                        <span className="font-semibold">
                          INV-{selected.transaction_number}
                        </span>
                      </div>

                      <div className="mb-2 grid grid-cols-[105px_1fr] gap-2">
                        <span className="font-bold text-slate-500">
                          Tanggal
                        </span>
                        <span>{selected.transaction_date}</span>
                      </div>


                    </div>
                  </div>

                  <div>
                    <div className="bg-emerald-900 px-4 py-2 font-black uppercase tracking-wide text-white">
                      Tagihan Kepada
                    </div>

                    <div className="bg-amber-50 px-4 py-4 text-[13px]">
                      <div className="mb-2 grid grid-cols-[80px_1fr] gap-2">
                        <span className="font-bold text-slate-500">Nama</span>
                        <span className="font-semibold">
                          {selected.customers?.name || "-"}
                        </span>
                      </div>

                      <div className="mb-2 grid grid-cols-[80px_1fr] gap-2">
                        <span className="font-bold text-slate-500">Alamat</span>
                        <span>{selected.customers?.address || "-"}</span>
                      </div>

                      <div className="grid grid-cols-[80px_1fr] gap-2">
                        <span className="font-bold text-slate-500">Telepon</span>
                        <span>{selected.customers?.phone || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABEL BARANG */}
                <div className="mt-9 overflow-hidden border border-slate-200">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-emerald-900 text-white">
                        <th className="w-12 p-3 text-center">NO</th>
                        <th className="p-3 text-left">
                          DESKRIPSI BARANG / JASA
                        </th>
                        <th className="w-20 p-3 text-right">QTY</th>
                        <th className="w-20 p-3 text-center">SATUAN</th>
                        <th className="w-32 p-3 text-right">HARGA SATUAN</th>
                        <th className="w-32 p-3 text-right">JUMLAH</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selected.sales_details?.map(
                        (detail: any, index: number) => (
                          <tr
                            key={index}
                            className="border-b border-slate-200 last:border-b-0"
                          >
                            <td className="p-3 text-center">{index + 1}</td>

                            <td className="bg-amber-50 p-3">
                              <p className="font-bold">
                                {detail.products?.name || "-"}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500">
                                {detail.products?.code || "-"}
                              </p>
                            </td>

                            <td className="p-3 text-right">
                              {Number(detail.qty || 0).toLocaleString("id-ID")}
                            </td>

                            <td className="p-3 text-center">
                              {detail.unit_name || "-"}
                            </td>

                            <td className="p-3 text-right">
                              Rp {formatRupiah(detail.price)}
                            </td>

                            <td className="bg-emerald-50 p-3 text-right font-bold">
                              Rp {formatRupiah(detail.subtotal)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* CATATAN DAN TOTAL */}
                <div className="mt-8 grid grid-cols-2 gap-8">
                  <div>
                    <div className="min-h-[145px] border border-amber-100 bg-amber-50 p-4">
                      <p className="font-black uppercase text-emerald-900">
                        Catatan
                      </p>

                      <p className="mt-3 text-[12px] italic leading-relaxed text-slate-600">
                        {selected?.companies?.footer_text ||
                          "Terima kasih atas kepercayaan Anda kepada kami."}
                      </p>
                    </div>

                    <div className="mt-5 border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Terbilang
                      </p>

                      <p className="mt-2 text-[12px] font-bold leading-relaxed">
                        {terbilang(getGrandTotal(selected))}
                      </p>
                    </div>
                  </div>

                  <div className="text-[13px]">
                    <div className="flex items-center justify-between border-b border-slate-200 py-2">
                      <span className="font-semibold text-slate-600">
                        Subtotal
                      </span>
                      <span className="font-bold">
                        Rp {formatRupiah(getSubtotalBarang(selected))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 py-2">
                      <span className="font-semibold text-slate-600">
                        Diskon
                      </span>
                      <span className="font-bold">
                        Rp {formatRupiah(getDiscountAmount(selected))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 py-2">
                      <span className="font-semibold text-slate-600">
                        Pajak
                        {getTaxPercent(selected) > 0
                          ? ` (${getTaxPercent(selected)}%)`
                          : ""}
                      </span>
                      <span className="font-bold">
                        Rp {formatRupiah(getTaxAmount(selected))}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between bg-amber-500 px-4 py-3 text-[17px] font-black text-white">
                      <span>TOTAL</span>
                      <span>Rp {formatRupiah(getGrandTotal(selected))}</span>
                    </div>

                    <div className="flex items-center justify-between bg-emerald-900 px-4 py-3 text-[17px] font-black text-white">
                      <span>SISA TAGIHAN</span>
                      <span>Rp {formatRupiah(getGrandTotal(selected))}</span>
                    </div>
                  </div>
                </div>

                {/* INFORMASI PEMBAYARAN */}
                <div className="mt-8 grid grid-cols-2 gap-8">
                  <div>
                    <div className="bg-emerald-900 px-4 py-2 font-black uppercase tracking-wide text-white">
                      Informasi Pembayaran
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-amber-50 p-4 text-[13px]">
                      {bankAccounts.length > 0 ? (
                        bankAccounts.slice(0, 2).map((bank) => (
                          <div
                            key={bank.id}
                            className="mb-4 last:mb-0"
                          >
                            <div className="mb-2 grid grid-cols-[105px_1fr] gap-2">
                              <span className="font-bold text-slate-500">
                                Bank
                              </span>
                              <span>{bank.bank_name || "-"}</span>
                            </div>

                            <div className="mb-2 grid grid-cols-[105px_1fr] gap-2">
                              <span className="font-bold text-slate-500">
                                No. Rekening
                              </span>
                              <span>{bank.account_number || "-"}</span>
                            </div>

                            <div className="grid grid-cols-[105px_1fr] gap-2">
                              <span className="font-bold text-slate-500">
                                Atas Nama
                              </span>
                              <span>{bank.account_name || "-"}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500">
                          Belum ada rekening bank aktif.
                        </p>
                      )}
                    </div>
                  </div>


                </div>

                {/* FOOTER */}
                <div className="mt-9 border-t-4 border-amber-500 bg-emerald-50 px-5 py-3 text-center text-[10px] italic text-slate-600">
                  Barang yang telah diterima dengan baik menjadi tanggung jawab
                  pelanggan. Mohon simpan invoice ini sebagai bukti transaksi.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}