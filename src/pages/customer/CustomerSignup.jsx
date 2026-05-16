import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLoader,
} from "react-icons/fi";

import { auth } from "../../api/auth";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_+=\-])[A-Za-z\d@$!%*?&^#_+=\-]{8,}$/;
const PHONE_REGEX = /^05(9|6|4)\d{7}$/;

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: "8 أحرف على الأقل", ok: password.length >= 8 },
    { label: "حرف كبير", ok: /[A-Z]/.test(password) },
    { label: "حرف صغير", ok: /[a-z]/.test(password) },
    { label: "رقم", ok: /\d/.test(password) },
    { label: "رمز خاص", ok: /[@$!%*?&^#_+=\-]/.test(password) },
  ];

  return (
    <ul className="mt-3 space-y-2">
      {checks.map((check) => (
        <li key={check.label} className="flex items-center gap-2 text-xs">
          <FiCheck size={12} className={check.ok ? "text-emerald-600" : "text-slate-300"} />
          <span className={check.ok ? "text-emerald-600" : "text-slate-500"}>{check.label}</span>
        </li>
      ))}
    </ul>
  );
}

function Field({ label, error, children, optional }) {
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

export default function CustomerSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    gender: "",
    age: "",
    nationalIdNumber: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const validate = () => {
    const errors = {};
    if (!form.username.trim()) errors.username = "اسم المستخدم مطلوب.";
    else if (form.username.trim().length < 3) errors.username = "يجب إدخال 3 أحرف على الأقل.";

    if (!form.fullName.trim()) errors.fullName = "الاسم الكامل مطلوب.";

    if (!form.phoneNumber.trim()) errors.phoneNumber = "رقم الهاتف مطلوب.";
    else if (!PHONE_REGEX.test(form.phoneNumber.trim())) {
      errors.phoneNumber = "أدخل رقمًا صحيحًا يبدأ بـ 059 أو 056 أو 054.";
    }

    if (!form.password) errors.password = "كلمة المرور مطلوبة.";
    else if (!PASSWORD_REGEX.test(form.password)) errors.password = "كلمة المرور لا تستوفي المتطلبات.";

    if (!form.confirmPassword) errors.confirmPassword = "يرجى تأكيد كلمة المرور.";
    else if (form.password !== form.confirmPassword) errors.confirmPassword = "كلمتا المرور غير متطابقتين.";

    if (!form.gender) errors.gender = "يرجى اختيار الجنس.";

    if (!form.age) errors.age = "العمر مطلوب.";
    else {
      const ageNum = Number(form.age);
      if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 150) {
        errors.age = "العمر يجب أن يكون بين 0 و150.";
      }
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "البريد الإلكتروني غير صحيح.";
    }

    if (form.nationalIdNumber && (form.nationalIdNumber.length < 9 || form.nationalIdNumber.length > 20)) {
      errors.nationalIdNumber = "رقم الهوية يجب أن يكون بين 9 و20 خانة.";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        phone: { prefix: "+972", number: form.phoneNumber.trim() },
        password: form.password,
        gender: form.gender,
        age: Number(form.age),
      };

      if (form.email.trim()) payload.email = form.email.trim();
      if (form.nationalIdNumber.trim()) payload.nationalIdNumber = form.nationalIdNumber.trim();

      await auth.signup(payload);
      setSuccess(true);
      setTimeout(() => navigate("/customer/login"), 2500);
    } catch (requestError) {
      setServerError(requestError.message || "حدث خطأ أثناء إنشاء الحساب.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[var(--customer-bg)] px-4">
        <div className="customer-panel-strong max-w-sm px-8 py-10 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <FiCheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">تم إنشاء الحساب بنجاح</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">سيتم تحويلك الآن إلى صفحة تسجيل الدخول.</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--customer-bg)]">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_minmax(0,1.05fr)]">
        <aside className="hidden bg-[linear-gradient(160deg,#0f6dff_0%,#38bdf8_100%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-3xl font-extrabold">سوقنا</div>
            <p className="mt-2 text-sm text-white/70">إنشاء حساب جديد</p>
          </div>

          <div>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
              حساب العميل
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-snug">
              افتح حسابك
              <br />
              وابدأ التسوق
            </h1>
            <p className="mt-4 max-w-md text-sm leading-8 text-white/80">
              أنشئ حسابك خلال دقائق للوصول إلى المفضلة، الطلبات، وتجربة شراء أوضح وأكثر راحة.
            </p>
          </div>

          <p className="text-xs text-white/45">© {new Date().getFullYear()} سوقنا</p>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[560px]">
            <div className="mb-8 text-center lg:hidden">
              <div className="text-4xl font-extrabold text-[var(--customer-accent)]">سوقنا</div>
              <p className="mt-2 text-sm text-slate-500">إنشاء حساب جديد</p>
            </div>

            <div className="customer-panel-strong px-6 py-7 sm:px-8">
              <span className="customer-kicker">العملاء</span>
              <h1 className="mt-4 text-2xl font-extrabold text-slate-900">إنشاء حساب</h1>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                املأ بياناتك الأساسية لإنشاء حساب عميل مرتبط بقواعد الـ backend الحالية.
              </p>

              {serverError ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
                    <span>{serverError}</span>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="اسم المستخدم" error={fieldErrors.username}>
                    <input
                      type="text"
                      value={form.username}
                      onChange={set("username")}
                      placeholder="3 أحرف على الأقل"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </Field>

                  <Field label="الاسم الكامل" error={fieldErrors.fullName}>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={set("fullName")}
                      placeholder="الاسم الكامل"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="رقم الهاتف" error={fieldErrors.phoneNumber}>
                    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <span className="flex h-[50px] shrink-0 items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
                        +972
                      </span>
                      <input
                        type="tel"
                        value={form.phoneNumber}
                        onChange={set("phoneNumber")}
                        placeholder="05X-XXXXXXX"
                        maxLength={10}
                        className="h-[50px] flex-1 px-4 text-sm text-slate-900 outline-none"
                        dir="ltr"
                      />
                    </div>
                  </Field>

                  <Field label="البريد الإلكتروني" error={fieldErrors.email} optional>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="example@mail.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      dir="ltr"
                    />
                  </Field>
                </div>

                <Field label="كلمة المرور" error={fieldErrors.password}>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={set("password")}
                      placeholder="كلمة مرور قوية"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-12 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((value) => !value)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </Field>

                <Field label="تأكيد كلمة المرور" error={fieldErrors.confirmPassword}>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      placeholder="أعد كتابة كلمة المرور"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-12 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((value) => !value)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="الجنس" error={fieldErrors.gender}>
                    <select
                      value={form.gender}
                      onChange={set("gender")}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="">اختر</option>
                      <option value="MALE">ذكر</option>
                      <option value="FEMALE">أنثى</option>
                    </select>
                  </Field>

                  <Field label="العمر" error={fieldErrors.age}>
                    <input
                      type="number"
                      value={form.age}
                      onChange={set("age")}
                      placeholder="العمر"
                      min={0}
                      max={150}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      dir="ltr"
                    />
                  </Field>
                </div>

                <Field label="رقم الهوية" error={fieldErrors.nationalIdNumber} optional>
                  <input
                    type="text"
                    value={form.nationalIdNumber}
                    onChange={set("nationalIdNumber")}
                    placeholder="بين 9 و20 خانة"
                    maxLength={20}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    dir="ltr"
                  />
                </Field>

                <button type="submit" disabled={loading} className="customer-primary-btn mt-2 w-full disabled:opacity-50">
                  {loading ? <FiLoader size={14} className="animate-spin" /> : null}
                  {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                <span className="text-sm text-slate-500">لديك حساب بالفعل؟ </span>
                <Link to="/customer/login" className="text-sm font-bold text-blue-700 hover:text-blue-800">
                  تسجيل الدخول
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
