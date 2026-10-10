import { Filter, X } from "lucide-react";
import { safeColor } from "@/lib/sanitize";
import type { ProductFacets } from "@/lib/types";
import { Button } from "@/components/ui/button";

type ProductFiltersProps = {
  facets: ProductFacets;
  brand: string;
  color: string;
  discountOnly: boolean;
  minPrice: string;
  maxPrice: string;
  activeFilterCount: number;
  onBrandChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onDiscountChange: (value: boolean) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onClear: () => void;
};

// Brand, colour, price and offer filters.
export function ProductFilters({
  facets,
  brand,
  color,
  discountOnly,
  minPrice,
  maxPrice,
  activeFilterCount,
  onBrandChange,
  onColorChange,
  onDiscountChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
}: ProductFiltersProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold">Filter products</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-extrabold text-accent"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-5 space-y-6">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={(event) => onDiscountChange(event.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--color-accent))]"
          />
          Only products on offer
        </label>

        {facets.brands.length > 0 && (
          <fieldset>
            <legend className="mb-2.5 text-xs font-extrabold text-gray-600">
              Brand
            </legend>
            <select
              value={brand}
              onChange={(event) => onBrandChange(event.target.value)}
              className="field text-xs font-semibold"
            >
              <option value="">All brands</option>
              {facets.brands.map((option) => (
                <option key={option.id} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </fieldset>
        )}

        {facets.colors.length > 0 && (
          <fieldset>
            <legend className="mb-2.5 text-xs font-extrabold text-gray-600">
              Colour
            </legend>
            <div className="flex flex-wrap gap-2">
              {facets.colors.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onColorChange(color === option ? "" : option)}
                  aria-label={`Filter by ${option}`}
                  aria-pressed={color === option}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
                    color === option
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line hover:border-accent/40"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/15 bg-gradient-to-br from-pink-400 via-amber-300 to-sky-400"
                    style={
                      safeColor(option)
                        ? { background: safeColor(option) ?? undefined }
                        : undefined
                    }
                  />
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-2.5 text-xs font-extrabold text-gray-600">
            Price range
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <PriceInput
              label="Minimum"
              value={minPrice}
              placeholder="₹ 0"
              onChange={onMinPriceChange}
            />
            <PriceInput
              label="Maximum"
              value={maxPrice}
              placeholder="₹ Any"
              onChange={onMaxPriceChange}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}

// Filters in a bottom sheet on phones.
export function MobileProductFilters({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        className={`absolute inset-y-0 right-0 w-[86vw] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-accent" />
            <h2 className="font-display text-xl font-bold">Filters</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        <Button onClick={onClose} className="mt-6 w-full">
          Show products
        </Button>
      </aside>
    </div>
  );
}

// Rupee input for the price range.
function PriceInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-semibold text-gray-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        placeholder={placeholder}
        className="field px-3 text-xs"
      />
    </label>
  );
}
