"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVisits, getFieldUsers, getTodayStats } from "@/lib/api";

interface Visit {
  id: string;
  startTime: string;
  endTime?: string;
  result?: string;
  resultNotes?: string;
  status: string;
  durationMinutes?: number;
  cancelReason?: string;
  user?: { id: string; fullName: string };
  prospect?: {
    id: string;
    companyName: string;
    contactPerson: string;
    address: string;
  };
}

interface FieldUser {
  id: string;
  fullName: string;
}

interface TodayStats {
  totalToday: number;
  completedToday: number;
  inProgress: number;
  resultCounts: { positive: number; neutral: number; negative: number };
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fieldUsers, setFieldUsers] = useState<FieldUser[]>([]);
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  useEffect(() => {
    (async () => {
      const [usersRes, statsRes] = await Promise.all([
        getFieldUsers(),
        getTodayStats(),
      ]);
      if (usersRes.success) setFieldUsers(usersRes.data as FieldUser[]);
      if (statsRes.success) setStats(statsRes.data as TodayStats);
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getVisits({
      page,
      limit,
      userId: userFilter !== "all" ? userFilter : undefined,
      result: resultFilter !== "all" ? resultFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    if (res.success) {
      setVisits(res.data as Visit[]);
      setTotal(res.meta?.total || 0);
    }
    setLoading(false);
  }, [page, userFilter, resultFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const resultBadge = (result?: string) => {
    if (!result) return <Badge variant="outline">-</Badge>;
    switch (result) {
      case "positive":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Yatkın</Badge>;
      case "neutral":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Nötr</Badge>;
      case "negative":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Yatkın Değil</Badge>;
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "started":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Devam Ediyor</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Tamamlandı</Badge>;
      case "cancelled":
        return <Badge variant="secondary">İptal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes}dk`;
    return `${Math.floor(minutes / 60)}sa ${minutes % 60}dk`;
  };

  const userItems = fieldUsers.reduce(
    (acc, u) => ({ ...acc, [u.id]: u.fullName }),
    {} as Record<string, string>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ziyaret Logları</h2>
        <p className="text-muted-foreground">Tüm saha ziyaretlerini görüntüleyin</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Bugün Toplam</div>
              <div className="text-2xl font-bold">{stats.totalToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Tamamlanan</div>
              <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Devam Eden</div>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground">Sonuç Dağılımı</div>
              <div className="text-xs mt-1 space-x-2">
                <span className="text-green-600">{stats.resultCounts.positive} yatkın</span>
                <span className="text-yellow-600">{stats.resultCounts.neutral} nötr</span>
                <span className="text-red-600">{stats.resultCounts.negative} değil</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={userFilter}
          onValueChange={(v) => { if (v) { setUserFilter(v as string); setPage(1); } }}
          items={{ all: "Tüm Kullanıcılar", ...userItems }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kullanıcı" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
            {fieldUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={resultFilter}
          onValueChange={(v) => { if (v) { setResultFilter(v as string); setPage(1); } }}
          items={{ all: "Tüm Sonuçlar", positive: "Yatkın", neutral: "Nötr", negative: "Yatkın Değil" }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sonuç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Sonuçlar</SelectItem>
            <SelectItem value="positive">Yatkın</SelectItem>
            <SelectItem value="neutral">Nötr</SelectItem>
            <SelectItem value="negative">Yatkın Değil</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => { if (v) { setStatusFilter(v as string); setPage(1); } }}
          items={{ all: "Tüm Durumlar", completed: "Tamamlandı", started: "Devam Ediyor", cancelled: "İptal" }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
            <SelectItem value="started">Devam Ediyor</SelectItem>
            <SelectItem value="cancelled">İptal</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[150px]"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
        />
        <Input
          type="date"
          className="w-[150px]"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
        />
      </div>

      {/* Visits Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Ziyaret kaydı bulunamadı.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Sonuç</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Not</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(v.startTime).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {v.user?.fullName || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{v.prospect?.companyName || "-"}</div>
                      <div className="text-xs text-muted-foreground">{v.prospect?.contactPerson}</div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(v.startTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {v.endTime
                        ? new Date(v.endTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDuration(v.durationMinutes)}
                    </TableCell>
                    <TableCell>{resultBadge(v.result)}</TableCell>
                    <TableCell>{statusBadge(v.status)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {v.resultNotes || v.cancelReason || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
