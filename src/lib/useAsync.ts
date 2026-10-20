import { useEffect, useState } from "react";

export function useAsync<T>(fn: () => Promise<T>): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let actif = true;
    fn().then((d) => { if (actif) setData(d); });
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return data;
}
