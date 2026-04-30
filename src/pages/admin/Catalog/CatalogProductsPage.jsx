import { useEffect, useMemo, useState } from "react";
import { accountsApi, unwrapAccountPayload } from "../../../api/accounts";
import { catalogApi, unwrapCatalogPayload } from "../../../api/catalog";
import Products from "../../shopOwner/Products/Products";

const selectStyle = {
  background: "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
};

export default function CatalogProductsPage() {
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    accountsApi.shops.all()
      .then((response) => {
        if (cancelled) return;
        const list = unwrapAccountPayload(response) || [];
        setShops(Array.isArray(list) ? list : []);
        setSelectedShopId((current) => current || (list?.[0]?.id ? String(list[0].id) : ""));
      })
      .catch(() => {
        if (!cancelled) setShops([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedShop = useMemo(
    () => shops.find((shop) => String(shop.id) === String(selectedShopId)),
    [selectedShopId, shops]
  );

  useEffect(() => {
    let cancelled = false;
    if (!selectedShopId) {
      setSummary(null);
      return () => {
        cancelled = true;
      };
    }

    catalogApi.products.dashboardSummary(selectedShopId)
      .then((response) => {
        if (!cancelled) setSummary(unwrapCatalogPayload(response));
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedShopId]);

  const headerExtra = (
    <div className="min-w-[260px]">
      <select
        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
        style={selectStyle}
        value={selectedShopId}
        onChange={(event) => setSelectedShopId(event.target.value)}
        disabled={loading}
      >
        <option value="">اختر متجرًا</option>
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name || shop.shopName || `متجر #${shop.id}`}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Products
      storeIdOverride={selectedShopId ? Number(selectedShopId) : null}
      title="إدارة منتجات الكتالوج"
      subtitle={selectedShop ? `منتجات ${selectedShop.name || selectedShop.shopName}` : "اختر متجرًا لإدارة منتجاته"}
      headerExtra={headerExtra}
      summaryContent={summary ? <ProductSummary summary={summary} /> : null}
      emptyStoreMessage="اختر متجرًا من القائمة لإدارة منتجاته."
    />
  );
}

function ProductSummary({ summary }) {
  const entries = Object.entries(flatten(summary)).slice(0, 6);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-2xl border p-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
          <div className="text-xs" style={{ color: "var(--gray-10)" }}>{labelize(key)}</div>
          <div className="mt-2 text-xl font-bold" style={{ color: "var(--gray-12)" }}>{String(value)}</div>
        </div>
      ))}
    </div>
  );
}

function flatten(value, prefix = "") {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value).reduce((acc, [key, item]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return { ...acc, ...flatten(item, nextKey) };
    }
    if (!Array.isArray(item)) acc[nextKey] = item;
    return acc;
  }, {});
}

function labelize(value) {
  return String(value).replace(/\./g, " / ").replace(/([a-z])([A-Z])/g, "$1 $2");
}
