import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiLogOut,
} from "react-icons/fi";
import { VscAccount } from "react-icons/vsc";

import { auth } from "../../api/auth";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_+=\-])[A-Za-z\d@$!%*?&^#_+=\-]{8,}$/;
const PHONE_REGEX = /^05(9|6|4)\d{7}$/;

function FormField({ label, error, optional, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">
        {label}
        {optional ? <span className="mr-1 text-slate-400">(اختياري)</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <FiAlertCircle size={11} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="customer-panel-strong p-6 sm:p-7">
      <div className="mb-5 border-b border-slate-200 pb-4">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const error = type === "error";
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
        error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <div className="flex items-start gap-2">
        {error ? <FiAlertCircle className="mt-0.5 shrink-0" size={15} /> : <FiCheckCircle className="mt-0.5 shrink-0" size={15} />}
        <span>{message}</span>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

export default function CustomerProfile() {
  const user = auth.getUser();

  if (!user || user.role !== "ROLE_CUSTOMER") {
    return <Navigate to="/customer/login" replace />;
  }

  const userId = user.userId ?? user.sub;

  const [info, setInfo] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    age: "",
    nationalIdNumber: "",
  });
  const [infoErrors, setInfoErrors] = useState({});
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState({ type: "", text: "" });

  const setInfoField = (key) => (event) => setInfo((prev) => ({ ...prev, [key]: event.target.value }));

  const validateInfo = () => {
    const errors = {};
    if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errors.email = "البريد الإلكتروني غير صحيح.";
    if (info.phoneNumber && !PHONE_REGEX.test(info.phoneNumber.trim())) {
      errors.phoneNumber = "أدخل رقمًا صحيحًا يبدأ بـ 059 أو 056 أو 054.";
    }
    if (info.age) {
      const ageNum = Number(info.age);
      if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 150) errors.age = "العمر يجب أن يكون بين 0 و150.";
    }
    if (info.fullName && info.fullName.trim().length < 2) errors.fullName = "الاسم يجب أن يحتوي على حرفين على الأقل.";
    if (info.nationalIdNumber && (info.nationalIdNumber.length < 9 || info.nationalIdNumber.length > 20)) {
      errors.nationalIdNumber = "رقم الهوية يجب أن يكون بين 9 و20 خانة.";
    }
    return errors;
  };

  const handleInfoSubmit = async (event) => {
    event.preventDefault();
    setInfoMsg({ type: "", text: "" });
    const errors = validateInfo();
    if (Object.keys(errors).length) {
      setInfoErrors(errors);
      return;
    }

    setInfoErrors({});
    setInfoLoading(true);
    try {
      const payload = {};
      if (info.fullName.trim()) payload.fullName = info.fullName.trim();
      if (info.email.trim()) payload.email = info.email.trim();
      if (info.phoneNumber.trim()) payload.phone = { prefix: "+972", number: info.phoneNumber.trim() };
      if (info.gender) payload.gender = info.gender;
      if (info.age) payload.age = Number(info.age);
      if (info.nationalIdNumber.trim()) payload.nationalIdNumber = info.nationalIdNumber.trim();

      if (!Object.keys(payload).length) {
        setInfoMsg({ type: "error", text: "لم تُدخل أي بيانات جديدة للحفظ." });
        return;
      }

      await auth.updateProfile(userId, payload);
      setInfoMsg({ type: "success", text: "تم تحديث البيانات بنجاح." });
      setInfo({
        fullName: "",
        email: "",
        phoneNumber: "",
        gender: "",
        age: "",
        nationalIdNumber: "",
      });
    } catch (requestError) {
      setInfoMsg({ type: "error", text: requestError.message });
    } finally {
      setInfoLoading(false);
    }
  };

  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [passErrors, setPassErrors] = useState({});
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: "", text: "" });

  const setPassField = (key) => (event) => setPass((prev) => ({ ...prev, [key]: event.target.value }));

  const validatePass = () => {
    const errors = {};
    if (!pass.current) errors.current = "كلمة المرور الحالية مطلوبة.";
    if (!pass.next) errors.next = "كلمة المرور الجديدة مطلوبة.";
    else if (!PASSWORD_REGEX.test(pass.next)) {
      errors.next = "كلمة المرور الجديدة لا تستوفي المتطلبات.";
    }
    if (!pass.confirm) errors.confirm = "يرجى تأكيد كلمة المرور الجديدة.";
    else if (pass.next !== pass.confirm) errors.confirm = "كلمتا المرور غير متطابقتين.";
    return errors;
  };

  const handlePassSubmit = async (event) => {
    event.preventDefault();
    setPassMsg({ type: "", text: "" });
    const errors = validatePass();
    if (Object.keys(errors).length) {
      setPassErrors(errors);
      return;
    }

    setPassErrors({});
    setPassLoading(true);
    try {
      await auth.changePassword(userId, {
        currentPassword: pass.current,
        newPassword: pass.next,
        confirmNewPassword: pass.confirm,
      });
      setPassMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح." });
      setPass({ current: "", next: "", confirm: "" });
    } catch (requestError) {
      setPassMsg({ type: "error", text: requestError.message });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <div className="customer-shell px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 md:px-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <VscAccount size={24} />
            </div>
            <div>
              <h1 className="customer-page-title">ملفي الشخصي</h1>
              <p className="customer-page-subtitle">{user.username}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => auth.logout("/")}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <FiLogOut size={15} />
            تسجيل الخروج
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <SectionCard title="تعديل البيانات الشخصية" subtitle="حدّث بيانات حسابك الأساسية دون التأثير على أي منطق خلفي.">
            <Alert type={infoMsg.type} message={infoMsg.text} />
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="الاسم الكامل" error={infoErrors.fullName} optional>
                  <input type="text" value={info.fullName} onChange={setInfoField("fullName")} placeholder="الاسم الكامل" className={inputCls} />
                </FormField>

                <FormField label="البريد الإلكتروني" error={infoErrors.email} optional>
                  <input type="email" value={info.email} onChange={setInfoField("email")} placeholder="example@mail.com" className={inputCls} dir="ltr" />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="رقم الهاتف" error={infoErrors.phoneNumber} optional>
                  <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <span className="flex h-[50px] shrink-0 items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
                      +972
                    </span>
                    <input
                      type="tel"
                      value={info.phoneNumber}
                      onChange={setInfoField("phoneNumber")}
                      placeholder="05X-XXXXXXX"
                      maxLength={10}
                      className="h-[50px] flex-1 px-4 text-sm text-slate-900 outline-none"
                      dir="ltr"
                    />
                  </div>
                </FormField>

                <FormField label="رقم الهوية" error={infoErrors.nationalIdNumber} optional>
                  <input
                    type="text"
                    value={info.nationalIdNumber}
                    onChange={setInfoField("nationalIdNumber")}
                    placeholder="بين 9 و20 خانة"
                    maxLength={20}
                    className={inputCls}
                    dir="ltr"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="الجنس" error={infoErrors.gender} optional>
                  <select value={info.gender} onChange={setInfoField("gender")} className={inputCls}>
                    <option value="">اختر</option>
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </FormField>

                <FormField label="العمر" error={infoErrors.age} optional>
                  <input type="number" value={info.age} onChange={setInfoField("age")} placeholder="العمر" min={0} max={150} className={inputCls} dir="ltr" />
                </FormField>
              </div>

              <button type="submit" disabled={infoLoading} className="customer-primary-btn disabled:opacity-50">
                {infoLoading ? <FiLoader size={14} className="animate-spin" /> : null}
                {infoLoading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="تغيير كلمة المرور" subtitle="أدخل كلمة المرور الحالية ثم اختر كلمة جديدة متوافقة مع شروط الأمان المطلوبة.">
            <Alert type={passMsg.type} message={passMsg.text} />
            <form onSubmit={handlePassSubmit} className="space-y-4">
              <FormField label="كلمة المرور الحالية" error={passErrors.current}>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={pass.current}
                    onChange={setPassField("current")}
                    placeholder="كلمة المرور الحالية"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-12 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                  <button type="button" onClick={() => setShowCurrent((value) => !value)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showCurrent ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="كلمة المرور الجديدة" error={passErrors.next}>
                  <div className="relative">
                    <input
                      type={showNext ? "text" : "password"}
                      value={pass.next}
                      onChange={setPassField("next")}
                      placeholder="كلمة مرور قوية"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-12 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                    <button type="button" onClick={() => setShowNext((value) => !value)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showNext ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </FormField>

                <FormField label="تأكيد كلمة المرور الجديدة" error={passErrors.confirm}>
                  <input
                    type="password"
                    value={pass.confirm}
                    onChange={setPassField("confirm")}
                    placeholder="أعد كتابة كلمة المرور"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <button type="submit" disabled={passLoading} className="customer-secondary-btn disabled:opacity-50">
                {passLoading ? <FiLoader size={14} className="animate-spin" /> : null}
                {passLoading ? "جارٍ التحديث..." : "تغيير كلمة المرور"}
              </button>
            </form>
          </SectionCard>
        </div>
      </div>

      <Footer />
    </div>
  );
}
