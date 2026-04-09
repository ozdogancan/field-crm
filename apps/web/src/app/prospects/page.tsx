"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Upload, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getProspects, toggleProspectStatus } from "@/lib/api";

interface Prospect {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  sector?: string;
  status: string;
  createdAt: string;
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getProspects({
      page,
      limit,
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    });
    if (res.success) {
      setProspects(res.data as Prospect[]);
      setTotal(res.meta?.total || 0);
    }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleToggleStatus = async (id: string) => {
    await toggleProspectStatus(id);
    fetchData();
  };

  const totalPages = Math.ceil(total / limit);

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>;
      case "passive":
        return <Badge variant="secondary">Pasif</Badge>;
      case "visited":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ziyaret Edildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Potansiyel Müşteriler</h2>
          <p className="text-muted-foreground">Toplam {total} müşteri</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Excel Import
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Firma adı, yetkili veya telefon ara..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="passive">Pasif</SelectItem>
            <SelectItem value="visited">Ziyaret Edildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : prospects.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Müşteri bulunamadı.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma Adı</TableHead>
                  <TableHead>Yetkili Kişi</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Sektör</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.companyName}</TableCell>
                    <TableCell>{p.contactPerson}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell>{p.sector || "-"}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(p.id)}
                      >
                        {p.status === "active" ? "Pasif Yap" : "Aktif Yap"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
