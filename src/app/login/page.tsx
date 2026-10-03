import { Suspense } from "react";
import { PhoneAuthForm } from "@/features/auth/phone-auth-form";
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
      <PhoneAuthForm />
    </Suspense>
  );
}
