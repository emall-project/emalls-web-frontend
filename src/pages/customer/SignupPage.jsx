import { useState } from "react";
import { FiAlertCircle, FiLoader, FiUserPlus } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { accountsApi } from "../../api/accounts";
import { MediaUuidField } from "../../components/account/MediaUuidField";

const inputClass = "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const inputStyle = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" };

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>{label}</label>
      {children}
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
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
  const [error, setError] = useState("");

  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.username.trim() || !form.fullName.trim() || !form.number.trim() || !form.password || !form.age) {
      setError("املأ الحقول المطلوبة");
      return;
    }

    setSubmitting(true);
    try {
      await accountsApi.auth.signup({
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        phone: { prefix: form.prefix, number: form.number.trim() },
        password: form.password,
        gender: form.gender,
        age: Number(form.age),
        nationalIdNumber: form.nationalIdNumber.trim() || null,
        profilePictureUuid: form.profilePictureUuid.trim() || null,
      });
      navigate("/login", { replace: true, state: { signupComplete: true } });
    } catch (requestError) {
      setError(requestError.message || "فشل إنشاء الحساب");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen px-4 py-10" style={{ background: "var(--gray-2)" }}>
      <div className="mx-auto max-w-3xl rounded-3xl border p-6 sm:p-8" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
        <div className="mb-6">
          <div className="text-sm font-semibold" style={{ color: "var(--blue-11)" }}>سوقنا</div>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إنشاء حساب عميل</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--gray-11)" }}>سيتم إنشاء الحساب من خدمة الحسابات ثم يمكنك تسجيل الدخول.</p>
        </div>

        {error ? (
          <div className="mb-5 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ background: "var(--red-a2)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
            <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم الكامل *">
              <input className={inputClass} style={inputStyle} value={form.fullName} onChange={(event) => set("fullName", event.target.value)} required />
            </Field>
            <Field label="اسم المستخدم *">
              <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.username} onChange={(event) => set("username", event.target.value)} required />
            </Field>
            <Field label="البريد الإلكتروني">
              <input type="email" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.email} onChange={(event) => set("email", event.target.value)} />
            </Field>
            <Field label="كلمة المرور *">
              <input type="password" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.password} onChange={(event) => set("password", event.target.value)} required />
            </Field>
            <Field label="رقم الهاتف *">
              <div className="flex gap-2" dir="ltr">
                <select className={inputClass} style={{ ...inputStyle, maxWidth: 112 }} value={form.prefix} onChange={(event) => set("prefix", event.target.value)}>
                  <option value="+970">+970</option>
                  <option value="+972">+972</option>
                </select>
                <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.number} onChange={(event) => set("number", event.target.value)} placeholder="0591234567" required />
              </div>
            </Field>
            <Field label="العمر *">
              <input type="number" min="0" max="150" className={inputClass} style={inputStyle} value={form.age} onChange={(event) => set("age", event.target.value)} required />
            </Field>
            <Field label="الجنس *">
              <select className={inputClass} style={inputStyle} value={form.gender} onChange={(event) => set("gender", event.target.value)}>
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
                <option value="NOT_SPECIFIED">غير محدد</option>
              </select>
            </Field>
            <Field label="رقم الهوية">
              <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.nationalIdNumber} onChange={(event) => set("nationalIdNumber", event.target.value)} />
            </Field>
          </div>

          <MediaUuidField
            label="صورة الملف الشخصي"
            value={form.profilePictureUuid}
            onChange={(value) => set("profilePictureUuid", value)}
            allowPicker={false}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--blue-9)", color: "#fff" }}
            >
              {submitting ? <FiLoader className="animate-spin" size={16} /> : <FiUserPlus size={16} />}
              إنشاء الحساب
            </button>
            <Link to="/login" className="text-sm font-semibold" style={{ color: "var(--blue-11)" }}>لدي حساب بالفعل</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
