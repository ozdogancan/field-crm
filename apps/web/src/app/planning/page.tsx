import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlanningPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Haftalık Plan</h2>
        <p className="text-muted-foreground">Saha kullanıcıları için haftalık rut planı oluşturun</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planlama Ekranı</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sprint 2'de geliştirilecek. Hafta ve kullanıcı seçimi ile plan oluşturma ekranı burada olacak.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
