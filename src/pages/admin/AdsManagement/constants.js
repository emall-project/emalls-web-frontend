// ── Template ──────────────────────────────────────────────────────────────────
export const TEMPLATE_STATUSES = ["ACTIVE", "RESERVED", "ARCHIVED"];

export const TEMPLATE_STATUS_LABELS = {
  ACTIVE:   "نشط",
  RESERVED: "محجوز",
  ARCHIVED: "مؤرشف",
};

export const TEMPLATE_STATUS_COLORS = {
  ACTIVE:   { bg: "var(--green-a3)",  fg: "var(--green-11)",  dot: "var(--green-9)"  },
  RESERVED: { bg: "var(--blue-a3)",   fg: "var(--blue-11)",   dot: "var(--blue-9)"   },
  ARCHIVED: { bg: "var(--gray-a3)",   fg: "var(--gray-11)",   dot: "var(--gray-9)"   },
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
  PENDING:   { bg: "var(--yellow-a3)",  fg: "var(--yellow-11)",  dot: "var(--yellow-9)"  },
  APPROVED:  { bg: "var(--green-a3)",   fg: "var(--green-11)",   dot: "var(--green-9)"   },
  REJECTED:  { bg: "var(--red-a3)",     fg: "var(--red-11)",     dot: "var(--red-9)"     },
  CANCELLED: { bg: "var(--gray-a3)",    fg: "var(--gray-11)",    dot: "var(--gray-9)"    },
};

export const PAYMENT_STATUS_LABELS = {
  UNPAID: "غير مدفوع",
  PAID:   "مدفوع",
};

export const PAYMENT_STATUS_COLORS = {
  UNPAID: { bg: "var(--red-a3)",   fg: "var(--red-11)"   },
  PAID:   { bg: "var(--green-a3)", fg: "var(--green-11)" },
};

