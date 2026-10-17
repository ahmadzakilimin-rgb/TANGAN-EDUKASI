import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UsersRound,
  Weight,
} from "lucide-react";
import { Eyebrow, PageHeading } from "./components/SiteLayout.jsx";
import {
  deleteCleanLog,
  getAdminSession,
  getCleanLogs,
  importCleanLogs,
  loginAdmin,
  logoutAdmin,
  saveCleanLog,
} from "./cleanLogsApi.js";
import { contactPhone, images } from "./data.js";

const STORAGE_KEY = "tangan-edukasi-clean-logs-v1";
const MIGRATION_KEY = "tangan-edukasi-clean-logs-migrated-v1";

function localDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function readEntries(value) {
  const entries = JSON.parse(value);
  if (!Array.isArray(entries)) throw new Error("Format catatan clean-up tidak valid.");
  for (const entry of entries) {
    const dateParts = typeof entry?.date === "string" ? entry.date.split("-").map(Number) : [];
    const parsedDate = dateParts.length === 3 ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(entry?.date ?? "") &&
      parsedDate &&
      parsedDate.getFullYear() === dateParts[0] &&
      parsedDate.getMonth() === dateParts[1] - 1 &&
      parsedDate.getDate() === dateParts[2];
    if (
      !entry ||
      typeof entry.id !== "string" ||
      typeof entry.title !== "string" ||
      typeof entry.location !== "string" ||
      !validDate ||
      !Number.isInteger(entry.participants) ||
      entry.participants < 1 ||
      !Number.isFinite(entry.plasticKg) ||
      entry.plasticKg < 0 ||
      !Number.isFinite(entry.otherKg) ||
      entry.otherKg < 0 ||
      !Number.isInteger(entry.bags) ||
      entry.bags < 0 ||
      typeof entry.notes !== "string"
    ) {
      throw new Error("Ada catatan clean-up yang rusak. Data tidak diubah agar catatan tetap aman.");
    }
  }
  return entries;
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);
}

function csvCell(value) {
  const text = String(value);
  const safeText = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function formatEntryDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function makeMonthlyStats(entries) {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((entry) => entry.date.slice(0, 7) === key);
    return {
      key,
      label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date),
      activities: monthEntries.length,
      weight: monthEntries.reduce((total, entry) => total + entry.plasticKg + entry.otherKg, 0),
    };
  });
}

export default function CleanLogPage() {
  const adminRequired = Boolean(import.meta.env.VITE_CLEAN_LOGS_API);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendMode, setBackendMode] = useState("loading");
  const [storageError, setStorageError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [admin, setAdmin] = useState(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [period, setPeriod] = useState("30");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    title: "",
    location: "",
    date: localDateValue(),
    participants: "1",
    plasticKg: "0",
    otherKg: "0",
    bags: "0",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      let adminSession = { authenticated: false, username: "" };
      if (adminRequired) {
        try {
          adminSession = await getAdminSession();
          if (!cancelled) setAdmin(adminSession.authenticated ? adminSession.username : "");
        } catch (error) {
          if (!cancelled) setAdminError(error instanceof Error ? error.message : "Status admin gagal dimuat.");
        }
      }
      let localEntries = [];
      let localError = "";
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        localEntries = saved ? readEntries(saved) : [];
      } catch (error) {
        localError = error instanceof Error ? error.message : "Catatan lokal gagal dibaca.";
      }

      try {
        const migrated = window.localStorage.getItem(MIGRATION_KEY) === "done";
        if (!migrated && localEntries.length > 0 && (!adminRequired || adminSession.authenticated)) {
          await importCleanLogs(localEntries);
          window.localStorage.setItem(MIGRATION_KEY, "done");
        } else if (!migrated && localEntries.length === 0) {
          window.localStorage.setItem(MIGRATION_KEY, "done");
        }
        const serverEntries = await getCleanLogs();
        if (cancelled) return;
        setEntries(serverEntries);
        setBackendMode("server");
        setStorageError(localError);
      } catch (error) {
        if (cancelled) return;
        setEntries(localEntries);
        setBackendMode("local");
        setStorageError([
          `Database belum tersambung: ${error instanceof Error ? error.message : "Terjadi kesalahan API."}`,
          "Catatan baru sementara disimpan hanya di browser ini.",
          localError,
        ].filter(Boolean).join(" "));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadEntries();
    return () => { cancelled = true; };
  }, [adminRequired]);

  const periodEntries = useMemo(() => {
    const cutoff = period === "all" ? "" : localDateValue(new Date(Date.now() - Number(period) * 86_400_000));
    return entries.filter((entry) => !cutoff || entry.date >= cutoff);
  }, [entries, period]);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    return periodEntries
      .filter((entry) => !normalizedQuery || `${entry.title} ${entry.location} ${entry.notes}`.toLocaleLowerCase("id-ID").includes(normalizedQuery))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [periodEntries, query]);

  const stats = useMemo(() => ({
    activities: periodEntries.length,
    participants: periodEntries.reduce((total, entry) => total + entry.participants, 0),
    weight: periodEntries.reduce((total, entry) => total + entry.plasticKg + entry.otherKg, 0),
    bags: periodEntries.reduce((total, entry) => total + entry.bags, 0),
  }), [periodEntries]);
  const monthlyStats = useMemo(() => makeMonthlyStats(entries), [entries]);
  const maxMonthlyWeight = Math.max(1, ...monthlyStats.map((month) => month.weight));

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    setAdminBusy(true);
    setAdminError("");
    try {
      const session = await loginAdmin(adminUsername.trim(), adminPassword);
      setAdmin(session.username);
      setAdminPassword("");
      let migrationError = "";
      try {
        const migrated = window.localStorage.getItem(MIGRATION_KEY) === "done";
        if (!migrated) {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) await importCleanLogs(readEntries(saved));
          window.localStorage.setItem(MIGRATION_KEY, "done");
        }
      } catch (error) {
        migrationError = ` Login admin berhasil, tetapi catatan lokal belum berhasil dipindahkan: ${error instanceof Error ? error.message : "Terjadi kesalahan."}`;
      }
      const serverEntries = await getCleanLogs();
      setEntries(serverEntries);
      setStorageError("");
      setAdminError(migrationError);
      setFeedback("Login admin berhasil. Anda dapat mengelola catatan kegiatan.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Login admin gagal.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleAdminLogout() {
    setAdminBusy(true);
    setAdminError("");
    try {
      await logoutAdmin();
      setAdmin("");
      setFeedback("Anda telah keluar dari akun admin.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Logout admin gagal.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function save(nextEntries, message) {
    if (backendMode === "server") {
      if (adminRequired && !admin) {
        setAdminError("Login sebagai admin untuk mengubah catatan kegiatan.");
        return false;
      }
      try {
        const previousIds = new Set(entries.map((entry) => entry.id));
        const addedEntry = nextEntries.find((entry) => !previousIds.has(entry.id));
        const deletedEntry = entries.find((entry) => !nextEntries.some((item) => item.id === entry.id));
        if (addedEntry) await saveCleanLog(addedEntry);
        else if (deletedEntry) await deleteCleanLog(deletedEntry.id);
        const serverEntries = await getCleanLogs();
        setEntries(serverEntries);
        setStorageError("");
        setFeedback(message);
        return true;
      } catch (error) {
        setStorageError(`Perubahan tidak tersimpan ke database: ${error instanceof Error ? error.message : "Terjadi kesalahan API."}`);
        setFeedback("");
        return false;
      }
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
      setEntries(nextEntries);
      setFeedback(`${message} Data hanya tersimpan di browser ini.`);
      return true;
    } catch (error) {
      setStorageError(error instanceof Error ? `Catatan gagal disimpan: ${error.message}` : "Catatan gagal disimpan.");
      setFeedback("");
      return false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const title = String(formData.get("title")).trim();
    const location = String(formData.get("location")).trim();
    const notes = String(formData.get("notes")).trim();
    const participants = Number(formData.get("participants"));
    const plasticKg = Number(formData.get("plasticKg"));
    const otherKg = Number(formData.get("otherKg"));
    const bags = Number(formData.get("bags"));

    if (!title || !location || !form.date || !Number.isInteger(participants) || participants < 1 || !Number.isFinite(plasticKg) || plasticKg < 0 || !Number.isFinite(otherKg) || otherKg < 0 || !Number.isInteger(bags) || bags < 0) {
      setFeedback("Periksa kembali kolom wajib dan pastikan semua jumlah bernilai valid.");
      return;
    }

    const entry = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      location,
      date: form.date,
      participants,
      plasticKg,
      otherKg,
      bags,
      notes,
    };
    if (!await save([entry, ...entries], backendMode === "server"
      ? "Hasil clean-up berhasil disimpan ke database."
      : "Hasil clean-up berhasil dicatat secara lokal.")) return;
    setForm((current) => ({
      ...current,
      title: "",
      location: "",
      participants: "1",
      plasticKg: "0",
      otherKg: "0",
      bags: "0",
      notes: "",
    }));
  }

  async function deleteEntry(id) {
    await save(entries.filter((entry) => entry.id !== id), backendMode === "server"
      ? "Catatan berhasil dihapus dari database."
      : "Catatan berhasil dihapus.");
  }

  function exportCsv() {
    const headers = ["Tanggal", "Kegiatan", "Lokasi", "Peserta", "Plastik (kg)", "Sampah lain (kg)", "Kantong sampah", "Catatan"];
    const rows = visibleEntries.map((entry) => [
      entry.date,
      entry.title,
      entry.location,
      entry.participants,
      entry.plasticKg,
      entry.otherKg,
      entry.bags,
      entry.notes,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    try {
      const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `hasil-clean-up-${localDateValue()}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback(`${visibleEntries.length} catatan berhasil diekspor ke CSV.`);
    } catch (error) {
      setStorageError(error instanceof Error ? `File CSV gagal dibuat: ${error.message}` : "File CSV gagal dibuat.");
    }
  }

  function exportPdf() {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      setFeedback("Laporan PDF tidak dapat dibuka. Izinkan pop-up untuk situs ini, lalu coba lagi.");
      return;
    }

    reportWindow.opener = null;
    const reportStats = visibleEntries.reduce((total, entry) => ({
      activities: total.activities + 1,
      participants: total.participants + entry.participants,
      plasticKg: total.plasticKg + entry.plasticKg,
      otherKg: total.otherKg + entry.otherKg,
      bags: total.bags + entry.bags,
    }), { activities: 0, participants: 0, plasticKg: 0, otherKg: 0, bags: 0 });
    const periodLabel = period === "all" ? "Semua catatan" : `${period} hari terakhir`;
    const searchLabel = query.trim() ? ` · Pencarian: “${escapeHtml(query.trim())}”` : "";
    const rows = visibleEntries.map((entry) => `
      <tr>
        <td>${escapeHtml(formatEntryDate(entry.date))}</td>
        <td class="activity">${escapeHtml(entry.title)}${entry.notes ? `<span class="detail">${escapeHtml(entry.notes)}</span>` : ""}</td>
        <td>${escapeHtml(entry.location)}</td>
        <td class="number">${formatNumber(entry.participants)}</td>
        <td class="number total">${formatNumber(entry.plasticKg + entry.otherKg)}<span class="detail breakdown">Plastik ${formatNumber(entry.plasticKg)}<br>Lainnya ${formatNumber(entry.otherKg)}</span></td>
        <td class="number">${formatNumber(entry.bags)}</td>
      </tr>
    `).join("");
    const reportHtml = `<!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Laporan Daily Activity - Tangan Edukasi Indonesia</title>
          <style>
            @page { size: 210mm 297mm; margin: 12mm; }
            * { box-sizing: border-box; }
            html { background: #edf1eb; }
            body { margin: 0; color: #252a24; background: #edf1eb; font: 11px/1.45 Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .report { max-width: 186mm; margin: 0 auto; }
            .actions { display: flex; justify-content: flex-end; gap: 8px; margin: 0 0 15px; }
            .actions button { padding: 8px 13px; color: #fff; border: 0; border-radius: 4px; background: #354639; font: 600 11px Arial, sans-serif; cursor: pointer; }
            .actions .close { color: #354639; border: 1px solid #cbd2c6; background: #fff; }
            .letterhead { display: flex; align-items: center; gap: 15px; padding: 13px 17px; color: #fff; border-radius: 5px 5px 0 0; background: #304b38; }
            .brand-logo { width: 48px; height: 48px; flex: 0 0 auto; padding: 4px; border-radius: 4px; background: #fff; object-fit: contain; }
            .brand-copy { min-width: 0; }
            .brand-name { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: .1px; }
            .brand-tagline { margin: 3px 0 0; color: #e0eadb; font-size: 7px; letter-spacing: .25px; }
            .brand-contact { margin-left: auto; text-align: right; color: #f2f6ef; font-size: 8px; line-height: 1.6; }
            .brand-contact strong { display: block; color: #fff; font-size: 8px; }
            .green-rule { height: 4px; background: #a9c881; }
            .report-body { padding: 15px 13px 10px; border: 1px solid #dfe4da; border-top: 0; border-radius: 0 0 5px 5px; background: #fff; }
            .report-title { display: flex; justify-content: space-between; align-items: flex-end; gap: 14px; padding-bottom: 11px; border-bottom: 1px solid #e1e7df; }
            .eyebrow { margin: 0 0 5px; color: #52764e; font-size: 8px; font-weight: 700; letter-spacing: 1.6px; }
            h1 { margin: 0; color: #263b2d; font-size: 20px; letter-spacing: -.45px; }
            .subtitle { margin: 5px 0 0; color: #697167; font-size: 9px; }
            .meta { min-width: 140px; text-align: right; color: #586057; font-size: 8px; }
            .meta strong { display: block; margin-bottom: 4px; color: #304b38; font-size: 9px; }
            .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; margin: 12px 0 14px; }
            .metric { position: relative; overflow: hidden; padding: 8px 10px; border: 1px solid #dfe6d9; border-radius: 4px; background: #f6f9f3; }
            .metric::before { position: absolute; inset: 0 auto 0 0; width: 3px; background: #71915e; content: ""; }
            .metric-label { display: block; color: #687166; font-size: 6.5px; font-weight: 700; letter-spacing: .8px; }
            .metric-value { display: block; margin-top: 3px; color: #304b38; font-size: 16px; font-weight: 700; }
            .metric-value small { font-size: 9px; font-weight: 500; }
            .table-heading { display: flex; justify-content: space-between; align-items: end; margin-bottom: 8px; }
            h2 { margin: 0; color: #304b38; font-size: 12px; }
            .table-heading span { color: #697167; font-size: 7px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            thead { display: table-header-group; }
            th { padding: 7px 4px; color: #fff; border-bottom: 2px solid #9fbd78; background: #354f3c; text-align: left; font-size: 6.5px; letter-spacing: .1px; }
            td { padding: 6px 4px; border-bottom: 1px solid #e3e7df; vertical-align: top; font-size: 7px; overflow-wrap: anywhere; }
            tbody tr:nth-child(even) { background: #f5f8f3; }
            th:nth-child(1) { width: 15%; } th:nth-child(2) { width: 26%; } th:nth-child(3) { width: 18%; }
            th:nth-child(4) { width: 11%; } th:nth-child(5) { width: 18%; } th:nth-child(6) { width: 12%; }
            .number { text-align: right; font-variant-numeric: tabular-nums; }
            .activity { font-weight: 700; }
            .total { color: #354639; font-weight: 700; }
            .detail { display: block; margin-top: 3px; color: #697167; font-size: 6px; font-weight: 400; line-height: 1.35; }
            .breakdown { text-align: right; }
            .empty { padding: 24px; border: 1px dashed #cbd2c6; color: #697167; text-align: center; }
            .footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 13px; padding-top: 8px; border-top: 1px solid #d9ded4; color: #737a70; font-size: 7.5px; }
            .footer strong { color: #52764e; }
            @media print {
              html, body { background: #fff; }
              .actions { display: none; }
              .report { max-width: none; }
              .report-body { padding: 12px 9px 8px; }
              .letterhead { break-inside: avoid; }
              tr { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <main class="report">
            <div class="actions"><button onclick="window.print()">Simpan / Cetak PDF</button><button class="close" onclick="window.close()">Tutup</button></div>
            <header class="letterhead">
              <img class="brand-logo" src="${escapeHtml(images.smallLogo)}" alt="Logo Tangan Edukasi Indonesia">
              <div class="brand-copy"><p class="brand-name">TANGAN EDUKASI INDONESIA</p><p class="brand-tagline">Multi-Sector Collaborative Platform for Public Impact</p></div>
              <div class="brand-contact"><strong>INFORMASI & KOLABORASI</strong>WhatsApp ${escapeHtml(contactPhone)}<br>Indonesia</div>
            </header>
            <div class="green-rule"></div>
            <div class="report-body">
              <section class="report-title">
                <div><p class="eyebrow">LAPORAN KEGIATAN · DAILY ACTIVITY</p><h1>Laporan Hasil Clean-up</h1><p class="subtitle">Ringkasan kegiatan dan dampak aksi lingkungan bersama.</p></div>
                <div class="meta"><strong>Periode: ${escapeHtml(periodLabel)}</strong>${searchLabel ? `<span>${searchLabel.slice(3)}</span><br>` : ""}Dibuat ${escapeHtml(new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date()))}</div>
              </section>
              <section class="summary" aria-label="Ringkasan statistik">
                <div class="metric"><span class="metric-label">KEGIATAN TERCATAT</span><span class="metric-value">${formatNumber(reportStats.activities)}</span></div>
                <div class="metric"><span class="metric-label">TOTAL PARTISIPAN</span><span class="metric-value">${formatNumber(reportStats.participants)} <small>orang</small></span></div>
                <div class="metric"><span class="metric-label">SAMPAH TERKUMPUL</span><span class="metric-value">${formatNumber(reportStats.plasticKg + reportStats.otherKg)} <small>kg</small></span></div>
                <div class="metric"><span class="metric-label">KANTONG TERISI</span><span class="metric-value">${formatNumber(reportStats.bags)}</span></div>
              </section>
              <section>
                <div class="table-heading"><h2>Rincian kegiatan</h2><span>${formatNumber(visibleEntries.length)} catatan · Plastik ${formatNumber(reportStats.plasticKg)} kg · Sampah lain ${formatNumber(reportStats.otherKg)} kg</span></div>
                ${visibleEntries.length ? `<table><thead><tr><th>Tanggal</th><th>Kegiatan &amp; catatan</th><th>Lokasi</th><th class="number">Peserta</th><th class="number">Total &amp; rincian (kg)</th><th class="number">Kantong</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">Tidak ada catatan pada periode atau pencarian yang dipilih.</div>'}
              </section>
              <footer class="footer"><span>Disusun otomatis dari jurnal Daily Activity · <strong>Tangan Edukasi Indonesia</strong></span><span>Dokumen laporan kegiatan · WhatsApp ${escapeHtml(contactPhone)}</span></footer>
            </div>
          </main>
        </body>
      </html>`;

    try {
      reportWindow.document.open();
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
      reportWindow.focus();
      window.setTimeout(() => {
        if (!reportWindow.closed) reportWindow.print();
      }, 400);
      setFeedback("Laporan PDF siap. Pilih “Simpan sebagai PDF” pada dialog cetak.");
    } catch (error) {
      reportWindow.close();
      setStorageError(`Laporan PDF gagal dibuat: ${error instanceof Error ? error.message : "Terjadi kesalahan."}`);
    }
  }

  return (
    <div className="container inner-page-content clean-log-page">
      <PageHeading
        number="04"
        label="DAILY ACTIVITY · TANDU OSOJI"
        title={<>Setiap aksi tercatat.<br /><span>Dampaknya terlihat.</span></>}
        description="Dokumentasikan hasil kegiatan clean-up, pantau perkembangan dampak, dan bagikan laporan aksi bersama."
        icon={Sparkles}
        note="DASHBOARD AKSI BERSAMA"
      />

      <section className="clean-log-dashboard" aria-label="Dashboard hasil clean-up">
        <div className="clean-log-toolbar">
          <div>
            <Eyebrow>RINGKASAN DAMPAK</Eyebrow>
            <p>Angka diperbarui otomatis dari catatan kegiatan tersimpan.</p>
            <span className={`database-status ${backendMode === "server" ? "is-connected" : ""}`} role="status">
              <span aria-hidden="true" /> {backendMode === "loading" ? "Menghubungkan database…" : backendMode === "server" ? "Tersambung ke database bersama" : "Mode penyimpanan browser"}
            </span>
          </div>
          <label className="period-control">Periode
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="7">7 hari terakhir</option>
              <option value="30">30 hari terakhir</option>
              <option value="all">Semua catatan</option>
            </select>
          </label>
        </div>

        <div className="clean-stats-grid">
          <article className="clean-stat-card"><span className="clean-stat-icon"><CalendarDays size={18} /></span><p>KEGIATAN</p><strong>{formatNumber(stats.activities)}</strong><span>aksi tercatat</span></article>
          <article className="clean-stat-card"><span className="clean-stat-icon"><UsersRound size={18} /></span><p>PARTISIPAN</p><strong>{formatNumber(stats.participants)}</strong><span>orang terlibat</span></article>
          <article className="clean-stat-card"><span className="clean-stat-icon"><Weight size={18} /></span><p>SAMPAH TERKUMPUL</p><strong>{formatNumber(stats.weight)} <small>kg</small></strong><span>plastik dan sampah lainnya</span></article>
          <article className="clean-stat-card"><span className="clean-stat-icon"><Sparkles size={18} /></span><p>KANTONG TERISI</p><strong>{formatNumber(stats.bags)}</strong><span>kantong sampah</span></article>
        </div>

        <section className="clean-chart-card">
          <div className="clean-card-heading"><div><Eyebrow>PERKEMBANGAN 6 BULAN</Eyebrow><h2>Bergerak, bulan demi bulan.</h2></div><span>KG SAMPAH TERKUMPUL</span></div>
          <div className="clean-chart" role="img" aria-label="Grafik berat sampah terkumpul dalam enam bulan terakhir">
            {monthlyStats.map((month) => (
              <div className="clean-chart-column" key={month.key} title={`${month.label}: ${formatNumber(month.weight)} kg dari ${month.activities} kegiatan`}>
                <span className="clean-chart-value">{formatNumber(month.weight)}</span>
                <div className="clean-chart-track"><span style={{ height: `${month.weight === 0 ? 3 : Math.max(8, (month.weight / maxMonthlyWeight) * 100)}%` }} /></div>
                <span className="clean-chart-label">{month.label}</span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <div className="clean-log-columns">
        <section className="clean-form-card">
          <div className="clean-card-heading"><div><Eyebrow>{adminRequired ? "AKSES ADMIN" : "CATAT HASIL BARU"}</Eyebrow><h2>{adminRequired && !admin ? "Login admin." : adminRequired ? "Admin aktif." : "Tambah kegiatan."}</h2></div><span className="clean-form-mark"><Plus size={19} /></span></div>
          {adminRequired && (admin ? (
            <div className="admin-session">
              <span>Masuk sebagai <strong>{admin}</strong></span>
              <button className="clean-export-button" type="button" onClick={handleAdminLogout} disabled={adminBusy}>Keluar</button>
            </div>
          ) : (
            <form className="clean-log-form admin-login-form" onSubmit={handleAdminLogin}>
              <label>Username admin<input autoComplete="username" value={adminUsername} onChange={(event) => setAdminUsername(event.target.value)} required maxLength={100} /></label>
              <label>Password admin<input type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required maxLength={256} /></label>
              <button className="button button-dark clean-submit-button" type="submit" disabled={adminBusy}>{adminBusy ? "Memeriksa…" : "Masuk sebagai admin"}</button>
            </form>
          ))}
          {adminError && <p className="clean-feedback is-error" role="alert">{adminError}</p>}
          {storageError && <p className="clean-feedback is-error" role="alert">{storageError}</p>}
          {feedback && <p className={`clean-feedback ${feedback.includes("valid") ? "is-error" : ""}`} role="status">{feedback}</p>}
          {(!adminRequired || (admin && backendMode === "server")) && <form className="clean-log-form" onSubmit={handleSubmit}>
            <label>Nama kegiatan<input name="title" value={form.title} onChange={updateForm} placeholder="Contoh: Tandu Osoji di taman kota" required maxLength={100} /></label>
            <div className="clean-form-row">
              <label>Lokasi kegiatan<input name="location" value={form.location} onChange={updateForm} placeholder="Kecamatan / kota" required maxLength={100} /></label>
              <label>Tanggal<input name="date" type="date" value={form.date} onChange={updateForm} max={localDateValue()} required /></label>
            </div>
            <div className="clean-form-row clean-number-row">
              <label>Partisipan<input name="participants" type="number" value={form.participants} onChange={updateForm} min="1" max="4294967295" step="1" required /></label>
              <label>Plastik (kg)<input name="plasticKg" type="number" value={form.plasticKg} onChange={updateForm} min="0" max="999999999.9" step="0.1" required /></label>
              <label>Sampah lain (kg)<input name="otherKg" type="number" value={form.otherKg} onChange={updateForm} min="0" max="999999999.9" step="0.1" required /></label>
            </div>
            <div className="clean-form-row">
              <label>Kantong sampah<input name="bags" type="number" value={form.bags} onChange={updateForm} min="0" max="4294967295" step="1" required /></label>
              <label>Catatan tambahan<input name="notes" value={form.notes} onChange={updateForm} placeholder="Opsional: pemilahan, mitra, dll." maxLength={300} /></label>
            </div>
            <button className="button button-dark clean-submit-button" type="submit" disabled={isLoading}><Plus size={16} /> Simpan hasil aksi</button>
            <p className="clean-storage-note">{backendMode === "server" ? "Catatan tersimpan di database bersama dan tersedia lintas perangkat." : "Catatan tersimpan hanya di browser perangkat ini sampai backend database tersambung."}</p>
          </form>}
        </section>

        <section className="clean-entries-card">
          <div className="clean-card-heading"><div><Eyebrow>JURNAL KEGIATAN</Eyebrow><h2>Jejak aksi.</h2></div><div className="clean-export-actions"><button className="clean-export-button" type="button" onClick={exportPdf} disabled={isLoading}><Download size={15} /> Unduh PDF</button><button className="clean-export-button" type="button" onClick={exportCsv} disabled={visibleEntries.length === 0}><Download size={15} /> Ekspor CSV</button></div></div>
          <div className="clean-entry-filters">
            <label className="clean-search"><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kegiatan atau lokasi" aria-label="Cari kegiatan atau lokasi" /></label>
            <span>{visibleEntries.length} catatan</span>
          </div>
          {isLoading ? <p className="clean-empty-state">Memuat catatan tersimpan…</p> : visibleEntries.length === 0 ? (
            <div className="clean-empty-state"><Sparkles size={25} /><strong>Belum ada catatan di periode ini.</strong><span>Tambahkan kegiatan pertama untuk mulai membangun statistik dampak.</span></div>
          ) : (
            <div className="clean-entry-list">
              {visibleEntries.map((entry) => (
                <article className="clean-entry" key={entry.id}>
                  <div className="clean-entry-date">{new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${entry.date}T00:00:00`))}</div>
                  <div className="clean-entry-content">
                    <h3>{entry.title}</h3>
                    <p><MapPin size={13} aria-hidden="true" /> {entry.location} <span>·</span> {formatNumber(entry.participants)} partisipan</p>
                    <div className="clean-entry-metrics"><span>{formatNumber(entry.plasticKg + entry.otherKg)} kg terkumpul</span><span>{formatNumber(entry.bags)} kantong</span></div>
                    {entry.notes && <p className="clean-entry-notes">{entry.notes}</p>}
                  </div>
                  {(!adminRequired || (admin && backendMode === "server")) && <button className="clean-delete-button" type="button" aria-label={`Hapus catatan ${entry.title}`} title="Hapus catatan" onClick={() => deleteEntry(entry.id)}><Trash2 size={15} /></button>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
