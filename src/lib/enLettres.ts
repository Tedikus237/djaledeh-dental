const U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix sept", "dix huit", "dix neuf"];
const T = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre vingt", "quatre vingt"];

function moins100(n: number, final: boolean): string {
  if (n < 20) return U[n];
  const d = Math.floor(n / 10), u = n % 10;
  if (d === 7 || d === 9) return u === 1 && d === 7 ? "soixante et onze" : `${T[d]} ${U[10 + u]}`;
  if (u === 0) return d === 8 ? "quatre vingt" + (final ? "s" : "") : T[d];
  return u === 1 && d < 8 ? `${T[d]} et un` : `${T[d]} ${U[u]}`;
}
function moins1000(n: number, final: boolean): string {
  const h = Math.floor(n / 100), r = n % 100, p: string[] = [];
  if (h > 0) p.push((h > 1 ? U[h] + " " : "") + "cent" + (h > 1 && r === 0 && final ? "s" : ""));
  if (r > 0) p.push(moins100(r, final));
  return p.join(" ");
}

export function enLettres(montant: number): string {
  const n = Math.round(montant);
  if (n === 0) return "ZÉRO";
  const mil = Math.floor(n / 1_000_000), k = Math.floor((n % 1_000_000) / 1000), r = n % 1000, p: string[] = [];
  if (mil > 0) p.push(mil === 1 ? "un million" : moins1000(mil, false) + " millions");
  if (k > 0) p.push(k === 1 ? "mille" : moins1000(k, false) + " mille");
  if (r > 0) p.push(moins1000(r, true));
  return p.join(" ").toUpperCase();
}
