"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CalendarDays, ClipboardList, Users } from "lucide-react";
import { api, getToken } from "@/lib/api";

interface Stats {
  totalProspects: number;
  totalUsers: number;
  todayVisits: number;
  completedVisits: number;
}

interface RecentProspect {
  id: string;
  companyName: string;
  contactPerson: string;
  sector: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalProspects: 0, totalUsers: 0, todayVisits: 0, completedVisits: 0 });
  const [recentProspects, setRecentProspects] = useState<RecentProspect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const token = getToken();
      if (!token) return;

      const [prospectsRes, usersRes] = await Promise.all([
        api("/prospects?limit=5", { token }),
        api("/users?limit=50", { token }),
      ]);

      if (prospectsRes.success && usersRes.success) {
        const fieldUsers = (usersRes.data as any[]).filter((u: any) => u.role === "field_user" && u.isActive);
        setStats({
          totalProspects: prospectsRes.meta?.total || 0,
          totalUsers: fieldUsers.length,
          todayVisits: 0,
          completedVisits: 0,
        });
        setRecentProspects(prospectsRes.data as RecentProspect[]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Yükleniyor...</p></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Günlük özet ve metrikler</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProspects}</div>
            <p className="text-xs text-muted-foreground">Aktif potansiyel müşteriler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Planlar</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits}</div>
            <p className="text-xs text-muted-foreground">Planlanan ziyaretler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedVisits}</div>
            <p className="text-xs text-muted-foreground">Bugünkü ziyaretler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saha Ekibi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Aktif saha kullanıcısı</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Eklenen Müşteriler</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProspects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz müşteri verisi yok.</p>
          ) : (
            <div className="space-y-3">
              {recentProspects.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{p.companyName}</p>
                    <p className="text-sm text-muted-foreground">{p.contactPerson}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.sector && (
                      <Badge variant="outline">{p.sector}</Badge>
                    )}
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>
                      {p.status === "active" ? "Aktif" : p.status === "visited" ? "Ziyaret Edildi" : "Pasif"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
