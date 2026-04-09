import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ayarlar</h2>
        <p className="text-muted-foreground">Mail ayarları ve sistem konfigürasyonu</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mail Ayarları</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sprint 4'te geliştirilecek. Gün sonu mail ayarları burada olacak.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
