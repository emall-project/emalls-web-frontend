import { useState } from "react";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { accountsApi } from "../../../api/accounts";
import { useAuth } from "../../../auth/AuthContext";
import { ShopRequestForm } from "../../../components/account/ShopRequestForm";
import { buildApiFormError } from "../../../utils/apiErrors";

const FIELD_MAP = {
  "shopRequest.mallId": "mallId",
  "shopRequest.name": "name",
  "shopRequest.category": "category",
  "shopRequest.location": "location",
  "shopRequest.description": "description",
  "shopRequest.contactInfo.phone": "phone",
  "shopRequest.contactInfo.email": "email",
  "shopRequest.logoUuid": "logoUuid",
  "shopRequest.licenseImageUuid": "licenseImageUuid",
  "shopRequest.shopPhotosUuids": "shopPhotosUuids",
  mallId: "mallId",
  name: "name",
  category: "category",
  location: "location",
  description: "description",
  logoUuid: "logoUuid",
  licenseImageUuid: "licenseImageUuid",
  shopPhotosUuids: "shopPhotosUuids",
};

export default function ShopRequests() {
  const { selectedStoreId } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = async (shopRequest) => {
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await accountsApi.shopOwnerRequests.createExistingOwnerShopRequest({ shopRequest });
      setMessage({ type: "success", text: "تم إرسال طلب المتجر للإدارة" });
    } catch (error) {
      const formError = buildApiFormError(error, FIELD_MAP, "فشل إرسال الطلب");
      setFieldErrors(formError.fieldErrors);
      setMessage({ type: "error", text: formError.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>طلب متجر جديد</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
          أرسل طلب إضافة متجر جديد لحسابك الحالي.
        </p>
      </div>

      {message ? (
        <div className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm" style={{
          background: message.type === "success" ? "var(--green-a2)" : "var(--red-a2)",
          borderColor: message.type === "success" ? "var(--green-a6)" : "var(--red-a6)",
          color: message.type === "success" ? "var(--green-11)" : "var(--red-11)",
        }}>
          {message.type === "success" ? <FiCheckCircle className="mt-0.5 shrink-0" /> : <FiAlertCircle className="mt-0.5 shrink-0" />}
          {message.text}
        </div>
      ) : null}

      <div className="rounded-3xl border p-5 sm:p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
        <ShopRequestForm
          onSubmit={submit}
          submitting={submitting}
          submitLabel="إرسال طلب المتجر"
          allowPicker={!!selectedStoreId}
          pickerMode="store"
          storeId={selectedStoreId}
          externalFieldErrors={fieldErrors}
        />
      </div>
    </div>
  );
}
