"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Upload, Search, ChevronLeft, ChevronRight, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { getProspects, toggleProspectStatus, createProspect, importProspects } from "@/lib/api";

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

  // New Prospect Dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    companyName: "", contactPerson: "", phone: "", email: "",
    address: "", latitude: "", longitude: "", sector: "", notes: "",
  });
  const [newSaving, setNewSaving] = useState(false);
  const [newError, setNewError] = useState("");

  // Import Dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- New Prospect ---
  const handleNewSubmit = async () => {
    setNewError("");
    if (!newForm.companyName || !newForm.contactPerson || !newForm.phone || !newForm.address) {
      setNewError("Firma adı, yetkili kişi, telefon ve adres zorunludur.");
      return;
    }
    const lat = parseFloat(newForm.latitude);
    const lng = parseFloat(newForm.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setNewError("Enlem ve boylam geçerli sayılar olmalıdır.");
      return;
    }

    setNewSaving(true);
    const res = await createProspect({
      companyName: newForm.companyName,
      contactPerson: newForm.contactPerson,
      phone: newForm.phone,
      email: newForm.email || undefined,
      address: newForm.address,
      latitude: lat,
      longitude: lng,
      sector: newForm.sector || undefined,
      notes: newForm.notes || undefined,
    });
    setNewSaving(false);

    if (res.success) {
      setNewDialogOpen(false);
      setNewForm({ companyName: "", contactPerson: "", phone: "", email: "", address: "", latitude: "", longitude: "", sector: "", notes: "" });
      fetchData();
    } else {
      setNewError(res.error?.message || res.message || "Bir hata oluştu");
    }
  };

  // --- Excel Import ---
  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    const res = await importProspects(importFile);
    setImporting(false);
    if (res.success) {
      setImportResult(res.data);
      fetchData();
    } else {
      setImportResult({ error: res.error?.message || res.message || "Import hatası" });
    }
  };

  const resetImportDialog = () => {
    setImportFile(null);
    setImportResult(null);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          {/* Excel Import Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) resetImportDialog(); }}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background h-9 px-4 py-2 hover:bg-accent hover:text-accent-foreground">
              <Upload className="h-4 w-4" />
              Excel Import
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excel ile Müşteri Yükle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Excel dosyanızda şu sütunlar olmalıdır: <strong>firma_adi</strong>, <strong>yetkili_kisi</strong>, <strong>telefon</strong>, <strong>adres</strong>, <strong>enlem</strong>, <strong>boylam</strong>. Opsiyonel: email, sektor, notlar.
                </div>

                <div className="space-y-2">
                  <Label>Dosya Seçin (.xlsx)</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      setImportFile(e.target.files?.[0] || null);
                      setImportResult(null);
                    }}
                  />
                </div>

                {importFile && !importResult && (
                  <Button onClick={handleImport} disabled={importing} className="w-full">
                    <FileUp className="mr-2 h-4 w-4" />
                    {importing ? "Yükleniyor..." : `"${importFile.name}" Yükle`}
                  </Button>
                )}

                {importResult && !importResult.error && (
                  <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle className="h-5 w-5" />
                      Import Tamamlandı
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Başarılı</div>
                        <div className="font-bold text-green-600">{importResult.successCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duplicate</div>
                        <div className="font-bold text-yellow-600">{importResult.duplicateCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Hatalı</div>
                        <div className="font-bold text-red-600">{importResult.errorCount}</div>
                      </div>
                    </div>
                    {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                      <div className="mt-2 text-xs text-red-600 max-h-32 overflow-y-auto">
                        {importResult.errorDetails.map((e: any, i: number) => (
                          <div key={i}>Satır {e.row}: {e.error}</div>
                        ))}
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => { setImportDialogOpen(false); resetImportDialog(); }}>
                      Kapat
                    </Button>
                  </div>
                )}

                {importResult?.error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {importResult.error}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* New Prospect Dialog */}
          <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4 py-2 hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Yeni Müşteri
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {newError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {newError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Firma Adı *</Label>
                    <Input
                      value={newForm.companyName}
                      onChange={(e) => setNewForm({ ...newForm, companyName: e.target.value })}
                      placeholder="ABC Şirketi"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Yetkili Kişi *</Label>
                    <Input
                      value={newForm.contactPerson}
                      onChange={(e) => setNewForm({ ...newForm, contactPerson: e.target.value })}
                      placeholder="Mehmet Demir"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Telefon *</Label>
                    <Input
                      value={newForm.phone}
                      onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                      placeholder="+905551234567"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newForm.email}
                      onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                      placeholder="info@firma.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Adres *</Label>
                  <Input
                    value={newForm.address}
                    onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                    placeholder="Atatürk Cad. No:1, Kadıköy, İstanbul"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Enlem *</Label>
                    <Input
                      type="number"
                      step="any"
                      value={newForm.latitude}
                      onChange={(e) => setNewForm({ ...newForm, latitude: e.target.value })}
                      placeholder="41.0082"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Boylam *</Label>
                    <Input
                      type="number"
                      step="any"
                      value={newForm.longitude}
                      onChange={(e) => setNewForm({ ...newForm, longitude: e.target.value })}
                      placeholder="28.9784"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Sektör</Label>
                  <Input
                    value={newForm.sector}
                    onChange={(e) => setNewForm({ ...newForm, sector: e.target.value })}
                    placeholder="Tekstil"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Notlar</Label>
                  <Textarea
                    value={newForm.notes}
                    onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                    placeholder="Ek notlar..."
                    rows={2}
                  />
                </div>
                <Button onClick={handleNewSubmit} disabled={newSaving} className="w-full">
                  {newSaving ? "Kaydediliyor..." : "Müşteri Ekle"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
        <Select
          value={statusFilter}
          onValueChange={(v) => { if (v) { setStatusFilter(v as string); setPage(1); } }}
          items={{ all: "Tümü", active: "Aktif", passive: "Pasif", visited: "Ziyaret Edildi" }}
        >
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
