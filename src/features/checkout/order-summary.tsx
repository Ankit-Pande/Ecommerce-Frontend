import { inr } from "@/lib/format";

export type SummaryLine = {
  mrpPaise: number;
  finalPaise: number;
  quantity: number;
};

// Price card shared by cart and checkout. Prices come from the backend; this
// only adds them up. The action button (or a message) is passed as children.
export function OrderSummary({
  lines,
  children,
}: {
  lines: SummaryLine[];
  children: React.ReactNode;
}) {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const mrpTotal = lines.reduce(
    (sum, line) => sum + line.mrpPaise * line.quantity,
    0,
  );
  const total = lines.reduce(
    (sum, line) => sum + line.finalPaise * line.quantity,
    0,
  );
  const savings = mrpTotal - total;

  return (
    <aside
      aria-label="Order summary"
      className="card p-5 sm:p-6 lg:sticky lg:top-24"
    >
      <h2 className="text-lg font-bold">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <Row
          label={`Subtotal (${itemCount} ${itemCount === 1 ? "item" : "items"})`}
        >
          {inr(mrpTotal)}
        </Row>
        {savings > 0 && (
          <Row label="Discount">
            <span className="text-deal">−{inr(savings)}</span>
          </Row>
        )}
        <Row label="Delivery fee">
          <span className="text-leaf">Free</span>
        </Row>
      </dl>
      <div className="my-5 border-t border-sand dark:border-white/10" />
      <div className="flex items-end justify-between">
        <span className="font-bold">Total</span>
        <span className="font-display text-2xl font-bold">{inr(total)}</span>
      </div>
      {savings > 0 && (
        <p className="mt-2 text-right text-xs font-bold text-leaf">
          You save {inr(savings)}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </aside>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}
