import { MediaManagerWidget } from "../../../components/mediaManager/MediaManagerWidget";
import { useAuth } from "../../../auth/AuthContext";

export default function ShopOwnerFileManager() {
  const { selectedStoreId } = useAuth();

  return (
    <div className="px-6 py-8">
      {selectedStoreId ? (
        <MediaManagerWidget
          mode="store"
          storeId={selectedStoreId}
          title="إدارة الملفات"
        />
      ) : (
        <div
          className="rounded-2xl border px-5 py-4 text-sm"
          style={{
            background: "var(--gray-1)",
            borderColor: "var(--gray-a6)",
            color: "var(--gray-11)",
          }}
        >
          لا يوجد متجر نشط مرتبط بهذا الحساب.
        </div>
      )}
    </div>
  );
}
