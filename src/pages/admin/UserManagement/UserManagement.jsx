import React, { useState, useCallback, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  FiPlus, FiSearch, FiMail, FiPhone, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiAlertCircle,
  FiMoreVertical, FiEye, FiEdit, FiCheckCircle, FiXCircle, FiUser,
} from "react-icons/fi";
import { usersApi } from "./api";
import {
  ROLE_OPTIONS, ACTIVE_OPTIONS,
  getErrorMessage, extractUsersResponse,
  formatPhone, getRoleLabel,
} from "./constants";
import {
  useThemeContainer, Toast, StatusBadge, RoleBadge,
  FilterInput, CustomDropdown, Spinner,
} from "./ui";
import UserDetailsDialog from "./UserDetailsDialog";
import UserFormDialog    from "./UserFormDialog";

// ── Actions Menu ──────────────────────────────────────────────────────────────
function UserActionsMenu({ user, loading, onView, onEdit, onToggleActive }) {
  const themeContainer = useThemeContainer();
  const isActive = !!user?.isActive;

  const menuStyle = {
    background: "var(--gray-1)",
    border:     "1px solid var(--gray-a6)",
    color:      "var(--gray-12)",
    boxShadow:  "0 14px 40px rgba(0,0,0,.35)",
  };

  return (
    <DropdownMenu.Root dir="rtl">
      <DropdownMenu.Trigger asChild>
        <button type="button" disabled={loading}
          className="p-2 rounded-lg transition outline-none hover:opacity-70"
          style={{ color: "var(--gray-12)" }}>
          {loading ? <Spinner size={14} /> : <FiMoreVertical />}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={themeContainer}>
        <DropdownMenu.Content sideOffset={8} align="end"
          className="z-50 min-w-[190px] rounded-xl p-2 outline-none" style={menuStyle}>
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold" style={{ color: "var(--gray-10)" }}>
            الإجراءات
          </DropdownMenu.Label>
          <DDItem icon={<FiEye />}  onSelect={() => onView(user)}>عرض التفاصيل</DDItem>
          <DDItem icon={<FiEdit />} onSelect={() => onEdit(user)}>تعديل المستخدم</DDItem>
          <DropdownMenu.Separator className="my-1.5 mx-2" style={{ height: 1, background: "var(--gray-a5)" }} />
          <DDItem icon={isActive ? <FiXCircle /> : <FiCheckCircle />}
            onSelect={() => onToggleActive(user, !isActive)}>
            {isActive ? "تعطيل المستخدم" : "تفعيل المستخدم"}
          </DDItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function DDItem({ children, icon, onSelect }) {
  return (
    <DropdownMenu.Item
      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm cursor-pointer select-none outline-none transition-colors hover:bg-black/5"
      onSelect={(e) => { e.preventDefault(); onSelect?.(); }}
      style={{ color: "var(--gray-12)" }}>
      <span className="text-base opacity-75">{icon}</span>
      <span className="font-medium">{children}</span>
    </DropdownMenu.Item>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users,         setUsers]         = useState([]);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalElements, setTotalElements] = useState(1);
  const [fetchLoading,  setFetchLoading]  = useState(false);
  const [fetchError,    setFetchError]    = useState("");

  const [page,            setPage]            = useState(0);
  const [fullNameFilter,  setFullNameFilter]  = useState("");
  const [emailFilter,     setEmailFilter]     = useState("");
  const [phoneFilter,     setPhoneFilter]     = useState("");
  const [roleFilter,      setRoleFilter]      = useState("");
  const [activeFilter,    setActiveFilter]    = useState("");

  const [viewOpen,      setViewOpen]      = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [addOpen,       setAddOpen]       = useState(false);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [rowLoading,    setRowLoading]    = useState({});
  const [toast,         setToast]         = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const fetchUsers = useCallback(async () => {
    setFetchLoading(true); setFetchError("");
    try {
      const params = {
        page, size: 10,
        ...(fullNameFilter ? { "full-name":     fullNameFilter } : {}),
        ...(emailFilter    ? { email:           emailFilter    } : {}),
        ...(phoneFilter    ? { "phone-number":  phoneFilter    } : {}),
        ...(roleFilter     ? { role:            roleFilter     } : {}),
        ...(activeFilter   ? { is_active:       activeFilter   } : {}),
      };
      const res = await usersApi.getAll(params);
      const { list, totalPages, totalElements } = extractUsersResponse(res);
      setUsers(list);
      setTotalPages(totalPages || 1);
      setTotalElements(totalElements || list.length);
    } catch (error) {
      setFetchError(getErrorMessage(error) || "فشل في جلب البيانات");
      setUsers([]);
    } finally { setFetchLoading(false); }
  }, [page, fullNameFilter, emailFilter, phoneFilter, roleFilter, activeFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(0); }, [fullNameFilter, emailFilter, phoneFilter, roleFilter, activeFilter]);

  const handleToggleActive = async (user, nextActive) => {
    setRowLoading((p) => ({ ...p, [user.userId]: true }));
    try {
      if (nextActive) {
        await usersApi.activate(user.userId);
      } else {
        await usersApi.deactivate(user.userId);
      }
      showToast(nextActive ? `تم تفعيل ${user.fullName}` : `تم تعطيل ${user.fullName}`);
      fetchUsers();
    } catch (error) { showToast(getErrorMessage(error), "error"); }
    finally { setRowLoading((p) => ({ ...p, [user.userId]: false })); }
  };

  const clearFilters = () => {
    setFullNameFilter(""); setEmailFilter(""); setPhoneFilter("");
    setRoleFilter(""); setActiveFilter(""); setPage(0);
  };
  const hasFilters = fullNameFilter || emailFilter || phoneFilter || roleFilter || activeFilter;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div dir="rtl" className="space-y-6 p-3 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button onClick={fetchUsers} disabled={fetchLoading}
              className="px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: "var(--gray-a7)", background: "transparent", color: "var(--gray-12)" }}>
              {fetchLoading ? <Spinner size={14} /> : <FiRefreshCw size={14} />} تحديث
            </button>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition"
              style={{ background: "#2563eb", color: "#fff" }}>
              <FiPlus /> إضافة مستخدم
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة المستخدمين</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--gray-11)" }}>
              {totalElements > 0 ? `${totalElements} مستخدم مسجل` : "إدارة المستخدمين"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-5"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a7)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الاسم الكامل</label>
              <FilterInput value={fullNameFilter} onChange={setFullNameFilter} placeholder="ابحث بالاسم..." icon={FiUser} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>البريد الإلكتروني</label>
              <FilterInput value={emailFilter} onChange={setEmailFilter} placeholder="ابحث بالبريد..." icon={FiMail} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>رقم الهاتف</label>
              <FilterInput value={phoneFilter} onChange={setPhoneFilter} placeholder="ابحث بالرقم..." icon={FiPhone} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الدور</label>
              <CustomDropdown value={roleFilter} onChange={setRoleFilter}
                options={ROLE_OPTIONS} placeholder="كل الأدوار" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
              <CustomDropdown value={activeFilter} onChange={setActiveFilter}
                options={ACTIVE_OPTIONS} placeholder="كل الحالات" />
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

        {/* Error banner */}
        {fetchError && (
          <div className="rounded-2xl px-5 py-3 flex items-center justify-between gap-3"
            style={{ background: "var(--red-2)", border: "1px solid var(--red-6)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--red-11)" }}>
              <FiAlertCircle size={15} />
              <span>{fetchError}</span>
            </div>
            <button onClick={fetchUsers} className="text-xs font-semibold underline flex-shrink-0"
              style={{ color: "var(--red-11)" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl overflow-hidden overflow-x-auto"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a7)" }}>
          <table className="w-full text-sm" style={{ minWidth: 660 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--gray-a6)", background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                {["المستخدم", "البريد الإلكتروني", "الهاتف", "الدور", "الحالة", "الإجراءات"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-right font-semibold text-xs tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fetchLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2" style={{ color: "var(--gray-10)" }}>
                      <Spinner size={20} /> جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm" style={{ color: "var(--gray-10)" }}>
                    لا يوجد مستخدمون مطابقون.
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.userId}
                    style={{
                      borderTop:  idx === 0 ? "none" : "1px solid var(--gray-a5)",
                      color:      "var(--gray-12)",
                      background: "transparent",
                    }}
                    className="transition hover:bg-(--gray-a3)">

                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a5)", color: "var(--gray-11)" }}>
                          <FiUser size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{user.fullName || "—"}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>#{user.userId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>{user.email || "—"}</div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium">{formatPhone(user)}</div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4"><RoleBadge user={user} /></td>

                    {/* Status */}
                    <td className="px-5 py-4"><StatusBadge active={!!user.isActive} /></td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <UserActionsMenu
                        user={user} loading={!!rowLoading[user.userId]}
                        onView={(u)  => { setSelectedUser(u); setViewOpen(true);  }}
                        onEdit={(u)  => { setSelectedUser(u); setEditOpen(true);  }}
                        onToggleActive={handleToggleActive}
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
              style={{ borderColor: "var(--gray-a6)" }}>
              <span className="text-xs" style={{ color: "var(--gray-11)" }}>
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

      {/* Dialogs */}
      <UserDetailsDialog
        open={viewOpen} onOpenChange={setViewOpen} user={selectedUser}
        onEdit={(u) => { setSelectedUser(u); setViewOpen(false); setEditOpen(true); }}
      />
      <UserFormDialog
        open={addOpen} onOpenChange={setAddOpen} user={null} showToast={showToast}
        onSuccess={() => { showToast("تم إنشاء المستخدم بنجاح ✓"); fetchUsers(); }}
      />
      <UserFormDialog
        open={editOpen} onOpenChange={setEditOpen} user={selectedUser} showToast={showToast}
        onSuccess={() => { showToast("تم تحديث المستخدم بنجاح ✓"); fetchUsers(); }}
      />
    </>
  );
}
