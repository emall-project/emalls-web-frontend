export const SHOP_STATUSES = ["ACTIVE", "INACTIVE"];
export const SHOP_ADMIN_STATUSES = ["NONE", "MAINTENANCE", "BLOCKED"];

export const SHOP_STATUS_LABELS = {
  ACTIVE:      "نشط",
  INACTIVE:    "غير نشط",
};

export const SHOP_ADMIN_STATUS_LABELS = {
  NONE:        "بدون تقييد",
  MAINTENANCE: "صيانة",
  BLOCKED:     "محظور",
};

export const SHOP_STATUS_COLORS = {
  ACTIVE:      { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)" },
  INACTIVE:    { bg: "var(--red-a3)",   fg: "var(--red-11)",   dot: "var(--red-9)"   },
};

export const SHOP_ADMIN_STATUS_COLORS = {
  NONE:        { bg: "var(--gray-a3)",  fg: "var(--gray-11)",  dot: "var(--gray-9)"  },
  MAINTENANCE: { bg: "var(--blue-a3)",  fg: "var(--blue-11)",  dot: "var(--blue-9)"  },
  BLOCKED:     { bg: "var(--red-a3)",   fg: "var(--red-11)",   dot: "var(--red-9)"   },
};

export const SHOP_CATEGORIES = [
  "CLOTHING", "ELECTRONICS", "FOOD", "BEVERAGES", "BOOKS",
  "TOYS", "JEWELRY", "SPORTS", "HEALTH", "BEAUTY", "HOME",
  "FURNITURE", "OTHER",
];

export const CATEGORY_LABELS = {
  CLOTHING:    "ملابس",
  ELECTRONICS: "إلكترونيات",
  FOOD:        "طعام",
  BEVERAGES:   "مشروبات",
  HEALTH:      "صحة",
  BEAUTY:      "تجميل",
  SPORTS:      "رياضة",
  BOOKS:       "كتب",
  JEWELRY:     "مجوهرات",
  HOME:        "منزل",
  FURNITURE:   "أثاث",
  TOYS:        "ألعاب",
  OTHER:       "أخرى",
};
