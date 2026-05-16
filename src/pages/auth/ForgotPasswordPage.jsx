import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLoader,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";

import { auth } from "../../api/auth";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_+=\-])[A-Za-z\d@$!%*?&^#_+=\-]{8,}$/;
const STORAGE_KEY = "emalls_forgot_password_flow";

const AUDIENCE_CONFIG = {
  customer: {
    badge: "العملاء",
    title: "استعادة كلمة المرور",
    subtitle:
      "أدخل اسم المستخدم أولًا. سنرسل رمز تحقق إلى البريد الإلكتروني المسجل لهذا الحساب، ثم يمكنك تعيين كلمة مرور جديدة.",
    returnTo: "/customer/login",
    alternateLink: {
      to: "/customer/signup",
      label: "إنشاء حساب جديد",
    },
  },
  "shop-owner": {
    badge: "أصحاب المتاجر",
    title: "استعادة كلمة مرور المتجر",
    subtitle:
      "نستخدم اسم المستخدم للتحقق من الحساب، ثم نرسل رمزًا إلى البريد الإلكتروني المسجل حتى تكمل تعيين كلمة المرور الجديدة.",
    returnTo: "/shop-owner/login",
    alternateLink: {
      to: "/shop-owner/signup",
      label: "تقديم طلب فتح متجر",
    },
  },
  admin: {
    badge: "المشرف",
    title: "استعادة كلمة مرور المشرف",
    subtitle:
      "أدخل اسم المستخدم، ثم أدخل رمز التحقق الذي سيصل إلى البريد الإلكتروني المرتبط بالحساب لتعيين كلمة مرور جديدة.",
    returnTo: "/login",
    alternateLink: null,
  },
};

function readStoredFlow() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistFlow(flow) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(flow));
}

function clearStoredFlow() {
  window.sessionStorage.removeItem(STORAGE_KEY);
}

function sanitizeReturnTo(value, fallback) {
  if (!value || typeof value !== "string") return fallback;
  return value.startsWith("/") ? value : fallback;
}

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

function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <FiAlertCircle size={11} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function ForgotPasswordPage({ audience = "customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = AUDIENCE_CONFIG[audience] ?? AUDIENCE_CONFIG.customer;
  const requestedReturnTo = new URLSearchParams(location.search).get("returnTo");
  const returnTo = useMemo(
    () => sanitizeReturnTo(requestedReturnTo, config.returnTo),
    [config.returnTo, requestedReturnTo]
  );

  const [username, setUsername] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const stored = readStoredFlow();
    if (!stored) return;

    if (stored.returnTo !== returnTo || stored.audience !== audience) {
      clearStoredFlow();
      return;
    }

    setUsername(stored.username ?? "");
    setResetToken(stored.resetToken ?? "");
  }, [audience, returnTo]);

  useEffect(() => {
    if (!success) return undefined;

    const timer = window.setTimeout(() => {
      navigate(returnTo, {
        replace: true,
        state: { forgotPasswordSuccess: true },
      });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [success, navigate, returnTo]);

  const currentStep = success ? 2 : resetToken ? 2 : 1;

  const baseInputClass =
    "w-full rounded-2xl border border-slate-200 bg-white py-3 pr-11 pl-4 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

  const saveFlow = (nextUsername, nextToken) => {
    persistFlow({
      audience,
      returnTo,
      username: nextUsername,
      resetToken: nextToken,
    });
  };

  const clearMessages = () => {
    setServerError("");
    setInfoMessage("");
  };

  const resetFlow = ({ clearUsername = true } = {}) => {
    clearStoredFlow();
    setResetToken("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setFieldErrors({});
    clearMessages();
    setSuccess(false);
    if (clearUsername) setUsername("");
  };

  const validateRequestStep = () => {
    const nextErrors = {};
    if (!username.trim()) {
      nextErrors.username = "اسم المستخدم مطلوب.";
    }
    return nextErrors;
  };

  const validateResetStep = () => {
    const nextErrors = {};
    if (!otp.trim()) {
      nextErrors.otp = "رمز التحقق مطلوب.";
    } else if (!/^\d{6}$/.test(otp.trim())) {
      nextErrors.otp = "رمز التحقق يجب أن يكون 6 أرقام.";
    }

    if (!newPassword) {
      nextErrors.newPassword = "كلمة المرور الجديدة مطلوبة.";
    } else if (!PASSWORD_REGEX.test(newPassword)) {
      nextErrors.newPassword = "كلمة المرور الجديدة لا تستوفي المتطلبات.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "يرجى تأكيد كلمة المرور الجديدة.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "كلمتا المرور غير متطابقتين.";
    }

    return nextErrors;
  };

  const handleRequestReset = async (event) => {
    event.preventDefault();
    const nextErrors = validateRequestStep();
    setFieldErrors(nextErrors);
    clearMessages();
    if (Object.keys(nextErrors).length) return;

    setRequestLoading(true);
    try {
      const tempToken = await auth.requestPasswordReset(username.trim());
      setResetToken(tempToken);
      saveFlow(username.trim(), tempToken);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setInfoMessage("أرسلنا رمز تحقق إلى البريد الإلكتروني المسجل لهذا الحساب.");
    } catch (requestError) {
      setServerError(requestError.message || "تعذر بدء استعادة كلمة المرور.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    const nextErrors = validateResetStep();
    setFieldErrors(nextErrors);
    clearMessages();
    if (Object.keys(nextErrors).length) return;

    setResetLoading(true);
    try {
      await auth.resetForgottenPassword(resetToken, {
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });
      clearStoredFlow();
      setSuccess(true);
      setInfoMessage("تم تحديث كلمة المرور بنجاح. سيتم إعادتك إلى صفحة تسجيل الدخول.");
    } catch (requestError) {
      setServerError(requestError.message || "تعذر تحديث كلمة المرور.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendOtp = async () => {
    clearMessages();
    setResendLoading(true);
    try {
      const nextToken = await auth.resendPasswordResetOtp(resetToken);
      setResetToken(nextToken);
      saveFlow(username.trim(), nextToken);
      setInfoMessage("تم إرسال رمز جديد إلى البريد الإلكتروني المسجل.");
    } catch (requestError) {
      setServerError(requestError.message || "تعذر إعادة إرسال الرمز.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--customer-bg)]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
        <aside className="hidden bg-[linear-gradient(165deg,#0f6dff_0%,#2563eb_58%,#38bdf8_100%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-3xl font-extrabold">سوقنا</div>
            <p className="mt-2 text-sm text-white/70">استعادة وصولك إلى الحساب بشكل آمن.</p>
          </div>

          <div className="space-y-8">
            <div>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
                {config.badge}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-snug">
                استرجع كلمة المرور
                <br />
                بخطوتين واضحتين
              </h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-white/85">
                <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-white/15">1</span>
                أدخل اسم المستخدم المرتبط بالحساب ليتم إرسال رمز التحقق إلى البريد الإلكتروني المسجل.
              </div>
              <div className="flex items-start gap-3 text-sm text-white/85">
                <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-white/15">2</span>
                أدخل الرمز المكوّن من 6 أرقام ثم عيّن كلمة مرور جديدة مطابقة لمتطلبات الأمان.
              </div>
              <div className="flex items-start gap-3 text-sm text-white/85">
                <FiMail className="mt-0.5 shrink-0" size={15} />
                رمز التحقق صالح عادة لمدة 5 دقائق، ويمكنك طلب رمز جديد من نفس الصفحة.
              </div>
            </div>
          </div>

          <p className="text-xs text-white/45">© {new Date().getFullYear()} سوقنا</p>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[480px]">
            <div className="mb-8 text-center lg:hidden">
              <div className="text-4xl font-extrabold text-[var(--customer-accent)]">سوقنا</div>
              <p className="mt-2 text-sm text-slate-500">{config.badge}</p>
            </div>

            <div className="customer-panel-strong px-6 py-7 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <span className="customer-kicker">{config.badge}</span>
                <Link to={returnTo} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                  العودة لتسجيل الدخول
                </Link>
              </div>

              <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
                {success ? "تم تحديث كلمة المرور" : config.title}
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {success
                  ? "يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة."
                  : config.subtitle}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {["تحديد الحساب", "التحقق والتحديث"].map((label, index) => {
                  const stepNumber = index + 1;
                  const active = currentStep >= stepNumber;

                  return (
                    <div
                      key={label}
                      className={`rounded-2xl border px-4 py-3 text-center text-xs font-bold transition ${
                        active
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {infoMessage ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <div className="flex items-start gap-2">
                    <FiCheckCircle className="mt-0.5 shrink-0" size={15} />
                    <span>{infoMessage}</span>
                  </div>
                </div>
              ) : null}

              {serverError ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
                    <span>{serverError}</span>
                  </div>
                </div>
              ) : null}

              {!resetToken ? (
                <form onSubmit={handleRequestReset} className="mt-6 space-y-4">
                  <Field
                    label="اسم المستخدم"
                    error={fieldErrors.username}
                    hint="هذا هو الحقل الذي يعتمد عليه الباك اند للعثور على الحساب ثم إرسال الرمز إلى البريد الإلكتروني المسجل."
                  >
                    <div className="relative">
                      <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="أدخل اسم المستخدم"
                        autoComplete="username"
                        className={baseInputClass}
                      />
                    </div>
                  </Field>

                  <button
                    type="submit"
                    disabled={requestLoading || !username.trim()}
                    className="customer-primary-btn mt-2 w-full disabled:opacity-50"
                  >
                    {requestLoading ? <FiLoader size={14} className="animate-spin" /> : <FiKey size={14} />}
                    {requestLoading ? "جارٍ إرسال الرمز..." : "إرسال رمز التحقق"}
                  </button>
                </form>
              ) : success ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-emerald-200 bg-emerald-50/70 p-8 text-center">
                  <FiCheckCircle className="mx-auto mb-4 text-4xl text-emerald-600" />
                  <p className="text-sm leading-7 text-emerald-800">
                    ستتم إعادتك إلى صفحة تسجيل الدخول خلال لحظات. يمكنك المتابعة يدويًا إذا رغبت.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(returnTo, {
                        replace: true,
                        state: { forgotPasswordSuccess: true },
                      })
                    }
                    className="customer-primary-btn mt-6 rounded-2xl px-6"
                  >
                    العودة الآن
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500">اسم المستخدم</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{username}</p>
                  </div>

                  <Field
                    label="رمز التحقق"
                    error={fieldErrors.otp}
                    hint="أدخل الرمز الذي وصل إلى بريدك الإلكتروني والمسجّل للحساب."
                  >
                    <div className="relative">
                      <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className={`${baseInputClass} text-center tracking-[0.35em] pr-11 pl-11`}
                      />
                    </div>
                  </Field>

                  <Field label="كلمة المرور الجديدة" error={fieldErrors.newPassword}>
                    <div className="relative">
                      <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة"
                        autoComplete="new-password"
                        className={`${baseInputClass} pl-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((value) => !value)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showNewPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                    <PasswordStrength password={newPassword} />
                  </Field>

                  <Field label="تأكيد كلمة المرور الجديدة" error={fieldErrors.confirmPassword}>
                    <div className="relative">
                      <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        autoComplete="new-password"
                        className={`${baseInputClass} pl-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showConfirmPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                  </Field>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={resetLoading || resendLoading}
                      className="customer-primary-btn flex-1 disabled:opacity-50"
                    >
                      {resetLoading ? <FiLoader size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
                      {resetLoading ? "جارٍ تحديث كلمة المرور..." : "تحديث كلمة المرور"}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resetLoading || resendLoading}
                      className="customer-secondary-btn flex-1 justify-center disabled:opacity-50"
                    >
                      {resendLoading ? <FiLoader size={14} className="animate-spin" /> : <FiRefreshCw size={14} />}
                      {resendLoading ? "جارٍ الإرسال..." : "إعادة إرسال الرمز"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => resetFlow({ clearUsername: true })}
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    استخدام اسم مستخدم آخر
                  </button>
                </form>
              )}

              <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                <Link to={returnTo} className="text-sm font-bold text-blue-700 hover:text-blue-800">
                  العودة إلى تسجيل الدخول
                </Link>
                {config.alternateLink ? (
                  <Link
                    to={config.alternateLink.to}
                    className="mt-2 block text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    {config.alternateLink.label}
                  </Link>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(returnTo)}
              className="mx-auto mt-5 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <FiArrowLeft size={13} />
              العودة
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
