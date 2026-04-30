import { useEffect, useState } from "react";
import { FiAlertCircle, FiRefreshCw, FiShoppingBag, FiUsers, FiMapPin, FiClock } from "react-icons/fi";
import { accountsApi } from "../../api/accounts";

function unwrap(payload) {
  return payload?.data ?? payload ?? {};
}

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const colors = {
    blue: ["var(--blue-a3)", "var(--blue-11)"],
    green: ["var(--green-a3)", "var(--green-11)"],
    red: ["var(--red-a3)", "var(--red-11)"],
    gray: ["var(--gray-a3)", "var(--gray-11)"],
  };
  const [bg, fg] = colors[tone] || colors.blue;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--gray-10)" }}>
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
            {Number(value || 0).toLocaleString()}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: bg, color: fg }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function MiniTable({ title, rows, columns, emptyText }) {
  return (
    <div
      className="rounded-2xl border"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}
    >
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--gray-a6)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {(rows || []).length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-sm" style={{ color: "var(--gray-10)" }}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.slice(0, 6).map((row, index) => (
                <tr key={row.id || row.userId || row.shopId || index} style={{ borderTop: index ? "1px solid var(--gray-a5)" : "none" }}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-3" style={{ color: column.muted ? "var(--gray-10)" : "var(--gray-12)" }}>
                      {column.render ? column.render(row) : row[column.key] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await accountsApi.dashboard.admin();
      setData(unwrap(response));
    } catch (requestError) {
      setError(requestError.message || "فشل تحميل لوحة التحكم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>لوحة التحكم</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>ملخص مباشر من خدمة الحسابات</p>
        </div>
        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={15} />
          تحديث
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ background: "var(--red-a3)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
          <FiAlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiUsers} label="المستخدمون" value={data?.totalUsers} />
        <StatCard icon={FiShoppingBag} label="المولات" value={data?.totalMalls} tone="green" />
        <StatCard icon={FiShoppingBag} label="المتاجر" value={data?.totalShops} />
        <StatCard icon={FiMapPin} label="المدن النشطة" value={data?.activeCities} tone="gray" />
        <StatCard icon={FiClock} label="طلبات مالكي المتاجر المعلقة" value={data?.pendingShopOwnerRequests} tone="red" />
        <StatCard icon={FiClock} label="طلبات المتاجر المعلقة" value={data?.pendingShopRequests} tone="red" />
        <StatCard icon={FiUsers} label="مالكو المتاجر" value={data?.totalShopOwners} tone="green" />
        <StatCard icon={FiUsers} label="العملاء" value={data?.totalCustomers} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MiniTable
          title="أحدث المستخدمين"
          rows={data?.recentUsers}
          emptyText="لا توجد بيانات مستخدمين"
          columns={[
            { key: "fullName" },
            { key: "username", muted: true },
            { key: "role", muted: true },
          ]}
        />
        <MiniTable
          title="أحدث المتاجر"
          rows={data?.recentShops}
          emptyText="لا توجد بيانات متاجر"
          columns={[
            { key: "name" },
            { key: "mallName", muted: true },
            { key: "status", muted: true },
          ]}
        />
      </div>
    </div>
  );
}
