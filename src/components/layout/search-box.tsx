"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Search field with a Search button; opens the product list.
export function SearchBox({
  label,
  placeholder,
  className,
}: {
  label: string;
  placeholder: string;
  className: string;
}) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = search.trim();
        router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
      }}
      className={`flex rounded-[14px] p-1 ${className}`}
    >
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        className="min-h-10 min-w-0 flex-1 border-0 bg-transparent px-3.5 text-ink outline-none placeholder:text-muted focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <button
        type="submit"
        className="min-h-10 rounded-[10px] bg-accent px-5 font-semibold text-white"
      >
        {label}
      </button>
    </form>
  );
}
