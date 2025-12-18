import { ErrorCard } from "@/components/ErrorCard";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <ErrorCard
        title="Page not found"
        message="That route doesn’t exist in the app."
        href="/app"
        hrefLabel="Back to App"
      />
    </div>
  );
}
