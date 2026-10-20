import { PageHeader, Card } from "@/components/ui/Card";

export default function Bientot({ titre, lot }: { titre: string; lot: number }) {
  return (
    <>
      <PageHeader eyebrow={`Lot ${lot}`} title={titre} />
      <Card className="px-6 py-14 text-center text-sm text-mute">Cet écran sera ajouté au lot {lot}.</Card>
    </>
  );
}
