import { ErrorCard } from "@/components/ErrorCard";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <ErrorCard
        title="Page not found"
        message="That page doesn’t exist."
        href="/"
        hrefLabel="Back Home"
      />
    </div>
  );
}
