// ── Template ──────────────────────────────────────────────────────────────────
export const TEMPLATE_STATUSES = ["ACTIVE", "RESERVED", "ARCHIVED"];

export const TEMPLATE_STATUS_LABELS = {
  ACTIVE:   "نشط",
  RESERVED: "محجوز",
  ARCHIVED: "مؤرشف",
};

export const TEMPLATE_STATUS_COLORS = {
  ACTIVE:   { bg: "#dcfce7", fg: "#16a34a", dot: "#16a34a" },
  RESERVED: { bg: "#dbeafe", fg: "#2563eb", dot: "#3b82f6" },
  ARCHIVED: { bg: "#f1f5f9", fg: "#64748b", dot: "#94a3b8" },
};

export const POSITIONS = ["HOME_TOP", "SIDEBAR_LEFT", "SIDEBAR_RIGHT", "FOOTER"];

export const POSITION_LABELS = {
  HOME_TOP:      "أعلى الصفحة",
  SIDEBAR_LEFT:  "الشريط الجانبي الأيسر",
  SIDEBAR_RIGHT: "الشريط الجانبي الأيمن",
  FOOTER:        "أسفل الصفحة",
};

export const IMAGE_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"];

// ── Request ───────────────────────────────────────────────────────────────────
export const REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export const REQUEST_STATUS_LABELS = {
  PENDING:   "قيد الانتظار",
  APPROVED:  "مقبول",
  REJECTED:  "مرفوض",
  CANCELLED: "ملغي",
};

export const REQUEST_STATUS_COLORS = {
  PENDING:   { bg: "#fef9c3", fg: "#ca8a04", dot: "#eab308" },
  APPROVED:  { bg: "#dcfce7", fg: "#16a34a", dot: "#16a34a" },
  REJECTED:  { bg: "#fee2e2", fg: "#dc2626", dot: "#ef4444" },
  CANCELLED: { bg: "#f1f5f9", fg: "#64748b", dot: "#94a3b8" },
};

export const PAYMENT_STATUS_LABELS = {
  UNPAID: "غير مدفوع",
  PAID:   "مدفوع",
};

export const PAYMENT_STATUS_COLORS = {
  UNPAID: { bg: "#fee2e2", fg: "#dc2626" },
  PAID:   { bg: "#dcfce7", fg: "#16a34a" },
};

// ── Fake data ─────────────────────────────────────────────────────────────────
export const FAKE_TEMPLATE = {
  adTemplateId:       999,
  name:               "Home Top Banner Q1 - تجريبي",
  description:        "Prime banner at the top of the home page",
  position:           "HOME_TOP",
  imageRatio:         "16:9",
  price:              500,
  startDate:          "2027-01-01",
  endDate:            "2027-03-31",
  status:             "ACTIVE",
  activeRequestCount: 1,
};

export const FAKE_REQUEST = {
  adRequestId:          999,
  templateId:           999,
  template:             { adTemplateId: 999, name: "Home Top Banner Q1 - تجريبي", position: "HOME_TOP", status: "ACTIVE" },
  shopId:               1,
  shop:                 { shopId: 1, name: "Fashion Hub - تجريبي", ownerName: "admin", ownerPhone: "+970-0599000000", ownerEmail: "admin@emalls.com", isActive: true },
  title:                "Shop 1 — Summer Sale Banner - تجريبي",
  imageUrl:             "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300&q=80",
  status:               "PENDING",
  paymentStatus:        "UNPAID",
  paidAt:               null,
  rejectionReason:      null,
  isDisplayed:          false,
  paymentReminderSent:  false,
};