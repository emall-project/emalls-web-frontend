import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiBox, FiLoader, FiMessageSquare, FiTag, FiType } from "react-icons/fi";
import { catalogApi, unwrapCatalogPayload } from "../../../api/catalog";

const links = [
  { to: "/admin/catalog/categories", title: "الفئات", desc: "هيكلة التصنيفات وصور الجمهور", icon: <FiBox /> },
  { to: "/admin/catalog/brands", title: "البراندات", desc: "إدارة البراندات وصورها", icon: <FiTag /> },
  { to: "/admin/catalog/attributes", title: "الخصائص", desc: "خصائص المنتج وقيم المتغيرات", icon: <FiType /> },
  { to: "/admin/catalog/tags", title: "الوسوم", desc: "وسوم البحث والتجميع", icon: <FiTag /> },
  { to: "/admin/catalog/products", title: "المنتجات", desc: "إدارة منتجات متجر محدد", icon: <FiBox /> },
  { to: "/admin/catalog/comments", title: "تعليقات المنتجات", desc: "المراجعة والموافقة والرفض", icon: <FiMessageSquare /> },
];

export default function CatalogOverview() {
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      catalogApi.categories.dashboardSummary().catch(() => null),
      catalogApi.brands.dashboardSummary().catch(() => null),
      catalogApi.attributes.dashboardSummary().catch(() => null),
      catalogApi.comments.adminStats().catch(() => null),
    ])
      .then(([categories, brands, attributes, comments]) => {
        if (cancelled) return;
        setSummaries({
          categories: unwrapCatalogPayload(categories),
          brands: unwrapCatalogPayload(brands),
          attributes: unwrapCatalogPayload(attributes),
          comments: unwrapCatalogPayload(comments),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الكتالوج</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
          عمليات الكتالوج الأساسية: الفئات، البراندات، الخصائص، الوسوم، المنتجات، والتعليقات.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="ملخص الفئات" data={summaries.categories} loading={loading} />
        <SummaryCard title="ملخص البراندات" data={summaries.brands} loading={loading} />
        <SummaryCard title="ملخص الخصائص" data={summaries.attributes} loading={loading} />
        <SummaryCard title="حالات التعليقات" data={summaries.comments} loading={loading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
              {item.icon}
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{item.title}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ title, data, loading }) {
  const entries = Object.entries(flattenSummary(data)).slice(0, 4);

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
      <div className="mb-3 text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</div>
      {loading ? (
        <FiLoader className="animate-spin" style={{ color: "var(--gray-10)" }} />
      ) : entries.length ? (
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate" style={{ color: "var(--gray-11)" }}>{labelize(key)}</span>
              <span className="font-bold" style={{ color: "var(--gray-12)" }}>{String(value)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm" style={{ color: "var(--gray-10)" }}>لا توجد بيانات</div>
      )}
    </div>
  );
}

function flattenSummary(value, prefix = "") {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((acc, [key, item]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return { ...acc, ...flattenSummary(item, nextKey) };
    }
    if (!Array.isArray(item)) {
      acc[nextKey] = item;
    }
    return acc;
  }, {});
}

function labelize(key) {
  return String(key)
    .replace(/\./g, " / ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}
