import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiLock,
  FiUser,
} from "react-icons/fi";

import { auth } from "../../api/auth";

const FEATURES = [
  "تسوّق من متاجر متعددة داخل المولات بسهولة.",
  "تابع طلباتك ومفضلاتك من مكان واحد.",
  "استمتع بواجهة أوضح وتجربة أسرع على الهاتف والكمبيوتر.",
];

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = new URLSearchParams(location.search).get("from") || "/";
  const forgotPasswordHref = `/customer/forgot-password?returnTo=${encodeURIComponent(
    `/customer/login${location.search || ""}`
  )}`;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const successMessage = location.state?.forgotPasswordSuccess
    ? "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."
    : "";

  useEffect(() => {
    const user = auth.getUser();
    if (user?.role === "ROLE_CUSTOMER") navigate(from, { replace: true });
  }, [navigate, from]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError("");
    try {
      const user = await auth.login(username.trim(), password);
      if (user?.role !== "ROLE_CUSTOMER") {
        auth.clear();
        setError("هذه الصفحة مخصصة لتسجيل دخول العملاء فقط.");
        return;
      }
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "اسم المستخدم أو كلمة المرور غير صحيحة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--customer-bg)]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
        <aside className="hidden bg-[linear-gradient(160deg,#0f6dff_0%,#38bdf8_100%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-3xl font-extrabold">سوقنا</div>
            <p className="mt-2 text-sm text-white/70">تسوّق بوضوح وتجربة أسهل.</p>
          </div>

          <div className="space-y-8">
            <div>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
                حساب العميل
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-snug">
                سجّل الدخول
                <br />
                وأكمل تسوقك
              </h1>
            </div>

            <div className="space-y-3">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15">
                    <FiCheck size={12} />
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/45">© {new Date().getFullYear()} سوقنا</p>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 text-center lg:hidden">
              <div className="text-4xl font-extrabold text-[var(--customer-accent)]">سوقنا</div>
              <p className="mt-2 text-sm text-slate-500">تسجيل دخول العملاء</p>
            </div>

            <div className="customer-panel-strong px-6 py-7 sm:px-8">
              <span className="customer-kicker">العملاء</span>
              <h1 className="mt-4 text-2xl font-extrabold text-slate-900">مرحبًا بعودتك</h1>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                أدخل بياناتك للوصول إلى سلة التسوق، المفضلة، وطلباتك السابقة.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
                      <span>{error}</span>
                    </div>
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <div className="flex items-start gap-2">
                      <FiCheck className="mt-0.5 shrink-0" size={15} />
                      <span>{successMessage}</span>
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-500">اسم المستخدم</label>
                  <div className="relative">
                    <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      autoComplete="username"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-11 pl-4 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-500">كلمة المرور</label>
                  <div className="relative">
                    <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="أدخل كلمة المرور"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-11 pl-12 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((value) => !value)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  <div className="mt-2 text-left">
                    <Link to={forgotPasswordHref} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="customer-primary-btn mt-2 w-full disabled:opacity-50"
                >
                  {loading ? <FiLoader size={14} className="animate-spin" /> : null}
                  {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                <Link to="/customer/signup" className="text-sm font-bold text-blue-700 hover:text-blue-800">
                  إنشاء حساب جديد
                </Link>
                <Link to="/shop-owner/login" className="mt-2 block text-xs font-semibold text-slate-500 hover:text-slate-700">
                  دخول أصحاب المتاجر
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
