import { auth } from "./auth";

const BASE = "/media-manager";

// Cache the resolved admin folder ID so we only fetch it once per session
let _adminFolderId = null;
// Cache shop folder IDs keyed by shopId
let _shopFolderIds = {};

function _extractFolder(raw) {
  if (!raw) return null;
  // Single object with any known ID field
  if (raw.id != null || raw.folderId != null || raw.uuid != null || raw.folderUuid != null) return raw;
  // Plain array
  if (Array.isArray(raw)) return raw[0] ?? null;
  // Paginated: content may be array or single object
  if (raw.content != null) {
    if (Array.isArray(raw.content)) return raw.content[0] ?? null;
    return raw.content;
  }
  return null;
}

async function resolveShopFolderId(shopId) {
  if (_shopFolderIds[shopId] != null) return _shopFolderIds[shopId];

  const res  = await fetch(`${BASE}/stores/${shopId}/folders`, { headers: auth.getHeaders() });
  const json = await res.json().catch(() => null);

  // Always log so we can diagnose response shape issues.
  console.warn('[mediaApi] GET /stores/folders →', res.status, JSON.stringify(json));

  if (!res.ok) {
    throw new Error(json?.message || 'فشل جلب مجلد الوسائط للمتجر');
  }

  const raw   = json?.data;
  const found = _extractFolder(raw);
  const resolvedId = found?.id ?? found?.folderId ?? found?.uuid ?? found?.folderUuid ?? null;

  console.warn('[mediaApi] resolveShopFolderId →', { raw, found, resolvedId });

  if (resolvedId == null) {
    throw new Error('لم يتم العثور على مجلد الوسائط لهذا المتجر. يرجى التواصل مع الإدارة لتفعيل مساحة الوسائط.');
  }

  _shopFolderIds[shopId] = resolvedId;
  return resolvedId;
}

async function resolveAdminFolderId() {
  if (_adminFolderId) return _adminFolderId;

  // Fetch all system folders visible to admin
  const res = await fetch(`${BASE}/admin/folders/all`, { headers: auth.getHeaders() });
  const json = await res.json().catch(() => null);
  const folders = Array.isArray(json?.data) ? json.data : [];

  // Prefer a non-temp folder; fall back to any existing folder
  const found = folders.find((f) => f.name !== "TEMP_FOLDER") || folders[0];
  if (found) {
    _adminFolderId = found.id;
    return _adminFolderId;
  }

  // No folder exists — create a dedicated one for admin media
  const createRes = await fetch(`${BASE}/admin/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth.getHeaders() },
    body: JSON.stringify({ name: "Mall Media" }),
  });
  const createJson = await createRes.json().catch(() => null);
  if (!createRes.ok) throw new Error(createJson?.message || "فشل إنشاء مجلد الوسائط");
  _adminFolderId = createJson?.data?.id;
  return _adminFolderId;
}

export const mediaApi = {
  /**
   * Three-step upload:
   * 1. POST /admin/files/upload-url { name, folderId } → { fileId, uploadUrl }
   * 2. PUT file bytes directly to S3 (pre-signed URL, no auth)
   * 3. POST /internal/files/complete-upload → mark file APPROVED with mimeType
   * Returns { data: { id: fileId, originalFileUrl, mediumFileUrl } }
   */
  upload: async (file, folderId = null) => {
    const resolvedFolderId = folderId ?? await resolveAdminFolderId();

    const ext  = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const base = file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;
    const uniqueName = `${base}_${Date.now()}${ext}`;

    // Step 1 — request pre-signed URL
    const urlRes = await fetch(`${BASE}/admin/files/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth.getHeaders() },
      body: JSON.stringify({ name: uniqueName, folderId: resolvedFolderId }),
    });
    const urlJson = await urlRes.json().catch(() => null);
    if (!urlRes.ok) throw new Error(urlJson?.message || "فشل الحصول على رابط الرفع");

    const { fileId, uploadUrl } = urlJson?.data ?? {};
    if (!fileId || !uploadUrl) throw new Error("استجابة غير صحيحة من الخادم");

    // Step 2 — upload bytes directly to S3 (no auth header — pre-signed URL is self-authenticated)
    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });
    if (!s3Res.ok) throw new Error("فشل رفع الملف إلى التخزين");

    // Step 3 — mark file as APPROVED so backends can validate mimeType
    const mimeType  = file.type || "image/jpeg";
    const extension = ext.replace(/^\./, "") || mimeType.split("/")[1] || "jpg";
    const completeRes = await fetch(`${BASE}/internal/files/complete-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa("e-mall-internal:s3cr3t-internal-p@ss")}`,
      },
      body: JSON.stringify({ id: fileId, status: "APPROVED", size: file.size, mimeType, extension }),
    });
    if (!completeRes.ok) {
      const cj = await completeRes.json().catch(() => null);
      throw new Error(cj?.message || "فشل تأكيد رفع الملف");
    }

    // Local blob URL for immediate preview; real S3 URL available after reload
    const previewUrl = URL.createObjectURL(file);
    return { data: { id: fileId, originalFileUrl: previewUrl, mediumFileUrl: previewUrl } };
  },

  // Public temp upload for unauthenticated flows like shop-owner signup requests
  uploadTemp: async (file) => {
    const ext  = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const base = file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;
    const uniqueName = `${base}_${Date.now()}${ext}`;

    const urlRes = await fetch(`${BASE}/temps/files/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: uniqueName }),
    });
    const urlJson = await urlRes.json().catch(() => null);
    if (!urlRes.ok) throw new Error(urlJson?.message || "فشل الحصول على رابط الرفع");

    const { fileId, uploadUrl } = urlJson?.data ?? {};
    if (!fileId || !uploadUrl) throw new Error("استجابة غير صحيحة من الخادم");

    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });
    if (!s3Res.ok) throw new Error("فشل رفع الملف إلى التخزين");

    const mimeType  = file.type || "image/jpeg";
    const extension = ext.replace(/^\./, "") || mimeType.split("/")[1] || "jpg";
    const completeRes = await fetch(`${BASE}/internal/files/complete-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa("e-mall-internal:s3cr3t-internal-p@ss")}`,
      },
      body: JSON.stringify({ id: fileId, status: "APPROVED", size: file.size, mimeType, extension }),
    });
    if (!completeRes.ok) {
      const cj = await completeRes.json().catch(() => null);
      throw new Error(cj?.message || "فشل تأكيد رفع الملف");
    }

    const previewUrl = URL.createObjectURL(file);
    return { data: { id: fileId, originalFileUrl: previewUrl, mediumFileUrl: previewUrl } };
  },

  getById: async (id) => {
    const res = await fetch(`${BASE}/admin/files/${id}`, {
      headers: auth.getHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "فشل جلب الملف");
    return json;
  },

  getStoreFileById: async (shopId, id) => {
    const res = await fetch(`${BASE}/stores/${shopId}/files/${id}`, {
      headers: auth.getHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "فشل جلب ملف المتجر");
    return json?.data ?? json;
  },

  // Store-scoped three-step upload for shop owners
  uploadForStore: async (file, shopId) => {
    const folderId = await resolveShopFolderId(shopId);

    const ext  = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const base = file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;
    const uniqueName = `${base}_${Date.now()}${ext}`;

    // Step 1 — request pre-signed URL (store-scoped endpoint)
    const urlRes = await fetch(`${BASE}/stores/${shopId}/files/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth.getHeaders() },
      body: JSON.stringify({ name: uniqueName, folderId }),
    });
    const urlJson = await urlRes.json().catch(() => null);
    if (!urlRes.ok) throw new Error(urlJson?.message || "فشل الحصول على رابط الرفع");

    const { fileId, uploadUrl } = urlJson?.data ?? {};
    if (!fileId || !uploadUrl) throw new Error("استجابة غير صحيحة من الخادم");

    // Step 2 — upload bytes directly to S3
    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });
    if (!s3Res.ok) throw new Error("فشل رفع الملف إلى التخزين");

    // Step 3 — mark file as APPROVED
    const mimeType  = file.type || "image/jpeg";
    const extension = ext.replace(/^\./, "") || mimeType.split("/")[1] || "jpg";
    const completeRes = await fetch(`${BASE}/internal/files/complete-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa("e-mall-internal:s3cr3t-internal-p@ss")}`,
      },
      body: JSON.stringify({ id: fileId, status: "APPROVED", size: file.size, mimeType, extension }),
    });
    if (!completeRes.ok) {
      const cj = await completeRes.json().catch(() => null);
      throw new Error(cj?.message || "فشل تأكيد رفع الملف");
    }

    const previewUrl = URL.createObjectURL(file);
    return { data: { id: fileId, originalFileUrl: previewUrl, mediumFileUrl: previewUrl } };
  },

  // GET /media-manager/stores/{shopId}/folders — list folders for a store
  getShopFolder: async (shopId) => {
    const res = await fetch(`${BASE}/stores/${shopId}/folders`, {
      headers: auth.getHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "فشل جلب مجلد المتجر");
    return json;
  },
};
