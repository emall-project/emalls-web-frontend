import { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiX } from "react-icons/fi";

import { auth } from "../../../api/auth";
import AdDetailsDrawer from "./AdDetailsDrawer";
import AdsFilters from "./AdsFilters";
import AdsMobileCards from "./AdsMobileCards";
import AdsStats from "./AdsStats";
import AdsTable from "./AdsTable";
import CancelAdRequestDialog from "./CancelAdRequestDialog";
import CreateAdRequestWizard from "./CreateAdRequestWizard";
import EditAdRequestDialog from "./EditAdRequestDialog";
import EmptyState from "./EmptyState";
import PaymentDialog from "./PaymentDialog";
import PaymentHistoryDialog from "./PaymentHistoryDialog";
import TableSkeleton from "./TableSkeleton";
import { adsApi } from "./api";
import {
  PAGE_SIZE,
  computeAdsStats,
  extractApiError,
  filterAds,
  isStripeConfigured,
  paginate,
} from "./adsUtils";

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timeout = setTimeout(onClose, 3500);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-lg"
      style={
        type === "success"
          ? {
              borderColor: "var(--green-a5)",
              background: "var(--green-a2)",
              color: "var(--green-11)",
              boxShadow: "0 16px 36px rgba(2, 6, 23, 0.22)",
            }
          : {
              borderColor: "var(--red-a5)",
              background: "var(--red-a2)",
              color: "var(--red-11)",
              boxShadow: "0 16px 36px rgba(2, 6, 23, 0.22)",
            }
      }
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
        aria-label="إغلاق"
      >
        <FiX size={14} />
      </button>
    </div>
  );
}

export default function Ads() {
  const stripeReady = isStripeConfigured();
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [filters, setFilters] = useState({
    paymentStatus: "ALL",
    displayStatus: "ALL",
    templateId: "ALL",
    startFrom: "",
    startTo: "",
    endFrom: "",
    endTo: "",
  });
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyRequest, setHistoryRequest] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const shopName = useMemo(() => {
    const shopFromRequest = requests.find((item) => item?.shop?.name)?.shop?.name;
    return shopFromRequest || auth.getUser()?.username || "متجرك";
  }, [requests]);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await adsApi.getActiveTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const data =
        statusTab === "ALL"
          ? await adsApi.getShopAdRequests()
          : await adsApi.getShopAdRequestsByStatus(statusTab);
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      setRequests([]);
      setListError(extractApiError(error));
    } finally {
      setListLoading(false);
    }
  }, [statusTab]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadTemplates(), loadRequests()]);
  }, [loadRequests, loadTemplates]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, filters]);

  const filteredRequests = useMemo(() => filterAds(requests, filters), [requests, filters]);
  const stats = useMemo(() => computeAdsStats(requests), [requests]);
  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginate(filteredRequests, page, PAGE_SIZE),
    [filteredRequests, page]
  );

  const handleFilterChange = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const handleStatsSelect = (stat) => {
    if (stat.key === "total") {
      setStatusTab("ALL");
      setFilters((current) => ({
        ...current,
        paymentStatus: "ALL",
        displayStatus: "ALL",
      }));
      return;
    }

    if (stat.status) {
      setStatusTab(stat.status);
    }

    if (stat.paymentStatus) {
      setFilters((current) => ({ ...current, paymentStatus: stat.paymentStatus }));
    }

    if (stat.displayStatus) {
      setFilters((current) => ({ ...current, displayStatus: stat.displayStatus }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      paymentStatus: "ALL",
      displayStatus: "ALL",
      templateId: "ALL",
      startFrom: "",
      startTo: "",
      endFrom: "",
      endTo: "",
    });
  };

  const handleCopyId = async (request) => {
    try {
      await navigator.clipboard.writeText(String(request.adRequestId));
      showToast("تم نسخ رقم الطلب بنجاح");
    } catch {
      showToast("تعذر نسخ رقم الطلب", "error");
    }
  };

  const handleCreated = async () => {
    await loadRequests();
    showToast("تم إرسال طلب الإعلان بنجاح وهو الآن قيد المراجعة");
  };

  const handleUpdated = async () => {
    await loadRequests();
    showToast("تم تحديث الإعلان بنجاح");
  };

  const handleCancelled = async () => {
    await loadRequests();
    showToast("تم إلغاء الطلب بنجاح");
  };

  const handlePaid = async () => {
    await loadRequests();
    showToast("تم الدفع بنجاح");
  };

  return (
    <div dir="rtl" className="space-y-5 pb-10">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}

      <AdsFilters
        statusTab={statusTab}
        onStatusTabChange={setStatusTab}
        filters={filters}
        templates={templates}
        onFiltersChange={handleFilterChange}
        onReset={handleResetFilters}
        onRefresh={async () => {
          await loadRequests();
          showToast("تم تحديث البيانات");
        }}
        onCreate={() => setCreateOpen(true)}
        onOpenPayments={() => {
          setHistoryRequest(null);
          setPaymentHistoryOpen(true);
        }}
      />

      {!stripeReady ? (
        <section
          className="rounded-[24px] border px-4 py-3 text-sm leading-7 shadow-sm"
          style={{
            borderColor: "var(--amber-a5)",
            background: "var(--amber-a2)",
            color: "var(--amber-11)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          }}
        >
          الدفع غير متاح من هذه النسخة حاليًا لأن واجهة Stripe تحتاج إلى
          <span dir="ltr" className="mx-1 inline-block rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}>
            VITE_STRIPE_PUBLISHABLE_KEY
          </span>
          في إعدادات الواجهة. سيبقى تتبع الطلبات والحالات وسجل المدفوعات متاحًا بشكل طبيعي.
        </section>
      ) : null}

      <AdsStats
        stats={stats}
        activeFilter={{
          status: statusTab === "ALL" ? "" : statusTab,
          paymentStatus: filters.paymentStatus,
          displayStatus: filters.displayStatus,
        }}
        onSelect={handleStatsSelect}
      />

      <section
        className="rounded-[28px] border p-4 shadow-sm sm:p-5"
        style={{
          background: "var(--gray-1)",
          borderColor: "var(--gray-a5)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
              قائمة الطلبات
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
              {filteredRequests.length} من أصل {requests.length} طلب
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold"
            style={{ background: "var(--gray-a3)", color: "var(--gray-9)" }}
          >
            <FiRefreshCw size={13} />
            يتم تطبيق التصفية محليًا بعد جلب البيانات من الخادم
          </div>
        </div>

        {listError ? (
          <div
            className="rounded-2xl border px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: "var(--red-a5)",
              background: "var(--red-a2)",
              color: "var(--red-11)",
            }}
          >
            {listError}
          </div>
        ) : null}

        {listLoading ? (
          <TableSkeleton rows={5} />
        ) : filteredRequests.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <>
            <AdsTable
              requests={pageItems}
              onView={(request) => {
                setSelectedRequest(request);
                setDetailsOpen(true);
              }}
              onEdit={(request) => {
                setSelectedRequest(request);
                setEditOpen(true);
              }}
              onCancel={(request) => {
                setSelectedRequest(request);
                setCancelOpen(true);
              }}
              onPay={(request) => {
                setSelectedRequest(request);
                setPaymentOpen(true);
              }}
              onHistory={(request) => {
                setHistoryRequest(request);
                setPaymentHistoryOpen(true);
              }}
              onCopyId={handleCopyId}
            />

            <AdsMobileCards
              requests={pageItems}
              onView={(request) => {
                setSelectedRequest(request);
                setDetailsOpen(true);
              }}
              onEdit={(request) => {
                setSelectedRequest(request);
                setEditOpen(true);
              }}
              onCancel={(request) => {
                setSelectedRequest(request);
                setCancelOpen(true);
              }}
              onPay={(request) => {
                setSelectedRequest(request);
                setPaymentOpen(true);
              }}
              onHistory={(request) => {
                setHistoryRequest(request);
                setPaymentHistoryOpen(true);
              }}
              onCopyId={handleCopyId}
            />

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold" style={{ color: "var(--gray-9)" }}>
                صفحة {safePage} من {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={safePage === 1}
                  className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderColor: "var(--gray-a5)",
                    background: "var(--gray-2)",
                    color: "var(--gray-11)",
                  }}
                >
                  <FiChevronRight size={15} />
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={safePage === totalPages}
                  className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderColor: "var(--gray-a5)",
                    background: "var(--gray-2)",
                    color: "var(--gray-11)",
                  }}
                >
                  التالي
                  <FiChevronLeft size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <CreateAdRequestWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        templates={templates}
        templatesLoading={templatesLoading}
        shopName={shopName}
        onCreated={handleCreated}
      />

      <EditAdRequestDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        request={selectedRequest}
        onUpdated={handleUpdated}
      />

      <CancelAdRequestDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        request={selectedRequest}
        onCancelled={handleCancelled}
      />

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        request={selectedRequest}
        onPaid={handlePaid}
      />

      <PaymentHistoryDialog
        open={paymentHistoryOpen}
        onOpenChange={setPaymentHistoryOpen}
        request={historyRequest}
        onRefreshSource={requests.length}
      />

      <AdDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        request={selectedRequest}
        onEdit={(request) => {
          setDetailsOpen(false);
          setSelectedRequest(request);
          setEditOpen(true);
        }}
        onCancel={(request) => {
          setDetailsOpen(false);
          setSelectedRequest(request);
          setCancelOpen(true);
        }}
        onPay={(request) => {
          setDetailsOpen(false);
          setSelectedRequest(request);
          setPaymentOpen(true);
        }}
        onOpenHistory={(request) => {
          setDetailsOpen(false);
          setHistoryRequest(request);
          setPaymentHistoryOpen(true);
        }}
      />
    </div>
  );
}
