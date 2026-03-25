import React, { useState, useCallback, useEffect } from "react";
import {
  FiPlus, FiSearch, FiMapPin, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiAlertCircle,
} from "react-icons/fi";

import { mallsApi }            from "./api";
import { MALL_STATUSES, STATUS_LABELS, STATUS_COLORS, FAKE_MALL } from "./constants";
import { StyleInjector, Toast, StatusBadge, CustomDropdown, FilterInput, Spinner } from "./ui";
import AdminActionsMenu         from "./AdminActionsMenu";
import MallDetailsDialog        from "./MallDetailsDialog";
import MallFormDialog           from "./MallFormDialog";

export default function MallManagement() {
  const [malls,         setMalls]         = useState([FAKE_MALL]);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalElements, setTotalElements] = useState(1);
  const [fetchLoading,  setFetchLoading]  = useState(false);
  const [fetchError,    setFetchError]    = useState("");

  const [page,              setPage]              = useState(0);
  const [search,            setSearch]            = useState("");
  const [locationFilter,    setLocationFilter]    = useState("");
  const [statusFilter,      setStatusFilter]      = useState("all");
  const [cityNameFilter,    setCityNameFilter]    = useState("");
  const [serviceNameFilter, setServiceNameFilter] = useState("");

  const [viewOpen,      setViewOpen]      = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [addOpen,       setAddOpen]       = useState(false);
  const [selectedMall,  setSelectedMall]  = useState(null);
  const [rowLoading,    setRowLoading]    = useState({});
  const [toast,         setToast]         = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const fetchMalls = useCallback(async () => {
    setFetchLoading(true);
    setFetchError("");
    try {
      const params = {
        page, size: 10,
        ...(search            ? { name:          search            } : {}),
        ...(locationFilter    ? { location:       locationFilter    } : {}),
        ...(statusFilter !== "all" ? { status:    statusFilter      } : {}),
        ...(cityNameFilter    ? { "city-name":    cityNameFilter    } : {}),
        ...(serviceNameFilter ? { "service-name": serviceNameFilter } : {}),
      };
      const res  = await mallsApi.getAll(params);
      const data = res?.data || res?.content || [];
      const list = Array.isArray(data) ? data : (data?.content || []);
      setMalls([FAKE_MALL, ...list]);
      setTotalPages(data?.totalPages || 1);
      setTotalElements((data?.totalElements || list.length) + 1);
    } catch (e) {
      setFetchError(e.message || "فشل في جلب البيانات");
      setMalls([FAKE_MALL]);
    } finally {
      setFetchLoading(false);
    }
  }, [page, search, locationFilter, statusFilter, cityNameFilter, serviceNameFilter]);

  useEffect(() => { fetchMalls(); }, [fetchMalls]);
  useEffect(() => { setPage(0); }, [search, locationFilter, statusFilter, cityNameFilter, serviceNameFilter]);

  const setRowBusy = (id, busy) => setRowLoading((p) => ({ ...p, [id]: busy }));

  const handleActivate = async (mall) => {
    if (mall.mallId === FAKE_MALL.mallId) return showToast("هذا مول تجريبي فقط 😄", "error");
    setRowBusy(mall.mallId, true);
    try   { await mallsApi.activate(mall.mallId);   showToast(`تم تفعيل ${mall.name}`);   fetchMalls(); }
    catch (e) { showToast(e.message, "error"); }
    finally   { setRowBusy(mall.mallId, false); }
  };

  const handleDeactivate = async (mall) => {
    if (mall.mallId === FAKE_MALL.mallId) return showToast("هذا مول تجريبي فقط 😄", "error");
    setRowBusy(mall.mallId, true);
    try   { await mallsApi.deactivate(mall.mallId);   showToast(`تم تعطيل ${mall.name}`);   fetchMalls(); }
    catch (e) { showToast(e.message, "error"); }
    finally   { setRowBusy(mall.mallId, false); }
  };

  const handleChangeStatus = async (mall, status) => {
    if (mall.mallId === FAKE_MALL.mallId) return showToast("هذا مول تجريبي فقط 😄", "error");
    setRowBusy(mall.mallId, true);
    try   { await mallsApi.changeStatus(mall.mallId, status); showToast(`تم تغيير حالة ${mall.name}`); fetchMalls(); }
    catch (e) { showToast(e.message, "error"); }
    finally   { setRowBusy(mall.mallId, false); }
  };

  const clearFilters = () => {
    setSearch(""); setLocationFilter(""); setStatusFilter("all");
    setCityNameFilter(""); setServiceNameFilter(""); setPage(0);
  };
  const hasFilters = search || locationFilter || statusFilter !== "all" || cityNameFilter || serviceNameFilter;

  const statusOptions = [
    { value: "all", label: "كل الحالات" },
    ...MALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], dot: STATUS_COLORS[s]?.dot })),
  ];

  return (
    <>
      <StyleInjector />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div dir="rtl" className="space-y-6 p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={fetchMalls} disabled={fetchLoading}
              className="px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: "var(--gray-a7)", background: "transparent", color: "var(--gray-12)" }}
            >
              {fetchLoading ? <Spinner size={14} /> : <FiRefreshCw size={14} />} تحديث
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:opacity-90 transition text-sm font-medium"
            >
              <FiPlus /> إضافة مول
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة المولات</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--gray-11)" }}>
              {totalElements > 0 ? `${totalElements} مول مسجل` : "إدارة المولات والحالات"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-5"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم المول</label>
              <FilterInput value={search} onChange={setSearch} placeholder="ابحث بالاسم..." icon={FiSearch} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الموقع</label>
              <FilterInput value={locationFilter} onChange={setLocationFilter} placeholder="ابحث بالموقع..." icon={FiMapPin} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم المدينة</label>
              <FilterInput value={cityNameFilter} onChange={setCityNameFilter} placeholder="مثال: رام الله" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
              <CustomDropdown value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="كل الحالات" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم الخدمة</label>
              <FilterInput value={serviceNameFilter} onChange={setServiceNameFilter} placeholder="مثال: واي فاي" />
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-xl transition-opacity hover:opacity-70"
                  style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                  ✕ مسح الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {fetchError && (
          <div className="rounded-2xl px-5 py-3 flex items-center justify-between gap-3"
            style={{ background: "var(--red-2)", border: "1px solid var(--red-6)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--red-11)" }}>
              <FiAlertCircle size={15} />
              <span>{fetchError} — يُعرض المول التجريبي فقط</span>
            </div>
            <button onClick={fetchMalls}
              className="text-xs font-semibold underline flex-shrink-0"
              style={{ color: "var(--red-11)" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--gray-a5)", color: "var(--gray-11)" }}>
                {["اسم المول", "الموقع / المدينة", "الخدمات", "الحالة", "الإجراءات"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-right font-semibold text-xs tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fetchLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2" style={{ color: "var(--gray-10)" }}>
                      <Spinner size={20} /> جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : malls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm" style={{ color: "var(--gray-10)" }}>
                    لا توجد مولات مطابقة.
                  </td>
                </tr>
              ) : (
                malls.map((mall, idx) => (
                  <tr key={mall.mallId}
                    style={{
                      borderTop:  idx === 0 ? "none" : "1px solid var(--gray-a4)",
                      color:      "var(--gray-12)",
                      background: mall.mallId === FAKE_MALL.mallId ? "rgba(37,99,235,.02)" : "transparent",
                    }}
                    className="transition hover:bg-black/[.015]">

                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0"
                          style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a5)" }}>
                          {mall.logoUrl
                            ? <img src={mall.logoUrl} alt={mall.name} className="h-full w-full object-cover" />
                            : <div className="h-full w-full flex items-center justify-center text-lg">🏬</div>}
                        </div>
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {mall.name}
                            {mall.mallId === FAKE_MALL.mallId && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: "rgba(37,99,235,.1)", color: "#2563eb" }}>
                                تجريبي
                              </span>
                            )}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>#{mall.mallId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium">{mall.location || "—"}</div>
                      {mall.city?.name && (
                        <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--gray-10)" }}>
                          <FiMapPin size={10} /> {mall.city.name}
                        </div>
                      )}
                    </td>

                    {/* Services */}
                    <td className="px-5 py-4">
                      {Array.isArray(mall.services) && mall.services.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {mall.services.slice(0, 2).map((s, i) => (
                            <span key={s.serviceId || i}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ border: "1px solid var(--gray-a6)", color: "var(--gray-11)" }}>
                              {s.name || s}
                            </span>
                          ))}
                          {mall.services.length > 2 && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ border: "1px solid var(--gray-a6)", color: "var(--gray-10)" }}>
                              +{mall.services.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--gray-10)" }}>لا توجد خدمات</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4"><StatusBadge status={mall.status} /></td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <AdminActionsMenu
                        mall={mall} loading={!!rowLoading[mall.mallId]}
                        onView={(m)  => { setSelectedMall(m); setViewOpen(true);  }}
                        onEdit={(m)  => { setSelectedMall(m); setEditOpen(true);  }}
                        onActivate={handleActivate}
                        onDeactivate={handleDeactivate}
                        onChangeStatus={handleChangeStatus}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!fetchLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t"
              style={{ borderColor: "var(--gray-a5)" }}>
              <span className="text-xs" style={{ color: "var(--gray-10)" }}>
                صفحة {page + 1} من {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border transition hover:opacity-80 disabled:opacity-30"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                  <FiChevronRight size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium border transition"
                      style={{
                        borderColor: p === page ? "#2563eb" : "var(--gray-a6)",
                        background:  p === page ? "#2563eb" : "transparent",
                        color:       p === page ? "#fff"    : "var(--gray-12)",
                      }}>
                      {p + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border transition hover:opacity-80 disabled:opacity-30"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                  <FiChevronLeft size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <MallDetailsDialog
        open={viewOpen} onOpenChange={setViewOpen} mall={selectedMall}
        onEdit={(m) => { setSelectedMall(m); setViewOpen(false); setEditOpen(true); }}
      />
      <MallFormDialog
        open={addOpen} onOpenChange={setAddOpen} mall={null}
        onSuccess={() => { showToast("تم إنشاء المول بنجاح ✓"); fetchMalls(); }}
      />
      <MallFormDialog
        open={editOpen} onOpenChange={setEditOpen} mall={selectedMall}
        onSuccess={() => { showToast("تم تحديث المول بنجاح ✓"); fetchMalls(); }}
      />
    </>
  );
}