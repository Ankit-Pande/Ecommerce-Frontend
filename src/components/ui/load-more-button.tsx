import { Button } from "@/components/ui/button";

// "Load more" button under lists.
export function LoadMoreButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      loading={loading}
      className="self-center px-7"
    >
      Load more
    </Button>
  );
}
