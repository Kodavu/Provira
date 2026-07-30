// Shared money formatting so every client renders kobo the same way.
export function formatNaira(kobo: string | number): string {
  const n = Number(kobo) / 100;
  return (
    "₦" + new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(n)
  );
}
