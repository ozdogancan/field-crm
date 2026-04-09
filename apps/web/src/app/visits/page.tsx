import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VisitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ziyaret Logları</h2>
        <p className="text-muted-foreground">Tüm ziyaret kayıtlarını görüntüleyin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ziyaret Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sprint 3'te geliştirilecek. Ziyaret logları ve filtreleme burada olacak.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
