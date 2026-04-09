"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import {
  getFieldUsers,
  getPlans,
  getProspects,
  createPlan,
  updatePlan,
  deletePlan,
  getCurrentWeek,
} from "@/lib/api";

interface Prospect {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
  sector?: string;
  status: string;
}

interface PlanItem {
  id?: string;
  prospectId: string;
  dayOfWeek: number;
  visitOrder: number;
  status?: string;
  prospect?: Prospect;
}

interface Plan {
  id: string;
  userId: string;
  year: number;
  weekNumber: number;
  status: string;
  user?: { id: string; fullName: string };
  items: PlanItem[];
}

interface FieldUser {
  id: string;
  fullName: string;
  email: string;
}

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function getWeekDates(year: number, weekNumber: number): Date[] {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfJan4 = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfJan4 + 1 + (weekNumber - 1) * 7);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(d: Date): string {
  return `${d.getUTCDate().toString().padStart(2, "0")}.${(d.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

export default function PlanningPage() {
  const [fieldUsers, setFieldUsers] = useState<FieldUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [year, setYear] = useState(2026);
  const [weekNumber, setWeekNumber] = useState(1);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [draftItems, setDraftItems] = useState<PlanItem[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingDay, setAddingDay] = useState<number | null>(null);

  // Load current week on mount
  useEffect(() => {
    (async () => {
      const res = await getCurrentWeek();
      if (res.success && res.data) {
        setYear(res.data.year);
        setWeekNumber(res.data.week);
      }
    })();
  }, []);

  // Load field users
  useEffect(() => {
    (async () => {
      const res = await getFieldUsers();
      if (res.success && res.data) {
        setFieldUsers(res.data as FieldUser[]);
      }
    })();
  }, []);

  // Load prospects
  useEffect(() => {
    (async () => {
      const res = await getProspects({ limit: 100, status: "active" });
      if (res.success && res.data) {
        setProspects(res.data as Prospect[]);
      }
    })();
  }, []);

  // Load plan when user/week changes
  const fetchPlan = useCallback(async () => {
    if (!selectedUserId) {
      setPlan(null);
      setDraftItems([]);
      return;
    }
    setLoading(true);
    const res = await getPlans({ userId: selectedUserId, year, weekNumber });
    if (res.success && res.data && (res.data as Plan[]).length > 0) {
      const p = (res.data as Plan[])[0];
      setPlan(p);
      setDraftItems(
        p.items.map((item) => ({
          prospectId: item.prospectId,
          dayOfWeek: item.dayOfWeek || getDayFromDate(item),
          visitOrder: item.visitOrder,
          prospect: item.prospect,
          status: item.status,
        }))
      );
    } else {
      setPlan(null);
      setDraftItems([]);
    }
    setLoading(false);
  }, [selectedUserId, year, weekNumber]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Helper to get dayOfWeek from plannedDate if dayOfWeek not stored
  function getDayFromDate(item: any): number {
    if (item.plannedDate) {
      const d = new Date(item.plannedDate);
      const day = d.getUTCDay();
      return day === 0 ? 7 : day;
    }
    return 1;
  }

  const weekDates = getWeekDates(year, weekNumber);

  // Get items for a specific day
  const getItemsForDay = (day: number) =>
    draftItems
      .filter((item) => item.dayOfWeek === day)
      .sort((a, b) => a.visitOrder - b.visitOrder);

  // Get prospects not yet in plan
  const availableProspects = prospects.filter(
    (p) => !draftItems.some((item) => item.prospectId === p.id)
  );

  const handleAddProspect = (day: number, prospectId: string) => {
    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect) return;
    const dayItems = getItemsForDay(day);
    setDraftItems([
      ...draftItems,
      {
        prospectId,
        dayOfWeek: day,
        visitOrder: dayItems.length + 1,
        prospect,
      },
    ]);
    setAddingDay(null);
  };

  const handleRemoveItem = (prospectId: string, day: number) => {
    const updated = draftItems.filter(
      (item) => !(item.prospectId === prospectId && item.dayOfWeek === day)
    );
    // Recalculate visit orders
    for (let d = 1; d <= 7; d++) {
      let order = 1;
      for (const item of updated) {
        if (item.dayOfWeek === d) {
          item.visitOrder = order++;
        }
      }
    }
    setDraftItems(updated);
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);

    const items = draftItems.map((item) => ({
      prospectId: item.prospectId,
      dayOfWeek: item.dayOfWeek,
      visitOrder: item.visitOrder,
    }));

    if (plan) {
      await updatePlan(plan.id, { items });
    } else {
      await createPlan({ userId: selectedUserId, year, weekNumber, items });
    }

    await fetchPlan();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm("Bu planı silmek istediğinize emin misiniz?")) return;
    await deletePlan(plan.id);
    setPlan(null);
    setDraftItems([]);
  };

  const changeWeek = (delta: number) => {
    let newWeek = weekNumber + delta;
    let newYear = year;
    if (newWeek < 1) {
      newYear--;
      newWeek = 52;
    } else if (newWeek > 52) {
      newYear++;
      newWeek = 1;
    }
    setYear(newYear);
    setWeekNumber(newWeek);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Taslak</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Tamamlandı</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Haftalık Plan</h2>
          <p className="text-muted-foreground">
            Saha kullanıcıları için haftalık rut planı oluşturun
          </p>
        </div>
      </div>

      {/* Week & User Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[180px]">
            <div className="font-semibold">
              {year} - Hafta {weekNumber}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => changeWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select
          value={selectedUserId}
          onValueChange={(v) => { if (v) setSelectedUserId(v as string); }}
          items={fieldUsers.reduce((acc, u) => ({ ...acc, [u.id]: u.fullName }), {} as Record<string, string>)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Saha kullanıcısı seçin" />
          </SelectTrigger>
          <SelectContent>
            {fieldUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {plan && statusBadge(plan.status)}

        <div className="flex gap-2 ml-auto">
          {selectedUserId && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          )}
          {plan && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </Button>
          )}
        </div>
      </div>

      {/* Plan Content */}
      {!selectedUserId ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              Plan oluşturmak veya görüntülemek için bir saha kullanıcısı seçin.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5].map((day) => {
            const dayItems = getItemsForDay(day);
            return (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>
                      {DAY_NAMES[day - 1]}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({formatDate(weekDates[day - 1])})
                      </span>
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {dayItems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayItems.map((item, idx) => (
                    <div
                      key={item.prospectId}
                      className="flex items-start justify-between p-2 rounded-md border bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">
                            {idx + 1}.
                          </span>
                          <span className="text-sm font-medium truncate">
                            {item.prospect?.companyName || "?"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate pl-5">
                          {item.prospect?.contactPerson} - {item.prospect?.phone}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleRemoveItem(item.prospectId, day)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {addingDay === day ? (
                    <Select
                      defaultValue=""
                      onValueChange={(v) => { if (v) handleAddProspect(day, v as string); }}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Müşteri seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProspects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.companyName} - {p.contactPerson}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setAddingDay(day)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Müşteri Ekle
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {selectedUserId && draftItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Plan Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gün</TableHead>
                  <TableHead>Müşteri Sayısı</TableHead>
                  <TableHead>Müşteriler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((day) => {
                  const dayItems = getItemsForDay(day);
                  if (dayItems.length === 0) return null;
                  return (
                    <TableRow key={day}>
                      <TableCell className="font-medium">
                        {DAY_NAMES[day - 1]} ({formatDate(weekDates[day - 1])})
                      </TableCell>
                      <TableCell>{dayItems.length}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dayItems.map((i) => i.prospect?.companyName).join(", ")}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-bold">Toplam</TableCell>
                  <TableCell className="font-bold">{draftItems.length}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
