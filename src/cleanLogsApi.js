const API_URL = import.meta.env.VITE_CLEAN_LOGS_API || `${import.meta.env.BASE_URL}api/clean-logs.php`;
const ADMIN_API_URL = import.meta.env.VITE_CLEAN_LOGS_API ? "/api/admin-session" : "";

async function request(options = {}) {
  let response;
  const { url = API_URL, ...fetchOptions } = options;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(`API tidak dapat dijangkau. Periksa koneksi dan konfigurasi backend. ${error.message}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("API mengirim respons yang tidak valid. Periksa konfigurasi backend dan deploy ulang aplikasi.");
  }

  if (!response.ok) {
    throw new Error(payload.error || `Permintaan API gagal (${response.status}).`);
  }
  return payload;
}

export async function getCleanLogs() {
  const payload = await request();
  if (!Array.isArray(payload.entries)) {
    throw new Error("Respons API tidak berisi daftar catatan yang valid.");
  }
  const entriesAreValid = payload.entries.every((entry) =>
    entry &&
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    typeof entry.location === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
    Number.isInteger(entry.participants) &&
    Number.isFinite(entry.plasticKg) &&
    Number.isFinite(entry.otherKg) &&
    Number.isInteger(entry.bags) &&
    typeof entry.notes === "string"
  );
  if (!entriesAreValid) {
    throw new Error("Daftar catatan dari API berisi data yang tidak valid.");
  }
  return payload.entries;
}

export function saveCleanLog(entry) {
  return request({
    method: "POST",
    body: JSON.stringify({ entry }),
  });
}

export function importCleanLogs(entries) {
  return entries.reduce(
    (promise, entry, index) => promise.then(() => {
      if (index % 500 !== 0) return undefined;
      return request({
        method: "POST",
        body: JSON.stringify({ mode: "import", entries: entries.slice(index, index + 500) }),
      });
    }),
    Promise.resolve(),
  );
}

export function deleteCleanLog(id) {
  return request({
    method: "DELETE",
    url: `${API_URL}?id=${encodeURIComponent(id)}`,
  });
}

export async function getAdminSession() {
  if (!ADMIN_API_URL) return { authenticated: false, username: "" };
  return request({ url: ADMIN_API_URL });
}

export function loginAdmin(username, password) {
  return request({
    url: ADMIN_API_URL,
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logoutAdmin() {
  return request({ url: ADMIN_API_URL, method: "DELETE" });
}
