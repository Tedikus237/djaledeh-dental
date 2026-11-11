import { useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: T };

export function useAsync<T>(fn: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  useEffect(() => {
    let actif = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Le chargement des données dépasse 30 secondes. Vérifiez la connexion puis réessayez.")),
        30_000,
      );
    });
    void Promise.race([Promise.resolve().then(fn), timeout])
      .then((data) => {
        if (actif) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (actif) {
          setState({
            status: "error",
            error: error instanceof Error ? error : new Error("Une erreur inconnue est survenue."),
          });
        }
      })
      .finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}
