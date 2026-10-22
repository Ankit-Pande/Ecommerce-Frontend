import { Spinner } from "@/components/ui/spinner";

const VARIANTS = {
  primary: "btn-primary",
  outline: "btn-outline",
  line: "btn-line",
  danger: "btn-danger",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  loading?: boolean;
};

// Button with our styles that shows a spinner and is disabled while loading.
export function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
