import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiLoader, FiLogOut, FiRefreshCw, FiRotateCcw, FiSave, FiShoppingBag, FiShoppingCart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { accountsApi, unwrapAccountPayload } from "../../api/accounts";
import { orderHubApi, unwrapOrderHubPayload } from "../../api/orderHub";
import { MediaUuidField } from "../../components/account/MediaUuidField";
import { useAuth } from "../../auth/AuthContext";
import { buildApiFormError } from "../../utils/apiErrors";
import { formatOrderHubStatus } from "../../utils/orderHubUi";

const inputClass = "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const inputStyle = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" };

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>{label}</label>
      {children}
      {error ? <p className="text-xs" style={{ color: "var(--red-9)" }}>{error}</p> : null}
    </div>
  );
}

const PROFILE_FIELD_MAP = {
  fullName: "fullName",
  email: "email",
  phone: "number",
  "phone.number": "number",
  "phone.prefix": "prefix",
  gender: "gender",
  age: "age",
  nationalIdNumber: "nationalIdNumber",
  profilePictureUuid: "profilePictureUuid",
};

const PASSWORD_FIELD_MAP = {
  currentPassword: "currentPassword",
  newPassword: "newPassword",
  confirmNewPassword: "confirmNewPassword",
};

export default function CustomerAccountPage() {
  const { session, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [commerceDashboard, setCommerceDashboard] = useState(null);
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
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [message, setMessage] = useState(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});

  const set = (key, value) => {
    setProfileFieldErrors((previous) => ({ ...previous, [key]: "" }));
    setForm((previous) => ({ ...previous, [key]: value }));
  };
  const setPassword = (key, value) => {
    setPasswordFieldErrors((previous) => ({ ...previous, [key]: "" }));
    setPasswordForm((previous) => ({ ...previous, [key]: value }));
  };

  const load = useCallback(async () => {
    if (!session?.userId) return;
    setLoading(true);
    setMessage(null);
    try {
      const [dashboardResponse, userResponse, commerceDashboardResponse] = await Promise.all([
        accountsApi.dashboard.customer(),
        accountsApi.users.byId(session.userId),
        orderHubApi.dashboard.getCustomer().catch(() => null),
      ]);
      const user = unwrapAccountPayload(userResponse) || {};
      setDashboard(unwrapAccountPayload(dashboardResponse));
      setCommerceDashboard(unwrapOrderHubPayload(commerceDashboardResponse));
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
    setProfileFieldErrors({});

    if (uploadingProfile) {
      setSaving(false);
      setMessage({ type: "error", text: "انتظر حتى ينتهي رفع الصورة" });
      return;
    }

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
      const formError = buildApiFormError(error, PROFILE_FIELD_MAP, "فشل حفظ الملف الشخصي");
      setProfileFieldErrors(formError.fieldErrors);
      setMessage({ type: "error", text: formError.message });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    setMessage(null);
    setPasswordFieldErrors({});
    try {
      await accountsApi.users.profile.changePassword(session.userId, passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setMessage({ type: "success", text: "تم تغيير كلمة المرور" });
    } catch (error) {
      const formError = buildApiFormError(error, PASSWORD_FIELD_MAP, "فشل تغيير كلمة المرور");
      setPasswordFieldErrors(formError.fieldErrors);
      setMessage({ type: "error", text: formError.message });
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
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ["العمر", dashboard.age ?? "-"],
              ["الجنس", dashboard.gender || "-"],
              ["اكتمال الملف", dashboard.profileCompletionPercent != null ? `${dashboard.profileCompletionPercent}%` : "-"],
              ["المفضلة", dashboard.favoriteCount ?? dashboard.favoritesCount ?? "-"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border p-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
                <div className="text-xs" style={{ color: "var(--gray-10)" }}>{label}</div>
                <div className="mt-1 text-xl font-bold" style={{ color: "var(--gray-12)" }}>{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <Link
            to="/cart"
            className="rounded-3xl border p-5 text-right transition hover:opacity-90"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FiShoppingCart />
              السلال النشطة
            </div>
            <div className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>
              مراجعة السلال الحالية وإتمام الطلبات.
            </div>
          </Link>
          <Link
            to="/orders"
            className="rounded-3xl border p-5 text-right transition hover:opacity-90"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FiShoppingBag />
              طلباتي
            </div>
            <div className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>
              متابعة حالة الطلبات وتفاصيلها.
            </div>
          </Link>
          <Link
            to="/returns"
            className="rounded-3xl border p-5 text-right transition hover:opacity-90"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FiRotateCcw />
              الإرجاعات
            </div>
            <div className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>
              عرض طلبات الإرجاع وحالاتها.
            </div>
          </Link>
        </div>

        {commerceDashboard ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>ملخص التجارة</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-10)" }}>إجمالي الطلبات</div>
                  <div className="mt-1 text-xl font-bold" style={{ color: "var(--gray-12)" }}>
                    {commerceDashboard.orderKpis?.totalOrders ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-10)" }}>الطلبات النشطة</div>
                  <div className="mt-1 text-xl font-bold" style={{ color: "var(--gray-12)" }}>
                    {commerceDashboard.orderKpis?.activeOrders ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-10)" }}>تم تسليمها</div>
                  <div className="mt-1 text-xl font-bold" style={{ color: "var(--gray-12)" }}>
                    {commerceDashboard.orderKpis?.deliveredOrders ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-10)" }}>السلال النشطة</div>
                  <div className="mt-1 text-xl font-bold" style={{ color: "var(--gray-12)" }}>
                    {commerceDashboard.activeCarts?.carts?.length ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-10)" }}>الإرجاعات النشطة</div>
                  <div className="mt-1 text-xl font-bold" style={{ color: "var(--gray-12)" }}>
                    {commerceDashboard.activeReturns?.returns?.length ?? commerceDashboard.orderKpis?.returnedOrders ?? "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>أحدث النشاطات</h2>
              <div className="mt-4 space-y-3">
                {(commerceDashboard.recentOrders?.orders || []).slice(0, 3).map((order) => (
                  <Link
                    key={order.shopOrderId}
                    to={`/orders/${order.shopOrderId}`}
                    className="block rounded-2xl border px-4 py-3"
                    style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}
                  >
                    <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                      {order.shopInfo?.name || `طلب #${order.shopOrderId}`}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                      {formatOrderHubStatus(order.status)}
                    </div>
                  </Link>
                ))}
                {!commerceDashboard.recentOrders?.orders?.length ? (
                  <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)", color: "var(--gray-10)" }}>
                    لا توجد طلبات حديثة بعد.
                  </div>
                ) : null}
              </div>

              <h3 className="mt-6 text-sm font-bold" style={{ color: "var(--gray-12)" }}>الإرجاعات النشطة</h3>
              <div className="mt-3 space-y-3">
                {(commerceDashboard.activeReturns?.returns || []).slice(0, 2).map((item) => (
                  <Link
                    key={item.returnRequestId}
                    to={`/returns/${item.returnRequestId}`}
                    className="block rounded-2xl border px-4 py-3"
                    style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}
                  >
                    <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                      {item.reason || `طلب #${item.returnRequestId}`}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                      {formatOrderHubStatus(item.status)}
                    </div>
                  </Link>
                ))}
                {!commerceDashboard.activeReturns?.returns?.length ? (
                  <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)", color: "var(--gray-10)" }}>
                    لا توجد إرجاعات نشطة حاليًا.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <form onSubmit={saveProfile} className="space-y-5 rounded-3xl border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
            <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>البيانات الشخصية</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل" error={profileFieldErrors.fullName}>
                <input className={inputClass} style={inputStyle} value={form.fullName} onChange={(event) => set("fullName", event.target.value)} />
              </Field>
              <Field label="البريد الإلكتروني" error={profileFieldErrors.email}>
                <input type="email" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.email} onChange={(event) => set("email", event.target.value)} />
              </Field>
              <Field label="رقم الهاتف" error={profileFieldErrors.number || profileFieldErrors.prefix}>
                <div className="flex gap-2" dir="ltr">
                  <select className={inputClass} style={{ ...inputStyle, maxWidth: 112 }} value={form.prefix} onChange={(event) => set("prefix", event.target.value)}>
                    <option value="+970">+970</option>
                    <option value="+972">+972</option>
                  </select>
                  <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.number} onChange={(event) => set("number", event.target.value)} />
                </div>
              </Field>
              <Field label="العمر" error={profileFieldErrors.age}>
                <input type="number" min="0" max="150" className={inputClass} style={inputStyle} value={form.age} onChange={(event) => set("age", event.target.value)} />
              </Field>
              <Field label="الجنس" error={profileFieldErrors.gender}>
                <select className={inputClass} style={inputStyle} value={form.gender} onChange={(event) => set("gender", event.target.value)}>
                  <option value="MALE">ذكر</option>
                  <option value="FEMALE">أنثى</option>
                  <option value="NOT_SPECIFIED">غير محدد</option>
                </select>
              </Field>
              <Field label="رقم الهوية" error={profileFieldErrors.nationalIdNumber}>
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
              uploadMode="temp"
              error={profileFieldErrors.profilePictureUuid}
              onUploadingChange={setUploadingProfile}
            />

            <button type="submit" disabled={saving || uploadingProfile} className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
              {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
              {uploadingProfile ? "جاري رفع الصورة" : "حفظ البيانات"}
            </button>
          </form>

          <form onSubmit={changePassword} className="space-y-4 rounded-3xl border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
            <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>كلمة المرور</h2>
            <Field label="كلمة المرور الحالية" error={passwordFieldErrors.currentPassword}>
              <input type="password" className={inputClass} style={inputStyle} value={passwordForm.currentPassword} onChange={(event) => setPassword("currentPassword", event.target.value)} required />
            </Field>
            <Field label="كلمة المرور الجديدة" error={passwordFieldErrors.newPassword}>
              <input type="password" className={inputClass} style={inputStyle} value={passwordForm.newPassword} onChange={(event) => setPassword("newPassword", event.target.value)} required />
            </Field>
            <Field label="تأكيد كلمة المرور" error={passwordFieldErrors.confirmNewPassword}>
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
