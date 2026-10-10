import { Suspense } from "react";
import { LoginForm } from "@/features/login/login-form";
import { ListSkeleton } from "@/components/ui/skeletons";

// Login page.
export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-12">
          <ListSkeleton count={2} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
