import { FiImage, FiTrash2, FiUploadCloud } from "react-icons/fi";

export default function AdImageUploadStep({
  template,
  previewUrl,
  fileMeta,
  ratioError,
  uploadError,
  uploading,
  onPickImage,
  onRemoveImage,
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>الصورة والوسائط</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
          ارفع صورة إعلان مطابقة لنسبة القالب حتى يُقبل الطلب من أول مرة.
        </p>
      </div>

      <div
        className="rounded-2xl border px-4 py-3 text-sm"
        style={{ background: "var(--blue-a3)", borderColor: "var(--blue-a5)", color: "var(--blue-11)" }}
      >
        النسبة المطلوبة: <span className="font-bold">{template?.imageRatio || "—"}</span>
      </div>

      <button
        type="button"
        onClick={onPickImage}
        className="flex w-full flex-col items-center justify-center rounded-[28px] border border-dashed px-6 py-12 text-center transition outline-none"
        style={{
          background:  uploading ? "var(--blue-a2)" : "var(--gray-a2)",
          borderColor: uploading ? "var(--blue-a6)" : "var(--gray-a6)",
          cursor:      uploading ? "wait" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.borderColor = "var(--blue-a7)";
            e.currentTarget.style.background  = "var(--blue-a2)";
          }
        }}
        onMouseLeave={(e) => {
          if (!uploading) {
            e.currentTarget.style.borderColor = "var(--gray-a6)";
            e.currentTarget.style.background  = "var(--gray-a2)";
          }
        }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm"
          style={{ background: "var(--gray-1)", color: "var(--blue-9)" }}
        >
          <FiUploadCloud size={28} />
        </div>
        <p className="mt-5 text-base font-bold" style={{ color: "var(--gray-12)" }}>
          اسحب صورة الإعلان هنا أو اضغط للرفع
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--gray-9)" }}>
          الصيغ المدعومة: JPG, PNG, WEBP
        </p>
        {uploading ? (
          <p className="mt-3 text-sm font-semibold" style={{ color: "var(--blue-10)" }}>
            جارٍ رفع الصورة والتحقق منها…
          </p>
        ) : null}
      </button>

      {ratioError ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--red-a3)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}
        >
          {ratioError}
        </div>
      ) : null}

      {uploadError ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--red-a3)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}
        >
          {uploadError}
        </div>
      ) : null}

      {previewUrl ? (
        <div
          className="overflow-hidden rounded-[28px] border shadow-sm"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
        >
          <div className="aspect-video" style={{ background: "var(--gray-a2)" }}>
            <img src={previewUrl} alt="معاينة الإعلان" className="h-full w-full object-cover" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                {fileMeta?.name || "صورة الإعلان"}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                {fileMeta?.mimeType || "image/*"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPickImage}
                className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition"
                style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)", color: "var(--gray-11)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--blue-a7)"; e.currentTarget.style.color = "var(--blue-9)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gray-a5)"; e.currentTarget.style.color = "var(--gray-11)"; }}
              >
                <FiImage size={14} />
                استبدال
              </button>

              <button
                type="button"
                onClick={onRemoveImage}
                className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition"
                style={{ background: "var(--red-a3)", borderColor: "var(--red-a5)", color: "var(--red-10)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-a4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--red-a3)"; }}
              >
                <FiTrash2 size={14} />
                إزالة
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
