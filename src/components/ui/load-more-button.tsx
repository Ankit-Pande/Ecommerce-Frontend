import { Button } from "@/components/ui/button";

// Loads the next page of a list.
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
      className="mx-auto flex px-7"
    >
      Load more
    </Button>
  );
}
