export const HOME_TOP_AD_POSITION = "HOME_TOP";
export const HOME_MID_PRIMARY_AD_POSITION = "SIDEBAR_LEFT";
export const HOME_MID_SECONDARY_AD_POSITION = "SIDEBAR_RIGHT";
export const HOME_FOOTER_AD_POSITION = "FOOTER";
export const CUSTOMER_ORDERS_TOP_AD_POSITION = "CUSTOMER_ORDERS_TOP";

export const HOME_PAGE_AD_POSITIONS = [
  HOME_TOP_AD_POSITION,
  HOME_MID_PRIMARY_AD_POSITION,
  HOME_MID_SECONDARY_AD_POSITION,
  HOME_FOOTER_AD_POSITION,
];

export const AD_POSITIONS = [
  ...HOME_PAGE_AD_POSITIONS,
  CUSTOMER_ORDERS_TOP_AD_POSITION,
];

export const POSITION_LABELS = {
  [HOME_TOP_AD_POSITION]: "الصفحة الرئيسية - أعلى الواجهة",
  [HOME_MID_PRIMARY_AD_POSITION]: "الصفحة الرئيسية - بعد الواجهة",
  [HOME_MID_SECONDARY_AD_POSITION]: "الصفحة الرئيسية - قبل الاقتراحات",
  [HOME_FOOTER_AD_POSITION]: "الصفحة الرئيسية - قبل التذييل",
  [CUSTOMER_ORDERS_TOP_AD_POSITION]: "طلباتي - أعلى القائمة",
};

export function getAdPositionLabel(position) {
  if (!position) return "—";
  return POSITION_LABELS[position] || position;
}
