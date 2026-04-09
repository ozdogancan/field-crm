"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Users,
  TrendingUp,
  Clock,
  Mail,
  BarChart3,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { getDashboardStats, getUserPerformance, getWeeklyTrend, triggerDailySummary } from "@/lib/api";

interface DashboardStats {
  prospects: { total: number; active: number };
  users: { totalField: number };
  today: { totalVisits: number; completed: number; inProgress: number };
  thisWeek: { totalVisits: number; completed: number };
  overall: {
    totalVisits: number;
    totalCompleted: number;
    resultCounts: { positive: number; neutral: number; negative: number };
    avgDurationMinutes: number;
  };
  activePlans: number;
}

interface UserPerf {
  userId: string;
  fullName: string;
  totalVisits: number;
  completed: number;
  cancelled: number;
  results: { positive: number; neutral: number; negative: number };
  avgDurationMinutes: number;
  conversionRate: number;
}

interface WeekTrend {
  week: string;
  total: number;
  completed: number;
  positive: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performance, setPerformance] = useState<UserPerf[]>([]);
  const [trend, setTrend] = useState<WeekTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMail, setSendingMail] = useState(false);
  const [mailResult, setMailResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [statsRes, perfRes, trendRes] = await Promise.all([
        getDashboardStats(),
        getUserPerformance(),
        getWeeklyTrend(),
      ]);
      if (statsRes.success) setStats(statsRes.data as DashboardStats);
      if (perfRes.success) setPerformance(perfRes.data as UserPerf[]);
      if (trendRes.success) setTrend(trendRes.data as WeekTrend[]);
      setLoading(false);
    })();
  }, []);

  const handleSendSummary = async () => {
    setSendingMail(true);
    setMailResult(null);
    const res = await triggerDailySummary();
    if (res.success) {
      setMailResult("Gün sonu özeti başarıyla oluşturuldu!");
    } else {
      setMailResult("Hata: " + (res.error?.message || "Bilinmeyen hata"));
    }
    setSendingMail(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  const maxTrend = Math.max(...trend.map((t) => t.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Günlük özet ve metrikler</p>
        </div>
        <div className="flex items-center gap-2">
          {mailResult && (
            <span className="text-sm text-green-600">{mailResult}</span>
          )}
          <Button
            variant="outline"
            onClick={handleSendSummary}
            disabled={sendingMail}
          >
            <Mail className="h-4 w-4 mr-2" />
            {sendingMail ? "Gönderiliyor..." : "Gün Sonu Özeti"}
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.prospects.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.prospects.active} aktif
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bugünkü Ziyaretler</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.totalVisits}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.today.completed} tamamlandı, {stats.today.inProgress} devam ediyor
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bu Hafta</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisWeek.totalVisits}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.thisWeek.completed} tamamlandı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saha Ekibi</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.totalField}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activePlans} aktif plan
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Ziyaret</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overall.totalVisits}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.overall.totalCompleted} tamamlandı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sonuç Dağılımı</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{stats.overall.resultCounts.positive}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MinusCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{stats.overall.resultCounts.neutral}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">{stats.overall.resultCounts.negative}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">yatkın / nötr / olumsuz</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ort. Ziyaret Süresi</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.overall.avgDurationMinutes > 0
                    ? `${stats.overall.avgDurationMinutes}dk`
                    : "-"}
                </div>
                <p className="text-xs text-muted-foreground">ortalama süre</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Weekly Trend Bar Chart */}
      {trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Haftalık Ziyaret Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {trend.map((w) => (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{w.total}</span>
                  <div className="w-full flex flex-col-reverse gap-0.5">
                    <div
                      className="bg-green-400 rounded-t"
                      style={{ height: `${(w.positive / maxTrend) * 120}px`, minHeight: w.positive > 0 ? 4 : 0 }}
                    />
                    <div
                      className="bg-blue-400 rounded-t"
                      style={{ height: `${((w.completed - w.positive) / maxTrend) * 120}px`, minHeight: w.completed - w.positive > 0 ? 4 : 0 }}
                    />
                    <div
                      className="bg-gray-200 rounded-t"
                      style={{ height: `${((w.total - w.completed) / maxTrend) * 120}px`, minHeight: w.total - w.completed > 0 ? 4 : 0 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{w.week}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-400" /> Yatkın
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-400" /> Diğer Tamamlanan
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-200" /> Tamamlanmayan
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Performance Table */}
      {performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saha Ekibi Performansı</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead className="text-center">Toplam</TableHead>
                  <TableHead className="text-center">Tamamlanan</TableHead>
                  <TableHead className="text-center">İptal</TableHead>
                  <TableHead className="text-center">Yatkın</TableHead>
                  <TableHead className="text-center">Nötr</TableHead>
                  <TableHead className="text-center">Olumsuz</TableHead>
                  <TableHead className="text-center">Ort. Süre</TableHead>
                  <TableHead className="text-center">Dönüşüm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell className="text-center">{u.totalVisits}</TableCell>
                    <TableCell className="text-center">{u.completed}</TableCell>
                    <TableCell className="text-center">{u.cancelled}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">{u.results.positive}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-yellow-600 font-medium">{u.results.neutral}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 font-medium">{u.results.negative}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {u.avgDurationMinutes > 0 ? `${u.avgDurationMinutes}dk` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={u.conversionRate >= 50 ? "default" : "outline"}
                        className={u.conversionRate >= 50 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        %{u.conversionRate}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
