"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  FileText,
  Download,
  Mail,
  CheckCircle2,
  XCircle,
  MinusCircle,
  CalendarDays,
} from "lucide-react";
import {
  getUserPerformance,
  getDailySummary,
  getEmailLogs,
  triggerDailySummary,
} from "@/lib/api";

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

interface DailySummary {
  date: string;
  totalVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  users: {
    userId: string;
    fullName: string;
    totalVisits: number;
    completed: number;
    results: { positive: number; neutral: number; negative: number };
    visits: { companyName: string; result: string; duration: number; notes: string }[];
  }[];
}

interface EmailLog {
  id: string;
  type: string;
  recipients: string;
  subject: string;
  status: string;
  sentAt: string;
}

export default function ReportsPage() {
  const [tab, setTab] = useState<"performance" | "daily" | "emails">("performance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [performance, setPerformance] = useState<UserPerf[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    const res = await getUserPerformance({ startDate: startDate || undefined, endDate: endDate || undefined });
    if (res.success) setPerformance(res.data as UserPerf[]);
    setLoading(false);
  }, [startDate, endDate]);

  const fetchDailySummary = useCallback(async () => {
    setLoading(true);
    const res = await getDailySummary(selectedDate);
    if (res.success) setDailySummary(res.data as DailySummary);
    setLoading(false);
  }, [selectedDate]);

  const fetchEmailLogs = useCallback(async () => {
    setLoading(true);
    const res = await getEmailLogs();
    if (res.success) setEmailLogs(res.data as EmailLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "performance") fetchPerformance();
    else if (tab === "daily") fetchDailySummary();
    else if (tab === "emails") fetchEmailLogs();
  }, [tab, fetchPerformance, fetchDailySummary, fetchEmailLogs]);

  const handleTriggerMail = async () => {
    setSendingMail(true);
    await triggerDailySummary(selectedDate);
    setSendingMail(false);
    if (tab === "emails") fetchEmailLogs();
  };

  const resultIcon = (result: string) => {
    if (result === "positive") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (result === "negative") return <XCircle className="h-4 w-4 text-red-500" />;
    return <MinusCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Raporlar</h2>
          <p className="text-muted-foreground">Performans analizi ve gün sonu özetleri</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={tab === "performance" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("performance")}
        >
          <FileText className="h-4 w-4 mr-1" />
          Performans
        </Button>
        <Button
          variant={tab === "daily" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("daily")}
        >
          <CalendarDays className="h-4 w-4 mr-1" />
          Günlük Özet
        </Button>
        <Button
          variant={tab === "emails" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("emails")}
        >
          <Mail className="h-4 w-4 mr-1" />
          Mail Logları
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      ) : (
        <>
          {/* Performance Tab */}
          {tab === "performance" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  className="w-[160px]"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Başlangıç"
                />
                <Input
                  type="date"
                  className="w-[160px]"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Bitiş"
                />
                <Button variant="outline" size="sm" onClick={fetchPerformance}>
                  Filtrele
                </Button>
              </div>

              {performance.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Veri bulunamadı.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="text-sm text-muted-foreground">Toplam Ziyaret</div>
                        <div className="text-2xl font-bold">
                          {performance.reduce((s, u) => s + u.totalVisits, 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="text-sm text-muted-foreground">Tamamlanan</div>
                        <div className="text-2xl font-bold text-green-600">
                          {performance.reduce((s, u) => s + u.completed, 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="text-sm text-muted-foreground">Yatkın</div>
                        <div className="text-2xl font-bold text-green-600">
                          {performance.reduce((s, u) => s + u.results.positive, 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="text-sm text-muted-foreground">Ort. Dönüşüm</div>
                        <div className="text-2xl font-bold">
                          %{performance.length > 0
                            ? Math.round(performance.reduce((s, u) => s + u.conversionRate, 0) / performance.length)
                            : 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance Table */}
                  <Card>
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
                              <TableCell className="text-center text-green-600 font-medium">{u.results.positive}</TableCell>
                              <TableCell className="text-center text-yellow-600 font-medium">{u.results.neutral}</TableCell>
                              <TableCell className="text-center text-red-600 font-medium">{u.results.negative}</TableCell>
                              <TableCell className="text-center">
                                {u.avgDurationMinutes > 0 ? `${u.avgDurationMinutes}dk` : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={
                                    u.conversionRate >= 50
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : u.conversionRate >= 25
                                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                      : ""
                                  }
                                  variant={u.conversionRate < 25 ? "outline" : "default"}
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

                  {/* Per-user Progress Bars */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sonuç Dağılımı (Kullanıcı Bazlı)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {performance.filter((u) => u.completed > 0).map((u) => {
                        const total = u.results.positive + u.results.neutral + u.results.negative;
                        if (total === 0) return null;
                        return (
                          <div key={u.userId}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{u.fullName}</span>
                              <span className="text-xs text-muted-foreground">{total} ziyaret</span>
                            </div>
                            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                              <div
                                className="bg-green-400"
                                style={{ width: `${(u.results.positive / total) * 100}%` }}
                              />
                              <div
                                className="bg-yellow-400"
                                style={{ width: `${(u.results.neutral / total) * 100}%` }}
                              />
                              <div
                                className="bg-red-400"
                                style={{ width: `${(u.results.negative / total) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Daily Summary Tab */}
          {tab === "daily" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  className="w-[180px]"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={fetchDailySummary}>
                  Getir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerMail}
                  disabled={sendingMail}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  {sendingMail ? "Gönderiliyor..." : "Mail Olarak Gönder"}
                </Button>
              </div>

              {dailySummary && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4 pb-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{dailySummary.totalVisits}</div>
                        <div className="text-sm text-muted-foreground">Toplam Ziyaret</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{dailySummary.completedVisits}</div>
                        <div className="text-sm text-muted-foreground">Tamamlanan</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{dailySummary.cancelledVisits}</div>
                        <div className="text-sm text-muted-foreground">İptal</div>
                      </CardContent>
                    </Card>
                  </div>

                  {dailySummary.users.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        Bu tarihte ziyaret kaydı bulunmamaktadır.
                      </CardContent>
                    </Card>
                  ) : (
                    dailySummary.users.map((user) => (
                      <Card key={user.userId}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{user.fullName}</CardTitle>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-600">{user.results.positive} yatkın</span>
                              <span className="text-yellow-600">{user.results.neutral} nötr</span>
                              <span className="text-red-600">{user.results.negative} olumsuz</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Müşteri</TableHead>
                                <TableHead className="text-center">Sonuç</TableHead>
                                <TableHead className="text-center">Süre</TableHead>
                                <TableHead>Not</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {user.visits.map((v, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">{v.companyName}</TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      {resultIcon(v.result)}
                                      <span className="text-sm">
                                        {v.result === "positive" ? "Yatkın" : v.result === "negative" ? "Olumsuz" : v.result === "neutral" ? "Nötr" : v.result}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center text-sm">{v.duration > 0 ? `${v.duration}dk` : "-"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{v.notes || "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* Email Logs Tab */}
          {tab === "emails" && (
            <Card>
              <CardContent className="p-0">
                {emailLogs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Henüz mail kaydı bulunmamaktadır.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Konu</TableHead>
                        <TableHead>Alıcı</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {new Date(log.sentAt).toLocaleString("tr-TR")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.subject}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.recipients}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                log.status === "sent"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-red-100 text-red-800 hover:bg-red-100"
                              }
                            >
                              {log.status === "sent" ? "Gönderildi" : "Hata"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
