import Link from "next/link";

// 404 page.
export default function NotFound() {
  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center">
      <h1 className="page-title">This page does not exist</h1>
      <Link href="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}
