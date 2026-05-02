import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMessageSquare,
  FiPackage,
  FiRefreshCw,
  FiRotateCcw,
  FiShoppingBag,
  FiStar,
  FiXCircle,
} from "react-icons/fi";
import { accountsApi } from "../../api/accounts";
import { catalogApi, unwrapCatalogPayload } from "../../api/catalog";
import { orderHubApi, unwrapOrderHubPayload } from "../../api/orderHub";
import { useAuth } from "../../auth/AuthContext";
import { formatOrderHubStatus } from "../../utils/orderHubUi";

function unwrap(payload) {
  return payload?.data ?? payload ?? {};
}

function formatMoney(value) {
  if (value == null) return "0";
  return Number(value).toLocaleString("ar", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  });
}

function formatValue(value) {
  if (typeof value === "number") return value.toLocaleString();
  if (value == null || value === "") return "0";
  return String(value);
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
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--gray-10)" }}>{label}</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>{formatValue(value)}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: bg, color: fg }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ListPanel({ title, rows, emptyText, render }) {
  return (
    <div className="rounded-2xl border" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--gray-a6)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</h2>
      </div>
      <div className="divide-y" style={{ "--tw-divide-color": "var(--gray-a5)" }}>
        {(rows || []).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--gray-10)" }}>{emptyText}</div>
        ) : (
          rows.slice(0, 6).map((row, index) => (
            <div
              key={row.shopId || row.shopOrderId || row.returnRequestId || row.reviewId || row.commentId || row.id || index}
              className="px-5 py-4"
            >
              {render(row)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ShopOwnerDashboard() {
  const { selectedStoreId } = useAuth();
  const [data, setData] = useState(null);
  const [orderDashboard, setOrderDashboard] = useState(null);
  const [productDashboard, setProductDashboard] = useState(null);
  const [reviewDashboard, setReviewDashboard] = useState(null);
  const [commentDashboard, setCommentDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [accountResponse, orderResponse, productResponse, reviewResponse, commentResponse] = await Promise.all([
        accountsApi.dashboard.shopOwner(),
        selectedStoreId ? orderHubApi.dashboard.getShop(selectedStoreId).catch(() => null) : null,
        selectedStoreId ? catalogApi.products.dashboardSummary(selectedStoreId).catch(() => null) : null,
        selectedStoreId ? catalogApi.storeEngagement.reviewSummary(selectedStoreId).catch(() => null) : null,
        selectedStoreId ? catalogApi.storeEngagement.commentSummary(selectedStoreId).catch(() => null) : null,
      ]);
      setData(unwrap(accountResponse));
      setOrderDashboard(unwrapOrderHubPayload(orderResponse));
      setProductDashboard(unwrapCatalogPayload(productResponse));
      setReviewDashboard(unwrapCatalogPayload(reviewResponse));
      setCommentDashboard(unwrapCatalogPayload(commentResponse));
    } catch (requestError) {
      setError(requestError.message || "فشل تحميل لوحة التحكم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedStoreId]);

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>لوحة تحكم المتجر</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>{data?.fullName || "ملخص متاجرك وطلباتك"}</p>
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

      {!selectedStoreId ? (
        <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a6)", color: "var(--blue-11)" }}>
          <FiAlertCircle size={16} />
          اختر متجرًا من الشريط الجانبي لعرض المنتجات والطلبات والتقييمات الخاصة به.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiShoppingBag} label="كل المتاجر" value={data?.totalShops} />
        <StatCard icon={FiCheckCircle} label="المتاجر النشطة" value={data?.activeShops} tone="green" />
        <StatCard icon={FiXCircle} label="المتاجر غير النشطة" value={data?.inactiveShops} tone="red" />
        <StatCard icon={FiClock} label="طلبات معلقة" value={data?.pendingShopRequests} tone="gray" />
      </div>

      {selectedStoreId ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FiPackage} label="المنتجات" value={productDashboard?.kpis?.totalProducts} />
            <StatCard icon={FiCheckCircle} label="منتجات نشطة" value={productDashboard?.kpis?.activeProducts} tone="green" />
            <StatCard icon={FiShoppingBag} label="طلبات المتجر" value={orderDashboard?.orderKpis?.totalOrders} />
            <StatCard icon={FiDollarSign} label="جاهز للتحويل" value={formatMoney(orderDashboard?.financeKpis?.readyForPayoutAmount)} tone="green" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FiStar} label="التقييمات" value={reviewDashboard?.totalReviews} />
            <StatCard icon={FiStar} label="متوسط التقييم" value={reviewDashboard?.averageRating != null ? Number(reviewDashboard.averageRating).toFixed(1) : "0"} tone="green" />
            <StatCard icon={FiMessageSquare} label="التعليقات" value={commentDashboard?.totalComments} />
            <StatCard icon={FiRotateCcw} label="إرجاعات معلقة" value={orderDashboard?.returnKpis?.pendingReturns} tone="gray" />
          </div>
        </>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ListPanel
          title="متاجري"
          rows={data?.myShops}
          emptyText="لا توجد متاجر مرتبطة بهذا الحساب"
          render={(shop) => (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{shop.name}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>{shop.mallName || shop.category || "-"}</div>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                {shop.status || "-"}
              </span>
            </div>
          )}
        />
        <ListPanel
          title="طلبات المتاجر"
          rows={data?.myShopRequests}
          emptyText="لا توجد طلبات متاجر"
          render={(request) => (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{request.shopName || request.name}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>{request.mallName || request.requestedMallName || "-"}</div>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                {request.status || "-"}
              </span>
            </div>
          )}
        />
      </div>

      {selectedStoreId ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ListPanel
            title="أحدث الطلبات"
            rows={orderDashboard?.recentOrders?.orders}
            emptyText="لا توجد طلبات حديثة لهذا المتجر"
            render={(order) => (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                    {order.customerInfo?.fullName || order.deliveryInfo?.deliveryName || `طلب #${order.shopOrderId}`}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                    {formatMoney(order.total)} · {formatOrderHubStatus(order.status)}
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                  #{order.shopOrderId}
                </span>
              </div>
            )}
          />
          <ListPanel
            title="الإرجاعات المعلقة"
            rows={orderDashboard?.pendingReturns?.returns}
            emptyText="لا توجد إرجاعات معلقة"
            render={(item) => (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                    {item.reason || `إرجاع #${item.returnRequestId}`}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                    {item.customerInfo?.fullName || "-"} · {formatOrderHubStatus(item.status)}
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--red-a3)", color: "var(--red-11)" }}>
                  #{item.returnRequestId}
                </span>
              </div>
            )}
          />
          <ListPanel
            title="أحدث التقييمات"
            rows={reviewDashboard?.recentReviews}
            emptyText="لا توجد تقييمات بعد"
            render={(review) => (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                    منتج #{review.productId}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                    المستخدم #{review.userId}
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--green-a3)", color: "var(--green-11)" }}>
                  {review.rating}/5
                </span>
              </div>
            )}
          />
          <ListPanel
            title="أحدث التعليقات"
            rows={commentDashboard?.recentComments}
            emptyText="لا توجد تعليقات بعد"
            render={(comment) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                    {comment.productName || `منتج #${comment.productId}`}
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                    {comment.status || "-"}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs" style={{ color: "var(--gray-10)" }}>{comment.content}</p>
              </div>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
