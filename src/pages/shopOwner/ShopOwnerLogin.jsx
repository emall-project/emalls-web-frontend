import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertCircle, FiEye, FiEyeOff, FiLoader,
  FiLock, FiUser, FiCheck,
} from "react-icons/fi";
import { auth } from "../../api/auth";

const FEATURES = [
  "متابعة الطلبات والإرجاعات لحظة بلحظة",
  "إدارة المنتجات والعروض والأسعار",
  "إدارة الإعلانات داخل المول بسهولة",
];

export default function ShopOwnerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const forgotPasswordHref = `/shop-owner/forgot-password?returnTo=${encodeURIComponent("/shop-owner/login")}`;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const successMessage = location.state?.forgotPasswordSuccess
    ? "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."
    : "";

  useEffect(() => {
    const user = auth.getUser();
    if (user?.role === "ROLE_SHOP_OWNER") navigate("/shop-owner", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const user = await auth.login(username.trim(), password);
      if (user?.role !== "ROLE_SHOP_OWNER") {
        auth.clear();
        setError("هذا الدخول مخصص لأصحاب المتاجر فقط.");
        return;
      }
      navigate("/shop-owner", { replace: true });
    } catch (err) {
      setError(err.message || "اسم المستخدم أو كلمة المرور غير صحيحة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ background: "var(--gray-2)" }}>

      {/* ── Branding panel (desktop only) ── */}
      <aside
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 shrink-0"
        style={{ background: "linear-gradient(145deg, #2563eb 0%, #4f46e5 100%)" }}
      >
        {/* Logo */}
        <div>
          <div className="text-3xl font-bold text-white tracking-wide">سوقنا</div>
          <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,.65)" }}>
            نظام إدارة المتاجر
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-8">
          <h2 className="text-4xl font-bold text-white leading-snug">
            أدر متجرك<br />من مكان واحد
          </h2>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,.2)" }}
                >
                  <FiCheck size={11} color="#fff" />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,.85)" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: "rgba(255,255,255,.35)" }}>
          © {new Date().getFullYear()} سوقنا — جميع الحقوق محفوظة
        </p>
      </aside>

      {/* ── Form panel ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-10">

        {/* Mobile brand */}
        <div className="lg:hidden text-center mb-8">
          <div className="text-4xl font-bold tracking-wide bg-linear-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            سوقنا
          </div>
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mt-2"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
          >
            صاحب المتجر
          </span>
        </div>

        <div className="w-full max-w-[360px]">

          {/* Desktop heading */}
          <div className="hidden lg:block mb-7">
            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
              style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
            >
              صاحب المتجر
            </span>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
              مرحباً بك
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--gray-10)" }}>
              سجّل الدخول للوصول إلى لوحة إدارة المتجر
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "var(--gray-1)",
              borderColor: "var(--gray-a6)",
              boxShadow: "0 24px 64px rgba(0,0,0,.12)",
            }}
          >
            {/* Mobile card title */}
            <div className="lg:hidden mb-5">
              <h1 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                تسجيل الدخول
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>
                أدخل بياناتك للمتابعة
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "var(--red-a3)",
                    color: "var(--red-11)",
                    border: "1px solid var(--red-a6)",
                  }}
                >
                  <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "var(--green-a3)",
                    color: "var(--green-11)",
                    border: "1px solid var(--green-a6)",
                  }}
                >
                  <FiCheck size={15} className="shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Username */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: "var(--gray-11)" }}
                >
                  اسم المستخدم
                </label>
                <div className="relative">
                  <FiUser
                    size={14}
                    className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none"
                    style={{ color: "var(--gray-9)" }}
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    autoComplete="username"
                    required
                    className="w-full rounded-[10px] pr-9 pl-4 py-2.5 text-sm border outline-none transition"
                    style={{
                      background: "var(--gray-a2)",
                      borderColor: "var(--gray-a6)",
                      color: "var(--gray-12)",
                      direction: "rtl",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: "var(--gray-11)" }}
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <FiLock
                    size={14}
                    className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none"
                    style={{ color: "var(--gray-9)" }}
                  />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-[10px] pr-9 pl-10 py-2.5 text-sm border outline-none transition"
                    style={{
                      background: "var(--gray-a2)",
                      borderColor: "var(--gray-a6)",
                      color: "var(--gray-12)",
                      direction: "rtl",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute top-1/2 -translate-y-1/2 left-3 p-1 rounded-lg hover:opacity-70 transition"
                    style={{ color: "var(--gray-9)" }}
                  >
                    {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
                <div className="mt-2 text-left">
                  <Link
                    to={forgotPasswordHref}
                    className="text-xs font-semibold transition hover:opacity-80"
                    style={{ color: "var(--blue-11)" }}
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 mt-1"
                style={{ background: "var(--blue-9)", color: "#fff" }}
              >
                {loading && <FiLoader size={14} className="animate-spin" />}
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </form>

            <div
              className="mt-5 pt-4 border-t text-center"
              style={{ borderColor: "var(--gray-a5)" }}
            >
              <Link
                to="/shop-owner/signup"
                className="block text-sm font-semibold mb-2 transition hover:opacity-80"
                style={{ color: "var(--blue-11)" }}
              >
                تقديم طلب فتح متجر
              </Link>
              <Link
                to="/login"
                className="text-xs font-medium transition hover:opacity-70"
                style={{ color: "var(--gray-10)" }}
              >
                دخول الإدارة أو حساب آخر
              </Link>
            </div>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "var(--gray-9)" }}>
            نظام إدارة المتاجر — سوقنا
          </p>
        </div>
      </main>
    </div>
  );
}
