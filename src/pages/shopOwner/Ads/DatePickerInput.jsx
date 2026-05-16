import { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { useThemeContainer } from "./adsUtils";

// ─── constants ────────────────────────────────────────────────────────────────

const DAY_NAMES   = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const MONTH_NAMES = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseValue(value) {
  if (!value) return null;
  const s = value.includes("T") ? value : `${value}T00:00:00`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function toDateTimeStr(y, m, d, h, min) {
  return `${toDateStr(y, m, d)}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function parseMinDate(min) {
  if (!min) return null;
  return parseValue(min);
}

function formatDisplay(value, type) {
  const date = parseValue(value);
  if (!date) return null;
  if (type === "datetime-local") {
    return new Intl.DateTimeFormat("ar-PS", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(date);
  }
  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric", month: "long", day: "numeric",
  }).format(date);
}

// ─── CalendarGrid ─────────────────────────────────────────────────────────────

function CalendarGrid({ viewYear, viewMonth, selectedDate, minDate, onSelectDay }) {
  const firstOffset = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();

  const cells = [
    ...Array(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSel = (day) =>
    day &&
    selectedDate &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth()    === viewMonth &&
    selectedDate.getDate()     === day;

  const isToday = (day) =>
    day &&
    today.getFullYear() === viewYear &&
    today.getMonth()    === viewMonth &&
    today.getDate()     === day;

  const isDisabled = (day) => {
    if (!day || !minDate) return false;
    const cell = new Date(viewYear, viewMonth, day);
    cell.setHours(0, 0, 0, 0);
    const m = new Date(minDate);
    m.setHours(0, 0, 0, 0);
    return cell < m;
  };

  return (
    <div>
      <div className="grid grid-cols-7 mb-1.5">
        {DAY_NAMES.map((n) => (
          <div key={n} className="h-7 flex items-center justify-center text-[10px] font-bold tracking-wide"
            style={{ color: "var(--gray-9)" }}>
            {n}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          const sel  = isSel(day);
          const tod  = isToday(day);
          const dis  = isDisabled(day);

          return (
            <button
              key={i}
              type="button"
              disabled={!day || dis}
              onClick={() => day && !dis && onSelectDay(day)}
              className="h-9 w-full rounded-xl text-sm flex items-center justify-center transition-all duration-100 outline-none"
              style={{
                background:  sel ? "var(--blue-9)" : "transparent",
                color:       dis ? "var(--gray-6)" :
                             sel ? "#fff" :
                             tod ? "var(--blue-9)" : "var(--gray-12)",
                border:      tod && !sel ? "1.5px solid var(--blue-7)" : "1.5px solid transparent",
                fontWeight:  sel || tod ? 700 : 500,
                cursor:      !day || dis ? "default" : "pointer",
              }}
              onMouseEnter={(e) => { if (!sel && !dis && day) e.currentTarget.style.background = "var(--gray-a3)"; }}
              onMouseLeave={(e) => { if (!sel && day) e.currentTarget.style.background = "transparent"; }}
            >
              {day ?? ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CalendarPopover (inner content) ─────────────────────────────────────────

function CalendarPopover({ type, value, minDate, onChange, onClose }) {
  const parsed = parseValue(value);
  const today  = new Date();

  const [viewYear,  setViewYear]  = useState(parsed?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()     ?? today.getMonth());
  const [hour,      setHour]      = useState(String(parsed?.getHours()   ?? 0).padStart(2, "0"));
  const [minute,    setMinute]    = useState(String(Math.floor((parsed?.getMinutes() ?? 0) / 5) * 5).padStart(2, "0"));

  useEffect(() => {
    const p = parseValue(value);
    if (p) {
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
      setHour(String(p.getHours()).padStart(2, "0"));
      setMinute(String(Math.floor(p.getMinutes() / 5) * 5).padStart(2, "0"));
    }
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleSelectDay = (day) => {
    if (type === "datetime-local") {
      onChange(toDateTimeStr(viewYear, viewMonth, day, Number(hour), Number(minute)));
    } else {
      onChange(toDateStr(viewYear, viewMonth, day));
      onClose();
    }
  };

  const handleTimeChange = (nextHour, nextMinute) => {
    const parsed2 = parseValue(value);
    if (!parsed2) return;
    onChange(toDateTimeStr(
      parsed2.getFullYear(), parsed2.getMonth(), parsed2.getDate(),
      Number(nextHour), Number(nextMinute)
    ));
  };

  const selectStyle = {
    background: "var(--gray-a2)",
    color: "var(--gray-12)",
    border: "1px solid var(--gray-a5)",
    borderRadius: 12,
    padding: "4px 8px",
    fontSize: 13,
    fontWeight: 600,
    outline: "none",
    cursor: "pointer",
    direction: "ltr",
  };

  return (
    <div dir="rtl" style={{ width: 300 }}>
      {/* Month / year header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={nextMonth}
          className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
          style={{ color: "var(--gray-10)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gray-a3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <FiChevronRight size={15} />
        </button>

        <span className="text-sm font-black" style={{ color: "var(--gray-12)" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={prevMonth}
          className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
          style={{ color: "var(--gray-10)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gray-a3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <FiChevronLeft size={15} />
        </button>
      </div>

      {/* Calendar grid */}
      <CalendarGrid
        viewYear={viewYear}
        viewMonth={viewMonth}
        selectedDate={parseValue(value)}
        minDate={minDate}
        onSelectDay={handleSelectDay}
      />

      {/* Time selector — datetime-local only */}
      {type === "datetime-local" && (
        <>
          <div className="mt-3 h-px" style={{ background: "var(--gray-a4)" }} />
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>الوقت</span>
            <select
              value={hour}
              onChange={(e) => {
                setHour(e.target.value);
                handleTimeChange(e.target.value, minute);
              }}
              style={selectStyle}
            >
              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="font-black text-sm" style={{ color: "var(--gray-9)" }}>:</span>
            <select
              value={minute}
              onChange={(e) => {
                setMinute(e.target.value);
                handleTimeChange(hour, e.target.value);
              }}
              style={selectStyle}
            >
              {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full h-10 rounded-2xl text-sm font-bold transition-all"
            style={{ background: "var(--blue-9)", color: "#fff" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--blue-10)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blue-9)"; }}
          >
            تأكيد
          </button>
        </>
      )}
    </div>
  );
}

// ─── DatePickerInput (public API) ─────────────────────────────────────────────

/**
 * Radix UI popover-based date/datetime picker.
 * type="date"           → value: "YYYY-MM-DD"
 * type="datetime-local" → value: "YYYY-MM-DDTHH:MM"
 */
export function DatePickerInput({
  label,
  value,
  onChange,
  required = false,
  error,
  type = "date",
  min,
}) {
  const [open, setOpen] = useState(false);
  const container = useThemeContainer();
  const minDate = parseMinDate(min);
  const display = formatDisplay(value, type);

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
  };

  const triggerBorder = error ? "var(--red-7)" : open ? "var(--blue-7)" : "var(--gray-a5)";
  const triggerShadow = open ? "0 0 0 3px var(--blue-a4)" : error ? "0 0 0 3px var(--red-a4)" : "none";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-right text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
          {label}
          {required && <span className="mr-0.5" style={{ color: "var(--red-9)" }}>*</span>}
        </span>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="h-12 w-full rounded-2xl border px-4 flex items-center justify-between gap-2 text-sm font-medium outline-none transition-all duration-150"
            style={{
              borderColor: triggerBorder,
              boxShadow:   triggerShadow,
              background:  "var(--gray-a2)",
              color:       display ? "var(--gray-12)" : "var(--gray-8)",
              direction:   "rtl",
            }}
          >
            <span className="truncate" dir="rtl">
              {display ?? (type === "datetime-local" ? "اختر التاريخ والوقت" : "اختر تاريخاً")}
            </span>

            <span className="flex items-center gap-1.5 shrink-0">
              {value && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={handleClear}
                  className="flex items-center justify-center rounded-lg h-5 w-5 transition-all"
                  style={{ color: "var(--gray-8)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gray-12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gray-8)"; }}
                >
                  <FiX size={12} />
                </span>
              )}
              <FiCalendar size={15} style={{ color: "var(--gray-9)" }} />
            </span>
          </button>
        </Popover.Trigger>

        <Popover.Portal container={container}>
          <Popover.Content
            side="bottom"
            align="start"
            sideOffset={8}
            className="z-[200] rounded-2xl border p-4 shadow-2xl outline-none"
            style={{
              background:  "var(--gray-2)",
              borderColor: "var(--gray-a5)",
            }}
          >
            <CalendarPopover
              type={type}
              value={value}
              minDate={minDate}
              onChange={(v) => onChange?.(v)}
              onClose={() => setOpen(false)}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && (
        <p className="text-right text-xs font-semibold" style={{ color: "var(--red-9)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
