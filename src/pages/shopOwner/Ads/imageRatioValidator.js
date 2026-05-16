const RATIO_MAP = {
  "16:9": 16/9, "21:9": 21/9, "4:3": 4/3,  "3:2": 3/2,
  "5:4":  5/4,  "9:16": 9/16, "2:3": 2/3,  "3:4": 3/4,
  "4:5":  4/5,  "1:1":  1,
};

export function parseRatio(str) {
  if (RATIO_MAP[str] !== undefined) return RATIO_MAP[str];
  const parts = String(str || "").split(":");
  if (parts.length !== 2) return null;
  const w = Number(parts[0]), h = Number(parts[1]);
  return (w && h) ? w / h : null;
}

export function validateImageRatio(file, ratioStr, tolerancePct = 2) {
  return new Promise((resolve, reject) => {
    const expected = parseRatio(ratioStr);
    if (!expected) { resolve({ valid: true }); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const actual = img.naturalWidth / img.naturalHeight;
      const tolerance = (tolerancePct / 100) * expected;
      resolve({
        valid: Math.abs(actual - expected) <= tolerance,
        actual, expected,
        width: img.naturalWidth, height: img.naturalHeight,
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("لم يتمكن من قراءة الصورة")); };
    img.src = url;
  });
}

export function compressImage(file, maxBytes = 1.5 * 1024 * 1024, maxDim = 1920) {
  return new Promise((resolve, reject) => {
    if (file.size <= maxBytes && file.type !== "image/bmp") { resolve(file); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("تعذّر ضغط الصورة")); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxDim || h > maxDim) {
        const s = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * s); h = Math.round(h * s);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("تعذّر ضغط الصورة")); return; }
          if (blob.size <= maxBytes || quality <= 0.3) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          } else { quality -= 0.1; tryCompress(); }
        }, "image/jpeg", quality);
      };
      tryCompress();
    };
    img.src = url;
  });
}
