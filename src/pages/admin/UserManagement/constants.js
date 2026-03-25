export const ROLE_OPTIONS = [
  { value: 1, label: "Admin" },
  { value: 2, label: "Shop Owner" },
  { value: 3, label: "Customer" },
];

export const ROLE_LABELS = {
  1: "Admin",
  2: "Shop Owner",
  3: "Customer",
};

export const ROLE_COLORS = {
  1: { bg: "rgba(37,99,235,.10)",  fg: "#2563eb" },
  2: { bg: "rgba(22,163,74,.10)",  fg: "#16a34a" },
  3: { bg: "rgba(202,138,4,.12)",  fg: "#ca8a04" },
};

export const ACTIVE_OPTIONS = [
  { value: "true",  label: "نشط",      dot: "#16a34a" },
  { value: "false", label: "غير نشط",  dot: "#ef4444" },
];

export const FAKE_USER = {
  userId:   999,
  fullName: "Lama Hafiz - تجريبي",
  email:    "lama.demo@example.com",
  phone:    { prefix: "+972", number: "599339444" },
  role:     { roleId: 2, code: "ROLE_SHOP_OWNER", name: "Shop Owner" },
  isActive: true,
};

// ── Helpers ────────────────────────────────────────────────────────────────
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.status  ||
    error?.message                  ||
    "حدث خطأ غير متوقع"
  );
}

export function getRoleId(user) {
  return Number(user?.role?.roleId ?? user?.roleId ?? 0);
}

export function getRoleLabel(user) {
  const roleId = getRoleId(user);
  return user?.role?.name || ROLE_LABELS[roleId] || "—";
}

export function getPhonePrefix(user) {
  return user?.phone?.prefix || user?.phone?.countryCode || "+970";
}

export function getPhoneNumber(user) {
  return user?.phone?.number || "";
}

export function formatPhone(user) {
  const prefix = getPhonePrefix(user);
  const number = getPhoneNumber(user);
  if (!number) return "—";
  return `${prefix} ${number}`;
}

export function buildUpdatePayload(user, overrides = {}) {
  return {
    userId:   user?.userId,
    fullName: overrides.fullName ?? user?.fullName ?? "",
    phone: {
      prefix: overrides.prefix ?? getPhonePrefix(user),
      number: overrides.number ?? getPhoneNumber(user),
    },
    isActive: typeof overrides.isActive === "boolean" ? overrides.isActive : !!user?.isActive,
  };
}

export function extractUsersResponse(res) {
  const raw  = res?.data ?? res ?? {};
  const data = raw?.data ?? raw;

  const list =
    (Array.isArray(data?.content) && data.content) ||
    (Array.isArray(raw?.content)  && raw.content)  ||
    (Array.isArray(data)          && data)          ||
    (Array.isArray(raw)           && raw)           ||
    [];

  return {
    list,
    totalPages:    data?.totalPages    ?? raw?.totalPages    ?? 1,
    totalElements: data?.totalElements ?? raw?.totalElements ?? list.length,
  };
}