export const AUDIENCE_OPTIONS = [
  { value: "MALE",   label: "ذكر"   },
  { value: "FEMALE", label: "أنثى"  },
  { value: "ALL",    label: "للجميع" },
];

export const AGE_GROUP_OPTIONS = [
  { value: "NEWBORN",  label: "حديثي الولادة" },
  { value: "INFANT",   label: "الرضع"          },
  { value: "TODDLER",  label: "الأطفال الصغار" },
  { value: "CHILD",    label: "الأطفال"        },
  { value: "TEENAGER", label: "شباب صغار"      },
  { value: "YOUTH",    label: "الشباب"         },
  { value: "ADULT",    label: "البالغون"        },
  { value: "ALL",      label: "الجميع"         },
];

export const STATUS_COLORS = {
  true:  { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)" },
  false: { bg: "var(--red-a3)",   fg: "var(--red-11)",   dot: "var(--red-9)"  },
};
