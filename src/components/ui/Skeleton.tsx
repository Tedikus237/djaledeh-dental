import { cn } from "@/lib/utils";

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-black/[0.06]", className)} />
);

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export function PageLoadError({ error }: { error: Error }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-danger">
      <p className="font-semibold">Impossible de charger les données.</p>
      <p className="mt-2 break-words">{error.message}</p>
      <p className="mt-2">Vérifiez votre connexion. Si le problème persiste, contactez l’administrateur du cabinet.</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg border border-red-300 px-3 py-2 font-medium hover:bg-red-100">
        Réessayer
      </button>
    </div>
  );
}
