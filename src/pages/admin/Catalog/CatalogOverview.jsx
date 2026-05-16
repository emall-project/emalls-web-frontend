import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiGrid, FiTag, FiBookOpen, FiMessageSquare, FiPackage,
  FiLayers, FiRefreshCw, FiChevronLeft,
} from "react-icons/fi";
import { auth } from "../../../api/auth";

const CATALOG = "/catalog";

async function catalogFetch(path) {
  const res = await fetch(`${CATALOG}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders() },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return null;
  return json?.data ?? json ?? null;
}

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div
      className="flex items-center gap-4 rounded-2xl border p-5 transition-all"
      style={{
        background:   "var(--gray-1)",
        borderColor:  "var(--gray-a5)",
      }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "22", color }}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
          {value == null ? "—" : value}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>{label}</p>
      </div>
      {to && (
        <FiChevronLeft size={16} className="mr-auto shrink-0" style={{ color: "var(--gray-8)" }} />
      )}
    </div>
  );

  return to
    ? <Link to={to} className="block hover:scale-[1.01] transition-transform">{card}</Link>
    : card;
}

function NavCard({ icon: Icon, label, description, to, color }) {
  return (
    <Link to={to}
      className="flex items-center gap-4 rounded-2xl border p-5 transition-all hover:scale-[1.01]"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "22", color }}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--gray-9)" }}>{description}</p>
      </div>
      <FiChevronLeft size={15} style={{ color: "var(--gray-8)" }} />
    </Link>
  );
}

export default function CatalogOverview() {
  const [summary, setSummary] = useState({
    categories: null,
    brands:     null,
    attributes: null,
    comments:   null,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, brands, attrs, comments] = await Promise.all([
        catalogFetch("/categories/dashboard/summary"),
        catalogFetch("/brands/dashboard/summary"),
        catalogFetch("/attributes/dashboard/summary"),
        catalogFetch("/admin/comments/stats"),
      ]);
      setSummary({ categories: cats, brands, attributes: attrs, comments });
    } catch (e) {
      setError("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const extract = (obj, ...keys) => {
    if (obj == null) return null;
    for (const k of keys) {
      if (obj[k] != null) return obj[k];
    }
    return null;
  };

  const catTotal   = extract(summary.categories, "totalCount", "total", "count");
  const brandTotal = extract(summary.brands, "totalCount", "total", "count");
  const attrTotal  = extract(summary.attributes, "totalCount", "total", "count");
  const pendingComments = extract(summary.comments, "PENDING_MODERATION", "pendingCount", "pending");

  return (
    <div dir="rtl" className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--purple-3)", color: "var(--purple-11)" }}>
            <FiGrid size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الكتالوج</h1>
            <p className="text-sm" style={{ color: "var(--gray-10)" }}>نظرة عامة على بيانات المنتجات والكتالوج</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-xl"
          style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
          <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--red-3)", color: "var(--red-11)" }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiLayers}      label="الفئات"         value={catTotal}         color="#7c3aed" />
        <StatCard icon={FiTag}         label="الماركات"        value={brandTotal}        color="#2563eb" />
        <StatCard icon={FiBookOpen}    label="الخصائص"        value={attrTotal}         color="#0891b2" />
        <StatCard icon={FiMessageSquare} label="تعليقات معلقة" value={pendingComments}   color="#d97706"
          to="/admin/catalog/comments" />
      </div>

      {/* Navigation */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--gray-11)" }}>الأقسام</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NavCard icon={FiPackage}       label="منتجات الكتالوج"   description="تصفح وإدارة منتجات المتاجر"       to="/admin/catalog/products" color="#7c3aed" />
        <NavCard icon={FiMessageSquare} label="تعليقات المنتجات"  description="مراجعة وإدارة تعليقات العملاء"   to="/admin/catalog/comments" color="#d97706" />
        <NavCard icon={FiLayers}        label="الفئات"            description="إدارة فئات المنتجات والشجرة الهرمية" to="/admin/catalog/categories" color="#059669" />
        <NavCard icon={FiTag}           label="الماركات والخصائص" description="إدارة الماركات وخصائص المنتجات"  to="/admin/catalog/brands"    color="#2563eb" />
      </div>
    </div>
  );
}
