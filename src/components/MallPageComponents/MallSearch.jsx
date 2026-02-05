import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoSearchOutline } from "react-icons/io5";

export default function MallSearch({ mallId }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const query = (q || "").trim();
    if (query.length < 2) return;

    // ✅ يروح لنفس SearchPage بس مع mallId => results داخل المول فقط
    navigate(`/search?q=${encodeURIComponent(query)}&mallId=${encodeURIComponent(mallId)}`);
  };

  return (
    <section className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-4">
      <form
        onSubmit={submit}
        className="
          flex items-center gap-3
          border border-black/10 bg-white
          px-4 py-3
        "
      >
        <button
          type="submit"
          className="h-10 w-10 grid place-items-center border border-black/10 hover:bg-black hover:text-white transition"
          aria-label="search"
        >
          <IoSearchOutline className="text-xl" />
        </button>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث داخل هذا المول (متاجر / منتجات)..."
          className="flex-1 outline-none text-right text-sm md:text-base font-light tracking-wide"
          dir="rtl"
        />

        <div className="hidden sm:block text-xs text-black/40 font-light tracking-widest uppercase">
          MALL SEARCH
        </div>
      </form>
    </section>
  );
}
