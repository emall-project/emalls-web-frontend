import { FiImage, FiLayers, FiStar } from "react-icons/fi";
import ImageUploader from "./ImageUploader";

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: { bg: "var(--blue-a2)", fg: "var(--blue-11)" },
    green: { bg: "var(--green-a2)", fg: "var(--green-11)" },
    amber: { bg: "var(--amber-a2)", fg: "var(--amber-11)" },
  };

  return (
    <div className="rounded-[24px] border px-4 py-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: tones[tone].bg, color: tones[tone].fg }}>
          <Icon size={15} />
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
        {value}
      </p>
    </div>
  );
}

export default function ProductMediaStep({
  items,
  error,
  uploading,
  onFilesSelected,
  onRemove,
  onRetry,
  onSetMain,
  onMove,
}) {
  const uploadedItems = items.filter((item) => item.status === "uploaded");
  const failedItems = items.filter((item) => item.status === "error");
  const mainImage = uploadedItems[0];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_320px]">
      <div className="space-y-5">
        <section className="rounded-[30px] border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}>
              <FiImage size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                وسائط المنتج
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--gray-9)" }}>
                ارفع صور وفيديوهات المنتج مرة واحدة هنا، ثم اختر الوسائط المناسبة لكل متغير من الخطوة التالية.
              </p>
            </div>
          </div>

          <ImageUploader
            items={items}
            uploading={uploading}
            error={error}
            onFilesSelected={onFilesSelected}
            onRemove={onRemove}
            onRetry={onRetry}
            onSetMain={onSetMain}
            onMove={onMove}
          />
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
        <section
          className="rounded-[30px] border p-6"
          style={{
            background: "linear-gradient(180deg, var(--blue-a2), var(--gray-1))",
            borderColor: "var(--blue-a5)",
          }}
        >
          <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
            جاهزية الوسائط
          </h3>
          <p className="mt-1 text-xs leading-6" style={{ color: "var(--gray-9)" }}>
            كل صورة تُرفع هنا يمكن إسنادها إلى متغير واحد أو أكثر مع الحفاظ على نفس ترتيب العرض.
          </p>

          <div className="mt-5 grid gap-3">
            <StatCard icon={FiLayers} label="إجمالي الصور" value={String(items.length)} tone="blue" />
            <StatCard icon={FiStar} label="الصور الجاهزة" value={String(uploadedItems.length)} tone="green" />
            <StatCard icon={FiImage} label="صور تحتاج متابعة" value={String(failedItems.length)} tone="amber" />
          </div>
        </section>

        <section className="rounded-[30px] border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
          <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
            الصورة الرئيسية الحالية
          </h3>
          <div className="mt-4 overflow-hidden rounded-[24px] border" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
            {mainImage?.previewUrl && mainImage?.mimeType?.startsWith("video/") ? (
              <video src={mainImage.previewUrl} className="aspect-[4/3] w-full object-cover" muted playsInline />
            ) : mainImage?.previewUrl ? (
              <img src={mainImage.previewUrl} alt={mainImage.fileName} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center">
                <FiImage size={24} style={{ color: "var(--gray-8)" }} />
              </div>
            )}
            <div className="px-4 py-4">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                {mainImage?.fileName || "لم يتم رفع صورة رئيسية بعد"}
              </p>
              <p className="mt-1 text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                سيتم استخدام هذه الصورة افتراضيًا في المعاينة وفي أعلى بطاقة المنتج.
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
