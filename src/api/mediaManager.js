import { requestJson } from "../utils/http";

const MEDIA_BASE = "/media-manager";
const APPROVED_STATUS = "APPROVED";
const TERMINAL_UPLOAD_FAILURE_STATUSES = new Set(["REJECTED", "FAILED", "ERROR"]);
const DEFAULT_UPLOAD_POLL_INTERVAL_MS = 1500;
const DEFAULT_UPLOAD_WAIT_TIMEOUT_MS = 90000;

function unwrap(payload) {
  return payload?.data ?? payload ?? null;
}

function getFileBase(mode, storeId) {
  if (mode === "store") {
    return `${MEDIA_BASE}/stores/${storeId}/files`;
  }

  return `${MEDIA_BASE}/admin/files`;
}

function getFolderBase(mode, storeId) {
  if (mode === "store") {
    return `${MEDIA_BASE}/stores/${storeId}/folders`;
  }

  return `${MEDIA_BASE}/admin/folders`;
}

function getTempFileBase() {
  return `${MEDIA_BASE}/temps/files`;
}

function getExtensionFromName(filename = "") {
  const parts = String(filename).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getFileExtension(file) {
  return String(file?.extension || getExtensionFromName(file?.name) || "").toLowerCase();
}

async function uploadToPresignedUrl(uploadUrl, file) {
  let response;

  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });
  } catch (error) {
    const isCrossOrigin = typeof uploadUrl === "string" && /^https?:\/\//i.test(uploadUrl);

    if (isCrossOrigin && error instanceof TypeError) {
      throw new Error(
        `فشل رفع الملف لأن تخزين S3 لا يسمح بطلبات PUT من ${window.location.origin}. أضف CORS للـ bucket أولًا`
      );
    }

    throw error;
  }

  if (!response.ok) {
    throw new Error("فشل رفع الملف إلى التخزين");
  }
}

const MEDIA_PREVIEW_ORDERS = {
  thumbnail: ["smallFileUrl", "mediumFileUrl", "largeFileUrl", "originalFileUrl"],
  small: ["smallFileUrl", "mediumFileUrl", "largeFileUrl", "originalFileUrl"],
  medium: ["mediumFileUrl", "largeFileUrl", "originalFileUrl", "smallFileUrl"],
  large: ["largeFileUrl", "originalFileUrl", "mediumFileUrl", "smallFileUrl"],
  original: ["originalFileUrl", "largeFileUrl", "mediumFileUrl", "smallFileUrl"],
};

export function getMediaPreviewUrl(file, size = "small") {
  if (!file) {
    return "";
  }

  if (file.localPreviewUrl) {
    return file.localPreviewUrl;
  }

  const keys = MEDIA_PREVIEW_ORDERS[size] || MEDIA_PREVIEW_ORDERS.small;
  return keys.map((key) => file?.[key]).find(Boolean) || "";
}

export function isImageFile(file) {
  const mimeType = String(file?.mimeType || "").toLowerCase();
  const extension = getFileExtension(file);
  return (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "bmp"].includes(extension)
  );
}

export function isVideoFile(file) {
  const mimeType = String(file?.mimeType || "").toLowerCase();
  const extension = getFileExtension(file);
  return (
    mimeType.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov", "m4v"].includes(extension)
  );
}

export function isAudioFile(file) {
  const mimeType = String(file?.mimeType || "").toLowerCase();
  const extension = getFileExtension(file);
  return (
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "m4a", "aac", "flac", "oga"].includes(extension)
  );
}

export function isPdfFile(file) {
  const mimeType = String(file?.mimeType || "").toLowerCase();
  const extension = getFileExtension(file);
  return mimeType.includes("pdf") || extension === "pdf";
}

export function isTextFile(file) {
  const mimeType = String(file?.mimeType || "").toLowerCase();
  const extension = getFileExtension(file);
  return (
    mimeType.startsWith("text/") ||
    ["txt", "md", "json", "xml", "csv", "yaml", "yml", "html", "css", "js", "jsx", "ts", "tsx"].includes(extension)
  );
}

export function formatFileSize(size) {
  if (size == null || Number.isNaN(Number(size))) {
    return "-";
  }

  const value = Number(size);

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchFileById({ mode, storeId, fileId }) {
  const payload = await requestJson(`${getFileBase(mode, storeId)}/${fileId}`);
  return unwrap(payload);
}

async function waitForApprovedFile({
  mode,
  storeId,
  fileId,
  intervalMs = DEFAULT_UPLOAD_POLL_INTERVAL_MS,
  timeoutMs = DEFAULT_UPLOAD_WAIT_TIMEOUT_MS,
}) {
  const startedAt = Date.now();
  let lastFile = null;

  while (Date.now() - startedAt < timeoutMs) {
    lastFile = await fetchFileById({ mode, storeId, fileId });
    const status = String(lastFile?.status || "").toUpperCase();

    if (status === APPROVED_STATUS) {
      return lastFile;
    }

    if (TERMINAL_UPLOAD_FAILURE_STATUSES.has(status)) {
      throw new Error(lastFile?.errorMessage || "فشلت معالجة الملف من الخادم");
    }

    await delay(intervalMs);
  }

  const error = new Error("تم رفع الملف لكن لم تكتمل معالجته بعد. حدّث القائمة بعد قليل.");
  error.code = "MEDIA_UPLOAD_PENDING_TIMEOUT";
  error.file = lastFile;
  throw error;
}

export const mediaManagerApi = {
  async listFolders({ mode, storeId, parentId = null }) {
    const query = new URLSearchParams();

    if (parentId != null) {
      query.set("parentId", String(parentId));
    }

    const payload = await requestJson(
      `${getFolderBase(mode, storeId)}/all${query.size ? `?${query}` : ""}`
    );

    return unwrap(payload) || [];
  },

  async createFolder({ mode, storeId, parentId = null, name }) {
    const payload = await requestJson(getFolderBase(mode, storeId), {
      method: "POST",
      body: JSON.stringify({
        name,
        parentId,
      }),
    });

    return unwrap(payload);
  },

  async deleteFolder({ mode, storeId, folderId }) {
    await requestJson(`${getFolderBase(mode, storeId)}/${folderId}`, {
      method: "DELETE",
    });
  },

  async listFiles({ mode, storeId, folderId = null }) {
    if (folderId == null) {
      return [];
    }

    const query = new URLSearchParams({ folderId: String(folderId) });
    const payload = await requestJson(
      `${getFileBase(mode, storeId)}/all?${query.toString()}`
    );

    return unwrap(payload) || [];
  },

  async getFileById({ mode, storeId, fileId }) {
    return fetchFileById({ mode, storeId, fileId });
  },

  async renameFile({ mode, storeId, fileId, newName }) {
    const payload = await requestJson(`${getFileBase(mode, storeId)}/rename`, {
      method: "PUT",
      body: JSON.stringify({
        id: fileId,
        newName,
      }),
    });

    return unwrap(payload);
  },

  async moveFile({ mode, storeId, fileId, newFolderId }) {
    const payload = await requestJson(`${getFileBase(mode, storeId)}/move`, {
      method: "PUT",
      body: JSON.stringify({
        id: fileId,
        newFolderId,
      }),
    });

    return unwrap(payload);
  },

  async deleteFile({ mode, storeId, fileId }) {
    await requestJson(`${getFileBase(mode, storeId)}/${fileId}`, {
      method: "DELETE",
    });
  },

  async uploadFile({ mode, storeId, folderId, file, onUploadStateChange }) {
    const payload = await requestJson(
      `${getFileBase(mode, storeId)}/upload-url`,
      {
        method: "POST",
        body: JSON.stringify({
          name: file.name,
          folderId,
        }),
      }
    );

    const uploadDetails = unwrap(payload);
    const fileId = uploadDetails?.fileId;
    const uploadUrl = uploadDetails?.uploadUrl;

    if (!fileId || !uploadUrl) {
      throw new Error("فشل تجهيز رفع الملف");
    }

    onUploadStateChange?.("uploading");
    await uploadToPresignedUrl(uploadUrl, file);
    onUploadStateChange?.("processing");

    const savedFile = await waitForApprovedFile({
      mode,
      storeId,
      fileId,
    });

    return {
      ...savedFile,
      mimeType: savedFile?.mimeType || file.type || null,
      extension:
        savedFile?.extension || getExtensionFromName(file.name) || null,
      size: savedFile?.size ?? file.size,
      status: savedFile?.status || APPROVED_STATUS,
      originalFileUrl: savedFile?.originalFileUrl || "",
      mediumFileUrl: savedFile?.mediumFileUrl || "",
      smallFileUrl: savedFile?.smallFileUrl || "",
    };
  },

  async uploadTempFile(file) {
    const payload = await requestJson(`${getTempFileBase()}/upload-url`, {
      method: "POST",
      body: JSON.stringify({
        name: file.name,
      }),
    });

    const uploadDetails = unwrap(payload);
    const fileId = uploadDetails?.fileId;
    const uploadUrl = uploadDetails?.uploadUrl;

    if (!fileId || !uploadUrl) {
      throw new Error("فشل تجهيز رفع الملف");
    }

    await uploadToPresignedUrl(uploadUrl, file);

    return {
      id: fileId,
      fileId,
      name: file.name,
      mimeType: file.type || null,
      extension: getExtensionFromName(file.name) || null,
      size: file.size,
      status: "PENDING",
      originalFileUrl: "",
      mediumFileUrl: "",
      smallFileUrl: "",
    };
  },
};
