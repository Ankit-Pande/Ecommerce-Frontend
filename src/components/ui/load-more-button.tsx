import { Button } from "@/components/ui/button";

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
