import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiLoader, FiLogOut, FiRefreshCw, FiSave } from "react-icons/fi";
import { accountsApi, unwrapAccountPayload } from "../../api/accounts";
import { MediaUuidField } from "../../components/account/MediaUuidField";
import { useAuth } from "../../auth/AuthContext";

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

export default function CustomerAccountPage() {
  const { session, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    prefix: "+970",
    number: "",
    gender: "NOT_SPECIFIED",
    age: "",
    nationalIdNumber: "",
    profilePictureUuid: "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const setPassword = (key, value) => setPasswordForm((previous) => ({ ...previous, [key]: value }));

  const load = useCallback(async () => {
    if (!session?.userId) return;
    setLoading(true);
    setMessage(null);
    try {
      const [dashboardResponse, userResponse] = await Promise.all([
        accountsApi.dashboard.customer(),
        accountsApi.users.byId(session.userId),
      ]);
      const user = unwrapAccountPayload(userResponse) || {};
      setDashboard(unwrapAccountPayload(dashboardResponse));
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        prefix: user.phone?.prefix || "+970",
        number: user.phone?.number || "",
        gender: user.gender || "NOT_SPECIFIED",
        age: user.age ?? "",
        nationalIdNumber: user.nationalIdNumber || "",
        profilePictureUuid: user.profilePictureUuid || "",
      });
      setProfileFile(user.profilePictureImage || user.profilePicture || null);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "فشل تحميل الحساب" });
    } finally {
      setLoading(false);
    }
  }, [session?.userId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await accountsApi.users.profile.updateInfo(session.userId, {
        fullName: form.fullName.trim() || null,
        email: form.email.trim() || null,
        phone: form.number.trim() ? { prefix: form.prefix, number: form.number.trim() } : null,
        gender: form.gender,
        age: form.age === "" ? null : Number(form.age),
        nationalIdNumber: form.nationalIdNumber.trim() || null,
        profilePictureUuid: form.profilePictureUuid.trim() || null,
      });
      setMessage({ type: "success", text: "تم حفظ الملف الشخصي" });
      load();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "فشل حفظ الملف الشخصي" });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    setMessage(null);
    try {
      await accountsApi.users.profile.changePassword(session.userId, passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setMessage({ type: "success", text: "تم تغيير كلمة المرور" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "فشل تغيير كلمة المرور" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen px-4 py-8" style={{ background: "var(--gray-2)" }}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--blue-11)" }}>حساب العميل</div>
            <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>{form.fullName || session?.fullName || "حسابي"}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>@{session?.username}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
              {loading ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
              تحديث
            </button>
            <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold" style={{ background: "var(--red-a3)", color: "var(--red-11)" }}>
              <FiLogOut />
              خروج
            </button>
          </div>
        </div>

        {message ? (
          <div className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm" style={{
            background: message.type === "success" ? "var(--green-a2)" : "var(--red-a2)",
            borderColor: message.type === "success" ? "var(--green-a6)" : "var(--red-a6)",
            color: message.type === "success" ? "var(--green-11)" : "var(--red-11)",
          }}>
            <FiAlertCircle className="mt-0.5 shrink-0" />
            {message.text}
          </div>
        ) : null}

        {dashboard ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["العمر", dashboard.age ?? "-"],
              ["الجنس", dashboard.gender || "-"],
              ["المفضلة", dashboard.favoriteCount ?? dashboard.favoritesCount ?? "-"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border p-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
                <div className="text-xs" style={{ color: "var(--gray-10)" }}>{label}</div>
                <div className="mt-1 text-xl font-bold" style={{ color: "var(--gray-12)" }}>{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <form onSubmit={saveProfile} className="space-y-5 rounded-3xl border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
            <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>البيانات الشخصية</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل">
                <input className={inputClass} style={inputStyle} value={form.fullName} onChange={(event) => set("fullName", event.target.value)} />
              </Field>
              <Field label="البريد الإلكتروني">
                <input type="email" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.email} onChange={(event) => set("email", event.target.value)} />
              </Field>
              <Field label="رقم الهاتف">
                <div className="flex gap-2" dir="ltr">
                  <select className={inputClass} style={{ ...inputStyle, maxWidth: 112 }} value={form.prefix} onChange={(event) => set("prefix", event.target.value)}>
                    <option value="+970">+970</option>
                    <option value="+972">+972</option>
                  </select>
                  <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.number} onChange={(event) => set("number", event.target.value)} />
                </div>
              </Field>
              <Field label="العمر">
                <input type="number" min="0" max="150" className={inputClass} style={inputStyle} value={form.age} onChange={(event) => set("age", event.target.value)} />
              </Field>
              <Field label="الجنس">
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
              file={profileFile}
              onFileChange={setProfileFile}
              allowPicker={false}
            />

            <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
              {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
              حفظ البيانات
            </button>
          </form>

          <form onSubmit={changePassword} className="space-y-4 rounded-3xl border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
            <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>كلمة المرور</h2>
            <Field label="كلمة المرور الحالية">
              <input type="password" className={inputClass} style={inputStyle} value={passwordForm.currentPassword} onChange={(event) => setPassword("currentPassword", event.target.value)} required />
            </Field>
            <Field label="كلمة المرور الجديدة">
              <input type="password" className={inputClass} style={inputStyle} value={passwordForm.newPassword} onChange={(event) => setPassword("newPassword", event.target.value)} required />
            </Field>
            <Field label="تأكيد كلمة المرور">
              <input type="password" className={inputClass} style={inputStyle} value={passwordForm.confirmNewPassword} onChange={(event) => setPassword("confirmNewPassword", event.target.value)} required />
            </Field>
            <button type="submit" disabled={changingPassword} className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--gray-12)", color: "var(--gray-1)" }}>
              {changingPassword ? <FiLoader className="animate-spin" /> : <FiSave />}
              تغيير كلمة المرور
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
