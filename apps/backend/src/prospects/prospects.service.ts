import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ProspectsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sector?: string;
  }) {
    const { page = 1, limit = 20, search, status, sector } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (sector) where.sector = sector;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [prospects, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prospect.count({ where }),
    ]);

    return { prospects, total, page, limit };
  }

  async findOne(id: string) {
    const prospect = await this.prisma.prospect.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { startTime: 'desc' },
          take: 5,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            result: true,
            resultNotes: true,
            status: true,
            durationMinutes: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    if (!prospect) {
      throw new NotFoundException('Potansiyel müşteri bulunamadı');
    }

    return prospect;
  }

  async create(dto: CreateProspectDto, userId: string) {
    const existing = await this.prisma.prospect.findFirst({
      where: { companyName: dto.companyName, phone: dto.phone },
    });

    if (existing) {
      throw new BadRequestException('Bu firma adı ve telefon kombinasyonu zaten mevcut');
    }

    const prospect = await this.prisma.prospect.create({ data: dto });

    await this.activityLogs.log({
      userId,
      action: 'CREATE',
      entityType: 'prospect',
      entityId: prospect.id,
      newValue: prospect,
    });

    return prospect;
  }

  async update(id: string, dto: UpdateProspectDto, userId: string) {
    const existing = await this.findOne(id);

    const prospect = await this.prisma.prospect.update({
      where: { id },
      data: dto,
    });

    await this.activityLogs.log({
      userId,
      action: 'UPDATE',
      entityType: 'prospect',
      entityId: id,
      oldValue: existing,
      newValue: prospect,
    });

    return prospect;
  }

  async toggleStatus(id: string, userId: string) {
    const prospect = await this.findOne(id);
    const newStatus = prospect.status === 'active' ? 'passive' : 'active';

    const updated = await this.prisma.prospect.update({
      where: { id },
      data: { status: newStatus as any },
    });

    await this.activityLogs.log({
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'prospect',
      entityId: id,
      oldValue: { status: prospect.status },
      newValue: { status: newStatus },
    });

    return updated;
  }

  async importFromExcel(buffer: Buffer, userId: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    if (rows.length > 1000) {
      throw new BadRequestException('Maksimum 1000 satır yüklenebilir');
    }

    const batch = await this.prisma.prospectImportBatch.create({
      data: {
        fileName: 'excel-import.xlsx',
        uploadedBy: userId,
        totalRows: rows.length,
        status: 'processing',
      },
    });

    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const companyName = row['firma_adi'] || row['company_name'] || row['Firma Adı'];
        const contactPerson = row['yetkili_kisi'] || row['contact_person'] || row['Yetkili Kişi'];
        const phone = row['telefon'] || row['phone'] || row['Telefon'];
        const address = row['adres'] || row['address'] || row['Adres'];
        const latitude = parseFloat(row['enlem'] || row['latitude'] || row['Enlem']);
        const longitude = parseFloat(row['boylam'] || row['longitude'] || row['Boylam']);

        if (!companyName || !contactPerson || !phone || !address || isNaN(latitude) || isNaN(longitude)) {
          errors.push({ row: i + 2, error: 'Zorunlu alanlar eksik' });
          errorCount++;
          continue;
        }

        const existing = await this.prisma.prospect.findFirst({
          where: { companyName: String(companyName), phone: String(phone) },
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        await this.prisma.prospect.create({
          data: {
            companyName: String(companyName),
            contactPerson: String(contactPerson),
            phone: String(phone),
            email: row['email'] || row['Email'] || undefined,
            address: String(address),
            latitude,
            longitude,
            sector: row['sektor'] || row['sector'] || row['Sektör'] || undefined,
            notes: row['notlar'] || row['notes'] || row['Notlar'] || undefined,
            importBatchId: batch.id,
          },
        });

        successCount++;
      } catch (err) {
        errors.push({ row: i + 2, error: String(err) });
        errorCount++;
      }
    }

    await this.prisma.prospectImportBatch.update({
      where: { id: batch.id },
      data: {
        successCount,
        errorCount,
        duplicateCount,
        status: 'completed',
        errorDetails: errors.length > 0 ? errors : undefined,
      },
    });

    await this.activityLogs.log({
      userId,
      action: 'EXCEL_IMPORT',
      entityType: 'prospect_import_batch',
      entityId: batch.id,
      newValue: { totalRows: rows.length, successCount, errorCount, duplicateCount },
    });

    return {
      batchId: batch.id,
      totalRows: rows.length,
      successCount,
      errorCount,
      duplicateCount,
      errors: errors.slice(0, 50),
    };
  }

  async getImportHistory(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      this.prisma.prospectImportBatch.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { fullName: true } },
        },
      }),
      this.prisma.prospectImportBatch.count(),
    ]);

    return { batches, total, page, limit };
  }

  async getUnassignedProspects(year: number, weekNumber: number) {
    const assignedProspectIds = await this.prisma.routePlanItem.findMany({
      where: {
        plan: { year, weekNumber },
      },
      select: { prospectId: true },
    });

    const assignedIds = assignedProspectIds.map((item: { prospectId: string }) => item.prospectId);

    return this.prisma.prospect.findMany({
      where: {
        status: 'active',
        id: { notIn: assignedIds },
      },
      orderBy: { companyName: 'asc' },
    });
  }
}
