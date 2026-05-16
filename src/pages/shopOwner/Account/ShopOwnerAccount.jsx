import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiUser, FiMail, FiPhone, FiLock, FiShield, FiHash,
  FiCamera, FiEye, FiEyeOff, FiCheckCircle, FiAlertTriangle, FiX,
} from "react-icons/fi";
import { auth } from "../../../api/auth";
import { mediaApi } from "../../../api/mediaApi";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_+=\-])[A-Za-z\d@$!%*?&^#_+=\-]{8,}$/;

const MAX_BYTES = 1.5 * 1024 * 1024;

function getInitials(name = "") {
  return (
    name.trim().split(/\s+/).map((w) => w[0] || "").slice(0, 2).join("").toUpperCase() || "U"
  );
}

// ── Image compression ─────────────────────────────────────────────────────────
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_BYTES && file.type !== "image/bmp") { resolve(file); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("تعذّر ضغط الصورة")); };
    img.onload  = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > 1920 || h > 1920) { const s = Math.min(1920 / w, 1920 / h); w = Math.round(w * s); h = Math.round(h * s); }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      let q = 0.85;
      const tryNext = () => canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("تعذّر ضغط الصورة")); return; }
        if (blob.size <= MAX_BYTES || q <= 0.3)
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        else { q -= 0.1; tryNext(); }
      }, "image/jpeg", q);
      tryNext();
    };
    img.src = url;
  });
}

// ── Fetch own profile ─────────────────────────────────────────────────────────
// Tries endpoints from most to least specific. The admin-only
// GET /accounts/api/users/{id} is intentionally excluded — it returns 403
// for ROLE_SHOP_OWNER. We try the profile sub-path (same path as the PUT)
// and the common self-service /me pattern instead.
async function fetchOwnProfile(userId) {
  const headers = auth.getHeaders();
  const candidates = [
    `/accounts/api/users/${userId}/profile/info`,
    `/accounts/api/users/me`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        return json?.data ?? json ?? null;
      }
    } catch { /* try next */ }
  }
  return null;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 16, white = false }) {
  return (
    <svg className="animate-spin shrink-0" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10"
        stroke={white ? "rgba(255,255,255,0.3)" : "var(--gray-a5)"} strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10"
        stroke={white ? "#fff" : "var(--blue-9)"} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  const ok = type === "success";
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium w-[90vw] max-w-sm"
      style={{
        background:  ok ? "var(--green-2)" : "var(--red-2)",
        borderColor: ok ? "var(--green-6)" : "var(--red-6)",
        color:       ok ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      {ok ? <FiCheckCircle size={15} /> : <FiAlertTriangle size={15} />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity shrink-0">
        <FiX size={13} />
      </button>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon: Icon, accentColor = "#2563eb", saved, children }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
      <div className="px-6 py-4 border-b flex items-center justify-between gap-3"
        style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${accentColor}22` }}>
              <Icon size={15} style={{ color: accentColor }} />
            </span>
          )}
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</h3>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>{subtitle}</p>}
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-semibold shrink-0"
            style={{ color: "var(--green-11)" }}>
            <FiCheckCircle size={12} /> تم الحفظ
          </span>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold block" style={{ color: "var(--gray-11)" }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: "var(--red-11)" }}>
          <FiAlertTriangle size={10} /> {error}
        </p>
      )}
      {hint && !error && <p className="text-xs" style={{ color: "var(--gray-9)" }}>{hint}</p>}
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
const INPUT_BASE = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" };

function onFocus(e) { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,.18)"; }
function onBlur(e)  { e.target.style.borderColor = "var(--gray-a6)"; e.target.style.boxShadow = "none"; }

function TextInput({ value, onChange, placeholder, dir = "rtl", type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 rounded-xl px-4 text-sm outline-none border transition-colors"
      style={{ ...INPUT_BASE, direction: dir, textAlign: dir === "ltr" ? "left" : "right" }}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

// Eye icon on the RIGHT end — correct for LTR password text (pr-11 = space for button)
function PasswordInput({ value, onChange, placeholder, show, onToggleShow }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl px-4 pr-11 text-sm outline-none border transition-colors"
        style={{ ...INPUT_BASE, direction: "ltr", textAlign: "left" }}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <button type="button" onClick={onToggleShow} tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: "var(--gray-9)" }}>
        {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
      </button>
    </div>
  );
}

function SubmitBtn({ loading, label, loadingLabel, bg = "#2563eb" }) {
  return (
    <button type="submit" disabled={loading}
      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 min-w-32"
      style={{ background: bg, color: "#fff" }}>
      {loading && <Spinner size={15} white />}
      {loading ? loadingLabel : label}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ShopOwnerAccount() {
  const jwtUser  = auth.getUser();
  const userId   = jwtUser?.userId ?? jwtUser?.sub;
  const shopId   = auth.getShopId();
  const jwtName  = jwtUser?.fullName || jwtUser?.username || "";
  const initials = getInitials(jwtName);

  // ── Remote profile ─────────────────────────────────────────────────────────
  const [profile,     setProfile]     = useState(null);
  const [profLoading, setProfLoading] = useState(true);

  // ── Photo ──────────────────────────────────────────────────────────────────
  const [photoPreview,   setPhotoPreview]   = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Info form ──────────────────────────────────────────────────────────────
  const [info,       setInfo]       = useState({ fullName: "", email: "", phoneNumber: "" });
  const [infoErrors, setInfoErrors] = useState({});
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSaved,   setInfoSaved]   = useState(false);

  // ── Password form ──────────────────────────────────────────────────────────
  const [pass,       setPass]       = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext,    setShowNext]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passErrors,  setPassErrors]  = useState({});
  const [passLoading, setPassLoading] = useState(false);
  const [passSaved,   setPassSaved]   = useState(false);

  // ── Single toast ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  // ── Fetch profile on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setProfLoading(false); return; }
    fetchOwnProfile(userId).then((data) => {
      if (data) {
        setProfile(data);
        setInfo({
          fullName:    data.fullName        || jwtUser?.fullName || "",
          email:       data.email           || "",
          phoneNumber: data.phone?.number   || "",
        });
        const photo =
          data.profilePictureImage?.mediumFileUrl ||
          data.profilePictureImage?.originalFileUrl ||
          "";
        if (photo) setPhotoPreview(photo);
      } else {
        setInfo((p) => ({ ...p, fullName: jwtUser?.fullName || "" }));
      }
      setProfLoading(false);
    });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName  = profile?.fullName      || jwtUser?.fullName  || jwtUser?.username || "صاحب المتجر";
  const displayEmail = profile?.email         || "";
  const displayPhone = profile?.phone?.number || "";

  // ── Photo upload ───────────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (!shopId) { showToast("تعذر تحديد المتجر المرتبط بالحساب", "error"); return; }

    // Immediate local preview
    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    setPhotoUploading(true);

    try {
      const compressed = await compressImage(file);
      const result     = await mediaApi.uploadForStore(compressed, shopId);
      const uuid       = result?.data?.id;
      if (!uuid) throw new Error("لم يتم الحصول على معرف الصورة من الخادم");

      await auth.updateProfile(userId, { profilePictureUuid: uuid });

      showToast("تم تحديث الصورة الشخصية بنجاح");

      // Refresh profile to get the real S3 URL
      const fresh = await fetchOwnProfile(userId);
      if (fresh) {
        setProfile(fresh);
        const realUrl =
          fresh.profilePictureImage?.mediumFileUrl ||
          fresh.profilePictureImage?.originalFileUrl ||
          localPreview;
        setPhotoPreview(realUrl);
      }
    } catch (err) {
      // Revert to previous photo on error
      const prev =
        profile?.profilePictureImage?.mediumFileUrl ||
        profile?.profilePictureImage?.originalFileUrl ||
        "";
      setPhotoPreview(prev);
      showToast(err.message || "فشل تحديث الصورة الشخصية", "error");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Info handlers ──────────────────────────────────────────────────────────
  const setInfoField = (key) => (val) => {
    setInfo((p) => ({ ...p, [key]: val }));
    setInfoSaved(false);
    setInfoErrors((p) => ({ ...p, [key]: undefined, _: undefined }));
  };

  const validateInfo = () => {
    const e = {};
    if (info.fullName.trim() && info.fullName.trim().length < 2)
      e.fullName = "الاسم يجب أن يحتوي على حرفين على الأقل";
    if (info.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim()))
      e.email = "البريد الإلكتروني غير صحيح";
    if (info.phoneNumber.trim() && !/^05(9|6|4)\d{7}$/.test(info.phoneNumber.trim()))
      e.phoneNumber = "يبدأ بـ 059 أو 056 أو 054 ويتكون من 10 أرقام";
    return e;
  };

  const handleInfoSubmit = async (ev) => {
    ev.preventDefault();
    setInfoSaved(false);
    const errors = validateInfo();
    if (Object.keys(errors).length) { setInfoErrors(errors); return; }
    setInfoErrors({});

    const payload = {};
    if (info.fullName.trim())    payload.fullName = info.fullName.trim();
    if (info.email.trim())       payload.email    = info.email.trim();
    if (info.phoneNumber.trim()) payload.phone    = { prefix: "+972", number: info.phoneNumber.trim() };

    if (!Object.keys(payload).length) {
      setInfoErrors({ _: "أدخل قيمة واحدة على الأقل للتحديث" });
      return;
    }

    setInfoLoading(true);
    try {
      await auth.updateProfile(userId, payload);
      setInfoSaved(true);
      showToast("تم تحديث البيانات بنجاح");
      const fresh = await fetchOwnProfile(userId);
      if (fresh) setProfile(fresh);
    } catch (err) {
      showToast(err.message || "فشل تحديث البيانات", "error");
    } finally {
      setInfoLoading(false);
    }
  };

  // ── Password handlers ──────────────────────────────────────────────────────
  const setPassField = (key) => (val) => {
    setPass((p) => ({ ...p, [key]: val }));
    setPassSaved(false);
    setPassErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validatePass = () => {
    const e = {};
    if (!pass.current) e.current = "كلمة المرور الحالية مطلوبة";
    if (!pass.next)    e.next    = "كلمة المرور الجديدة مطلوبة";
    else if (!PASSWORD_REGEX.test(pass.next))
      e.next = "8 أحرف، أحرف كبيرة وصغيرة، رقم، ورمز خاص";
    if (!pass.confirm) e.confirm = "تأكيد كلمة المرور مطلوب";
    else if (pass.next !== pass.confirm) e.confirm = "كلمتا المرور غير متطابقتين";
    return e;
  };

  const handlePassSubmit = async (ev) => {
    ev.preventDefault();
    setPassSaved(false);
    const errors = validatePass();
    if (Object.keys(errors).length) { setPassErrors(errors); return; }
    setPassErrors({});
    setPassLoading(true);
    try {
      await auth.changePassword(userId, {
        currentPassword:    pass.current,
        newPassword:        pass.next,
        confirmNewPassword: pass.confirm,
      });
      setPassSaved(true);
      setPass({ current: "", next: "", confirm: "" });
      showToast("تم تغيير كلمة المرور بنجاح");
    } catch (err) {
      showToast(err.message || "فشل تغيير كلمة المرور", "error");
    } finally {
      setPassLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hidden file input for photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <div dir="rtl" className="space-y-5">

        {/* ── Identity hero card ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>

          {/* Accent line */}
          <div className="h-1" style={{ background: "linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)" }} />

          <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* ── Avatar with camera overlay ── */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold text-white select-none"
                style={{
                  background: photoPreview ? undefined : "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                  boxShadow:  "0 4px 20px rgba(37,99,235,0.25)",
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt={displayName} className="w-full h-full object-cover" />
                ) : profLoading ? (
                  <Spinner size={24} white />
                ) : (
                  initials
                )}
              </div>

              {/* Camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading || profLoading}
                title="تغيير الصورة الشخصية"
                className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#2563eb", borderColor: "var(--gray-1)", color: "#fff" }}
              >
                {photoUploading ? <Spinner size={11} white /> : <FiCamera size={12} />}
              </button>
            </div>

            {/* ── User details ── */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate leading-tight" style={{ color: "var(--gray-12)" }}>
                {displayName}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm" style={{ color: "var(--gray-10)" }}>
                {jwtUser?.username && <span dir="ltr">@{jwtUser.username}</span>}
                {displayEmail && (
                  <span className="flex items-center gap-1" dir="ltr">
                    <FiMail size={11} />{displayEmail}
                  </span>
                )}
                {displayPhone && (
                  <span className="flex items-center gap-1" dir="ltr">
                    <FiPhone size={11} />+972 {displayPhone}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                  <FiShield size={10} /> صاحب متجر
                </span>
                {shopId && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }} dir="ltr">
                    <FiHash size={10} /> Store #{shopId}
                  </span>
                )}
              </div>

              {/* Photo upload hint */}
              <p className="text-xs mt-2" style={{ color: "var(--gray-9)" }}>
                {photoUploading
                  ? "جارٍ رفع الصورة..."
                  : "انقر على أيقونة الكاميرا لتغيير الصورة الشخصية"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Personal info ── */}
        <SectionCard
          title="تعديل البيانات الشخصية"
          subtitle="الحقول اختيارية — أدخل فقط ما تريد تحديثه"
          icon={FiUser}
          accentColor="#2563eb"
          saved={infoSaved}
        >
          {infoErrors._ && (
            <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
              style={{ background: "var(--red-a3)", color: "var(--red-11)" }}>
              <FiAlertTriangle size={13} /> {infoErrors._}
            </div>
          )}
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="الاسم الكامل" error={infoErrors.fullName}>
                <TextInput
                  value={info.fullName}
                  onChange={setInfoField("fullName")}
                  placeholder={displayName || "الاسم الكامل"}
                />
              </Field>
              <Field label="البريد الإلكتروني" error={infoErrors.email}>
                <TextInput
                  value={info.email}
                  onChange={setInfoField("email")}
                  placeholder={displayEmail || "example@mail.com"}
                  dir="ltr"
                  type="email"
                />
              </Field>
            </div>

            <Field
              label="رقم الهاتف"
              error={infoErrors.phoneNumber}
              hint="أرقام فلسطينية: 059 أو 056 أو 054"
            >
              {/* RTL: +972 prefix lands on right, input fills the left */}
              <div className="flex h-10 overflow-hidden rounded-xl border transition-colors"
                style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}>
                <span className="flex items-center shrink-0 px-3.5 text-xs font-mono font-bold border-l"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-9)", background: "var(--gray-a3)" }}>
                  +972
                </span>
                <input
                  type="tel"
                  value={info.phoneNumber}
                  onChange={(e) => setInfoField("phoneNumber")(e.target.value)}
                  placeholder={displayPhone || "05XXXXXXXX"}
                  maxLength={10}
                  className="flex-1 px-4 text-sm outline-none bg-transparent"
                  style={{ color: "var(--gray-12)", direction: "ltr", textAlign: "left" }}
                />
              </div>
            </Field>

            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <SubmitBtn
                loading={infoLoading}
                label="حفظ التغييرات"
                loadingLabel="جارٍ الحفظ..."
                bg="#2563eb"
              />
              {infoSaved && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--green-11)" }}>
                  <FiCheckCircle size={14} /> تم الحفظ بنجاح
                </span>
              )}
            </div>
          </form>
        </SectionCard>

        {/* ── Change password ── */}
        <SectionCard
          title="تغيير كلمة المرور"
          subtitle="أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة قوية"
          icon={FiLock}
          accentColor="#7c3aed"
          saved={passSaved}
        >
          <form onSubmit={handlePassSubmit} className="space-y-4">
            <Field label="كلمة المرور الحالية" error={passErrors.current}>
              <PasswordInput
                value={pass.current}
                onChange={setPassField("current")}
                placeholder="••••••••"
                show={showCurrent}
                onToggleShow={() => setShowCurrent((v) => !v)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="كلمة المرور الجديدة" error={passErrors.next}>
                <PasswordInput
                  value={pass.next}
                  onChange={setPassField("next")}
                  placeholder="••••••••"
                  show={showNext}
                  onToggleShow={() => setShowNext((v) => !v)}
                />
              </Field>
              <Field label="تأكيد كلمة المرور الجديدة" error={passErrors.confirm}>
                <PasswordInput
                  value={pass.confirm}
                  onChange={setPassField("confirm")}
                  placeholder="••••••••"
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm((v) => !v)}
                />
              </Field>
            </div>

            <p className="text-xs" style={{ color: "var(--gray-9)" }}>
              * 8 أحرف على الأقل، أحرف كبيرة وصغيرة، رقم، ورمز خاص (@$!%*?&...)
            </p>

            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <SubmitBtn
                loading={passLoading}
                label="تغيير كلمة المرور"
                loadingLabel="جارٍ التحديث..."
                bg="#7c3aed"
              />
              {passSaved && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--green-11)" }}>
                  <FiCheckCircle size={14} /> تم التغيير بنجاح
                </span>
              )}
            </div>
          </form>
        </SectionCard>

      </div>
    </>
  );
}
