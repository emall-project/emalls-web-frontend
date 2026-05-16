import { MediaManagerWidget } from "../../../components/mediaManager/MediaManagerWidget";

export default function AdminFileManager() {
  return (
    <div dir="rtl" className="p-3 sm:p-6">
      <MediaManagerWidget mode="admin" title="إدارة الملفات" />
    </div>
  );
}
