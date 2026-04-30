import { useMemo, useState } from "react";
import { FiAlertCircle, FiLoader, FiLock, FiShield, FiShoppingBag, FiUser, FiUsers } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ROLE_ADMIN, ROLE_CUSTOMER, ROLE_SHOP_OWNER, getHomePathForRole } from "../../auth/session";

const LOGIN_MODES = {
  shopOwner: {
    label: "صاحب متجر",
    role: ROLE_SHOP_OWNER,
    icon: <FiShoppingBag size={18} />,
    description: "لإدارة المنتجات والملفات وإعدادات المتجر",
  },
  admin: {
    label: "إدارة النظام",
    role: ROLE_ADMIN,
    icon: <FiShield size={18} />,
    description: "لإدارة المنصة والمستخدمين والمتاجر والملفات",
  },
  customer: {
    label: "عميل",
    role: ROLE_CUSTOMER,
    icon: <FiUsers size={18} />,
    description: "للوصول إلى الحساب الشخصي وبيانات العميل",
  },
};

function ModeButton({ active, icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-start gap-3 rounded-2xl border p-4 text-right transition"
      style={{
        background: active ? "var(--blue-a3)" : "var(--gray-a2)",
        borderColor: active ? "var(--blue-8)" : "var(--gray-a6)",
        color: active ? "var(--blue-11)" : "var(--gray-12)",
      }}
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{
          background: active ? "var(--blue-a4)" : "var(--gray-a4)",
        }}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-bold">{label}</div>
        <div className="mt-1 text-xs" style={{ color: active ? "var(--blue-10)" : "var(--gray-10)" }}>
          {description}
        </div>
      </div>
    </button>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [mode, setMode] = useState("shopOwner");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const modeConfig = LOGIN_MODES[mode];
  const fromPath = location.state?.from?.pathname || "";

  const title = useMemo(() => {
    if (mode === "admin") return "تسجيل دخول الإدارة";
    if (mode === "customer") return "تسجيل دخول العميل";
    return "تسجيل دخول صاحب المتجر";
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const nextState = await login({
        username: username.trim(),
        password,
        requiredRole: modeConfig.role,
      });

      const nextRole = nextState?.session?.role || "";
      const defaultHome = getHomePathForRole(nextRole);
      const isRoleCompatible =
        (nextRole === ROLE_ADMIN && fromPath.startsWith("/admin")) ||
        (nextRole === ROLE_SHOP_OWNER && fromPath.startsWith("/shop-owner")) ||
        (nextRole === ROLE_CUSTOMER &&
          !!fromPath &&
          !fromPath.startsWith("/admin") &&
          !fromPath.startsWith("/shop-owner"));

      navigate(isRoleCompatible ? fromPath : defaultHome, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "فشل تسجيل الدخول");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen px-4 py-10"
      style={{
        background:
          "linear-gradient(180deg, var(--gray-2) 0%, var(--gray-1) 45%, var(--gray-2) 100%)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section
            className="rounded-3xl border p-7 sm:p-10"
            style={{
              background: "var(--gray-1)",
              borderColor: "var(--gray-a6)",
            }}
          >
            <div className="mb-8">
              <div className="text-sm font-semibold" style={{ color: "var(--blue-11)" }}>
                سوقنا
              </div>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl" style={{ color: "var(--gray-12)" }}>
                {title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: "var(--gray-11)" }}>
                استخدم بيانات الحساب المصرح له. بعد الدخول سيتم تمرير رمز الوصول إلى
                خدمات الإدارة والملفات والمنتجات تلقائيًا.
              </p>
            </div>

            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              {Object.entries(LOGIN_MODES).map(([key, config]) => (
                <ModeButton
                  key={key}
                  active={mode === key}
                  icon={config.icon}
                  label={config.label}
                  description={config.description}
                  onClick={() => setMode(key)}
                />
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <div
                  className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    background: "var(--red-a2)",
                    borderColor: "var(--red-a6)",
                    color: "var(--red-11)",
                  }}
                >
                  <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div>
                <label
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: "var(--gray-11)" }}
                >
                  <FiUser size={12} />
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
                  style={{
                    background: "var(--gray-a2)",
                    borderColor: "var(--gray-a6)",
                    color: "var(--gray-12)",
                  }}
                  placeholder="اسم المستخدم"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: "var(--gray-11)" }}
                >
                  <FiLock size={12} />
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
                  style={{
                    background: "var(--gray-a2)",
                    borderColor: "var(--gray-a6)",
                    color: "var(--gray-12)",
                  }}
                  placeholder="كلمة المرور"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !username.trim() || !password}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "var(--blue-9)",
                  color: "#fff",
                }}
              >
                {submitting ? <FiLoader size={16} className="animate-spin" /> : null}
                دخول
              </button>

              {mode === "customer" ? (
                <div className="text-center text-sm" style={{ color: "var(--gray-11)" }}>
                  لا تملك حسابًا؟{" "}
                  <Link className="font-semibold" style={{ color: "var(--blue-11)" }} to="/signup">
                    إنشاء حساب عميل
                  </Link>
                </div>
              ) : mode === "shopOwner" ? (
                <div className="text-center text-sm" style={{ color: "var(--gray-11)" }}>
                  تريد فتح متجر؟{" "}
                  <Link className="font-semibold" style={{ color: "var(--blue-11)" }} to="/shop-owner-request">
                    إرسال طلب صاحب متجر
                  </Link>
                </div>
              ) : null}
            </form>
          </section>

          <aside
            className="rounded-3xl border p-7 sm:p-10"
            style={{
              background: "var(--gray-1)",
              borderColor: "var(--gray-a6)",
            }}
          >
            <div className="rounded-2xl border p-5" style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                ماذا يحدث بعد الدخول؟
              </div>
              <ul className="mt-4 space-y-3 text-sm" style={{ color: "var(--gray-11)" }}>
                <li>يتم حفظ رمز الوصول ورمز التحديث محليًا.</li>
                <li>تُحمى صفحات الإدارة وصاحب المتجر تلقائيًا.</li>
                <li>خدمات `media-manager` و`catalog` ستستقبل التوثيق في كل طلب.</li>
                <li>إذا كان الحساب يملك أكثر من متجر، يمكن تبديل المتجر النشط من الشريط العلوي.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
