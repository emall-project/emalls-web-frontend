import { MediaManagerWidget } from "../../../components/mediaManager/MediaManagerWidget";

export default function AdminFileManager() {
  return (
    <div className="px-6 py-8">
      <MediaManagerWidget mode="admin" title="إدارة الملفات" />
    </div>
  );
}
