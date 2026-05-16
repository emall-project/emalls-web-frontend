import { auth } from "../../../api/auth";
import { MediaManagerWidget } from "../../../components/mediaManager/MediaManagerWidget";

export default function FileManager() {
  const storeId = auth.getShopId();

  return (
    <div dir="rtl" className="p-3 sm:p-6">
      {storeId ? (
        <MediaManagerWidget
          mode="store"
          storeId={storeId}
          title="إدارة الملفات"
        />
      ) : (
        <div
          className="rounded-2xl border px-5 py-4 text-sm"
          style={{
            background:  "var(--gray-1)",
            borderColor: "var(--gray-a6)",
            color:       "var(--gray-11)",
          }}
        >
          لا يوجد متجر نشط مرتبط بهذا الحساب.
        </div>
      )}
    </div>
  );
}
