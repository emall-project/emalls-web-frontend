export const SHOP_STATUSES = ["ACTIVE", "INACTIVE", "MAINTENANCE"];

export const SHOP_STATUS_LABELS = {
  ACTIVE:      "نشط",
  INACTIVE:    "غير نشط",
  MAINTENANCE: "تحت الصيانة",
};

export const SHOP_STATUS_COLORS = {
  ACTIVE:      { bg: "var(--green-a3)",  fg: "var(--green-11)",  dot: "var(--green-9)"  },
  INACTIVE:    { bg: "var(--red-a3)",    fg: "var(--red-11)",    dot: "var(--red-9)"    },
  MAINTENANCE: { bg: "var(--yellow-a3)", fg: "var(--yellow-11)", dot: "var(--yellow-9)" },
};

export const CATEGORY_LABELS = {
  CLOTHING:    "ملابس",
  ELECTRONICS: "إلكترونيات",
  FOOD:        "طعام",
  PHARMACY:    "صيدلية",
  BEAUTY:      "تجميل",
  SPORTS:      "رياضة",
  BOOKS:       "كتب",
  JEWELRY:     "مجوهرات",
  HOME:        "منزل",
  TOYS:        "ألعاب",
  OTHER:       "أخرى",
};
