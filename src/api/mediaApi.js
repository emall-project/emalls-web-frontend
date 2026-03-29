const BASE = "/media-manager";
const DEFAULT_FOLDER_ID = 11;

export const mediaApi = {
  upload: async (file, folderId = DEFAULT_FOLDER_ID) => {
    const form = new FormData();
    form.append("folderId", String(folderId));
    form.append("file", file);
    const res = await fetch(`${BASE}/files`, { method: "POST", body: form });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "فشل رفع الملف");
    return json; // json.data.id = UUID, json.data.mediumFileUrl = preview
  },

  getById: async (id) => {
    const res = await fetch(`${BASE}/files/${id}`);
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "فشل جلب الملف");
    return json; // json.data.originalFileUrl / mediumFileUrl / smallFileUrl
  },
};
