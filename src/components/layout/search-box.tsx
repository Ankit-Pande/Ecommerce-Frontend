"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { getCatalog } from "@/api/catalog";
import { Spinner } from "@/components/ui/spinner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

// The backend needs 2+ letters; suggestions wait until typing pauses.
const MIN_SEARCH_LENGTH = 2;
const SUGGESTION_LIMIT = "8";
const MAX_SUGGESTIONS = 6;

// Like big stores: typing shows only text suggestions. Products appear on the
// results page after Enter, the search button or a click on a suggestion.
export function SearchBox({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const term = useDebouncedValue(search.trim(), 350);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (term.length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      return;
    }

    let active = true;
    setLoading(true);
    getCatalog(new URLSearchParams({ q: term, limit: SUGGESTION_LIMIT }))
      .then((response) => {
        const names = response.items.map((product) => product.name);
        if (active)
          setSuggestions([...new Set(names)].slice(0, MAX_SUGGESTIONS));
      })
      .catch(() => {
        if (active) setSuggestions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [term]);

  function openResults(text: string) {
    const query = text.trim();
    setOpen(false);
    setSearch("");
    router.push(
      query ? `/products?q=${encodeURIComponent(query)}` : "/products",
    );
  }

  const showList =
    open && term.length >= MIN_SEARCH_LENGTH && suggestions.length > 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        openResults(search);
      }}
      role="search"
      className="relative flex h-11 min-w-0 flex-1 items-center rounded-full border border-sand bg-ivory transition focus-within:border-accent focus-within:bg-white focus-within:ring-4 focus-within:ring-accent/10 dark:border-white/10 dark:bg-white/[0.06] dark:focus-within:bg-white/10"
    >
      <input
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Delay so a click on a suggestion lands before the list closes.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        className="min-w-0 flex-1 appearance-none border-0 bg-transparent pl-4 pr-2 text-sm font-medium outline-none placeholder:text-gray-400 focus-visible:ring-0 [&::-webkit-search-cancel-button]:hidden"
      />
      {loading && (
        <span className="mr-1 text-gray-400">
          <Spinner />
        </span>
      )}
      {search && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setSuggestions([]);
          }}
          aria-label="Clear search"
          className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-mist hover:text-ink dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        aria-label={label}
        title={label}
        className="mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-chrome text-white transition hover:bg-accent dark:bg-accent"
      >
        <Search className="h-4 w-4" />
      </button>

      {showList && (
        <ul className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-sand bg-white py-1 shadow-2xl dark:border-white/10 dark:bg-chrome">
          {suggestions.map((text) => (
            <li key={text}>
              <button
                type="button"
                onClick={() => openResults(text)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-mist dark:hover:bg-white/10"
              >
                <Search className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
