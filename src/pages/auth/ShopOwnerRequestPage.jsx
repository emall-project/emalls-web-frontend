import { useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiLoader } from "react-icons/fi";
import { Link } from "react-router-dom";
import { accountsApi } from "../../api/accounts";
import { MediaUuidField } from "../../components/account/MediaUuidField";
import { ShopRequestForm } from "../../components/account/ShopRequestForm";

const inputClass = "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const inputStyle = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" };

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
        {label} {required ? <span style={{ color: "var(--red-9)" }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

export default function ShopOwnerRequestPage() {
  const [owner, setOwner] = useState({
    fullName: "",
    username: "",
    email: "",
    prefix: "+970",
    number: "",
    password: "",
    gender: "NOT_SPECIFIED",
    age: "",
    nationalIdNumber: "",
    profilePictureUuid: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (key, value) => setOwner((previous) => ({ ...previous, [key]: value }));

  const submit = async (shopRequest) => {
    setMessage(null);
    if (!owner.fullName.trim() || !owner.username.trim() || !owner.number.trim() || !owner.password || !owner.age) {
      setMessage({ type: "error", text: "املأ بيانات صاحب المتجر المطلوبة" });
      return;
    }

    setSubmitting(true);
    try {
      await accountsApi.shopOwnerRequests.create({
        fullName: owner.fullName.trim(),
        username: owner.username.trim(),
        email: owner.email.trim() || null,
        phone: { prefix: owner.prefix, number: owner.number.trim() },
        password: owner.password,
        gender: owner.gender,
        age: Number(owner.age),
        nationalIdNumber: owner.nationalIdNumber.trim() || null,
        profilePictureUuid: owner.profilePictureUuid.trim() || null,
        shopRequest,
      });
      setMessage({ type: "success", text: "تم إرسال طلب صاحب المتجر للإدارة" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "فشل إرسال الطلب" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen px-4 py-10" style={{ background: "var(--gray-2)" }}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--blue-11)" }}>سوقنا</div>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>طلب فتح متجر</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--gray-11)" }}>
            أنشئ طلب صاحب متجر جديد مع بيانات المتجر الأولى. بعد الموافقة يمكنك تسجيل الدخول من صفحة أصحاب المتاجر.
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

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-5 rounded-3xl border p-5 sm:p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
            <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>بيانات صاحب المتجر</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Field label="الاسم الكامل" required>
                <input className={inputClass} style={inputStyle} value={owner.fullName} onChange={(event) => set("fullName", event.target.value)} />
              </Field>
              <Field label="اسم المستخدم" required>
                <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={owner.username} onChange={(event) => set("username", event.target.value)} />
              </Field>
              <Field label="البريد الإلكتروني">
                <input type="email" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={owner.email} onChange={(event) => set("email", event.target.value)} />
              </Field>
              <Field label="كلمة المرور" required>
                <input type="password" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={owner.password} onChange={(event) => set("password", event.target.value)} />
              </Field>
              <Field label="رقم الهاتف" required>
                <div className="flex gap-2" dir="ltr">
                  <select className={inputClass} style={{ ...inputStyle, maxWidth: 112 }} value={owner.prefix} onChange={(event) => set("prefix", event.target.value)}>
                    <option value="+970">+970</option>
                    <option value="+972">+972</option>
                  </select>
                  <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={owner.number} onChange={(event) => set("number", event.target.value)} />
                </div>
              </Field>
              <Field label="العمر" required>
                <input type="number" min="0" max="150" className={inputClass} style={inputStyle} value={owner.age} onChange={(event) => set("age", event.target.value)} />
              </Field>
              <Field label="الجنس" required>
                <select className={inputClass} style={inputStyle} value={owner.gender} onChange={(event) => set("gender", event.target.value)}>
                  <option value="MALE">ذكر</option>
                  <option value="FEMALE">أنثى</option>
                  <option value="NOT_SPECIFIED">غير محدد</option>
                </select>
              </Field>
              <Field label="رقم الهوية">
                <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={owner.nationalIdNumber} onChange={(event) => set("nationalIdNumber", event.target.value)} />
              </Field>
            </div>
            <MediaUuidField
              label="صورة الملف الشخصي"
              value={owner.profilePictureUuid}
              onChange={(value) => set("profilePictureUuid", value)}
              allowPicker={false}
            />
            <Link to="/login" className="inline-block text-sm font-semibold" style={{ color: "var(--blue-11)" }}>العودة لتسجيل الدخول</Link>
          </section>

          <section className="rounded-3xl border p-5 sm:p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
            <h2 className="mb-5 text-lg font-bold" style={{ color: "var(--gray-12)" }}>بيانات المتجر</h2>
            <ShopRequestForm onSubmit={submit} submitting={submitting} allowPicker={false} submitLabel={submitting ? "جاري الإرسال" : "إرسال الطلب"} />
            {submitting ? (
              <div className="mt-3 inline-flex items-center gap-2 text-sm" style={{ color: "var(--gray-11)" }}>
                <FiLoader className="animate-spin" />
                جاري إرسال الطلب
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
