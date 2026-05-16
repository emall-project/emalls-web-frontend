import { auth } from "./auth";

const MEDIA_BASE = "/media-manager";
const INTERNAL_AUTH = `Basic ${btoa("e-mall-internal:s3cr3t-internal-p@ss")}`;

// ── URL builders ──────────────────────────────────────────────────────────────
function fileBase(mode, storeId) {
  return mode === "store"
    ? `${MEDIA_BASE}/stores/${storeId}/files`
    : `${MEDIA_BASE}/admin/files`;
}
function folderBase(mode, storeId) {
  return mode === "store"
    ? `${MEDIA_BASE}/stores/${storeId}/folders`
    : `${MEDIA_BASE}/admin/folders`;
}
function extOf(filename = "") {
  const parts = String(filename).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

// ── Authenticated fetch ───────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const headers = {
    ...auth.getHeaders(),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) { auth.logout("/shop-owner/login"); return null; }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.message || "خطأ في الطلب");
    throw err;
  }
  return json?.data ?? json ?? null;
}

// ── File-type helpers ─────────────────────────────────────────────────────────
function getExt(file) {
  return String(file?.extension || extOf(file?.name) || "").toLowerCase();
}
export function isImageFile(file) {
  const mime = String(file?.mimeType || "").toLowerCase();
  return mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "bmp"].includes(getExt(file));
}
export function isVideoFile(file) {
  const mime = String(file?.mimeType || "").toLowerCase();
  return mime.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov", "m4v"].includes(getExt(file));
}
export function isAudioFile(file) {
  const mime = String(file?.mimeType || "").toLowerCase();
  return mime.startsWith("audio/") ||
    ["mp3", "wav", "m4a", "aac", "flac", "oga"].includes(getExt(file));
}
export function isPdfFile(file) {
  const mime = String(file?.mimeType || "").toLowerCase();
  return mime.includes("pdf") || getExt(file) === "pdf";
}
export function isTextFile(file) {
  const mime = String(file?.mimeType || "").toLowerCase();
  return (
    mime.startsWith("text/") ||
    ["txt", "md", "json", "xml", "csv", "yaml", "yml", "html", "css", "js", "jsx", "ts", "tsx"].includes(getExt(file))
  );
}
export function formatFileSize(size) {
  if (size == null || Number.isNaN(Number(size))) return "-";
  const v = Number(size);
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB`;
  return `${(v / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const PREVIEW_ORDERS = {
  small:    ["smallFileUrl", "mediumFileUrl", "largeFileUrl", "originalFileUrl"],
  medium:   ["mediumFileUrl", "largeFileUrl", "originalFileUrl", "smallFileUrl"],
  large:    ["largeFileUrl", "originalFileUrl", "mediumFileUrl", "smallFileUrl"],
  original: ["originalFileUrl", "largeFileUrl", "mediumFileUrl", "smallFileUrl"],
};
export function getMediaPreviewUrl(file, size = "small") {
  if (!file) return "";
  if (file.localPreviewUrl) return file.localPreviewUrl;
  const keys = PREVIEW_ORDERS[size] || PREVIEW_ORDERS.small;
  return keys.map((k) => file?.[k]).find(Boolean) || "";
}

// ── API ───────────────────────────────────────────────────────────────────────
export const mediaManagerApi = {
  listFolders: async ({ mode, storeId, parentId = null }) => {
    const qs = parentId != null ? `?parentId=${parentId}` : "";
    const data = await apiFetch(`${folderBase(mode, storeId)}/all${qs}`);
    return Array.isArray(data) ? data : [];
  },

  createFolder: async ({ mode, storeId, parentId = null, name }) => {
    return apiFetch(folderBase(mode, storeId), {
      method: "POST",
      body: JSON.stringify({ name, parentId }),
    });
  },

  deleteFolder: async ({ mode, storeId, folderId }) => {
    const res = await fetch(`${folderBase(mode, storeId)}/${folderId}`, {
      method: "DELETE",
      headers: auth.getHeaders(),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message || "فشل حذف المجلد");
    }
  },

  listFiles: async ({ mode, storeId, folderId = null }) => {
    if (folderId == null) return [];
    const qs = new URLSearchParams({ folderId: String(folderId) });
    const data = await apiFetch(`${fileBase(mode, storeId)}/all?${qs}`);
    return Array.isArray(data) ? data : [];
  },

  getFileById: async ({ mode, storeId, fileId }) => {
    return apiFetch(`${fileBase(mode, storeId)}/${fileId}`);
  },

  renameFile: async ({ mode, storeId, fileId, newName }) => {
    return apiFetch(`${fileBase(mode, storeId)}/rename`, {
      method: "PUT",
      body: JSON.stringify({ id: fileId, newName }),
    });
  },

  moveFile: async ({ mode, storeId, fileId, newFolderId }) => {
    return apiFetch(`${fileBase(mode, storeId)}/move`, {
      method: "PUT",
      body: JSON.stringify({ id: fileId, newFolderId }),
    });
  },

  deleteFile: async ({ mode, storeId, fileId }) => {
    const res = await fetch(`${fileBase(mode, storeId)}/${fileId}`, {
      method: "DELETE",
      headers: auth.getHeaders(),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message || "فشل حذف الملف");
    }
  },

  uploadFile: async ({ mode, storeId, folderId, file, onUploadStateChange }) => {
    // Step 1 — get pre-signed upload URL
    const urlData = await apiFetch(`${fileBase(mode, storeId)}/upload-url`, {
      method: "POST",
      body: JSON.stringify({ name: file.name, folderId }),
    });
    const { fileId, uploadUrl } = urlData ?? {};
    if (!fileId || !uploadUrl) throw new Error("فشل تجهيز رفع الملف");

    // Step 2 — PUT bytes to S3 (no auth — pre-signed URL is self-authenticated)
    onUploadStateChange?.("uploading");
    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!s3Res.ok) throw new Error("فشل رفع الملف إلى التخزين");

    // Step 3 — mark file APPROVED via internal endpoint
    onUploadStateChange?.("processing");
    const mimeType = file.type || "application/octet-stream";
    const extension = extOf(file.name);
    const completeRes = await fetch(`${MEDIA_BASE}/internal/files/complete-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: INTERNAL_AUTH },
      body: JSON.stringify({ id: fileId, status: "APPROVED", size: file.size, mimeType, extension }),
    });
    if (!completeRes.ok) {
      const cj = await completeRes.json().catch(() => null);
      throw new Error(cj?.message || "فشل تأكيد رفع الملف");
    }

    return {
      id: fileId,
      name: file.name,
      mimeType,
      extension,
      size: file.size,
      status: "APPROVED",
      localPreviewUrl: URL.createObjectURL(file),
      originalFileUrl: "",
      mediumFileUrl:   "",
      smallFileUrl:    "",
    };
  },
};
