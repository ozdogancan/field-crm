import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private prisma: PrismaService,
    private reportsService: ReportsService,
  ) {}

  // Run every day at 18:00 (Istanbul time ~ UTC+3)
  @Cron('0 18 * * 1-5', { timeZone: 'Europe/Istanbul' })
  async sendDailySummaryEmail() {
    this.logger.log('Gün sonu mail özeti hazırlanıyor...');

    try {
      const summary = await this.reportsService.getDailySummary();
      const html = this.buildSummaryHtml(summary);

      // Get recipients from settings
      const setting = await this.prisma.appSetting.findFirst({
        where: { key: 'email_recipients' },
      });
      const recipients = setting ? (setting as any).value : 'yonetici@fieldcrm.com';

      // Log the dispatch (actual sending would use nodemailer/resend/etc.)
      await this.prisma.emailDispatchLog.create({
        data: {
          type: 'daily_summary',
          recipients,
          subject: `Günlük Ziyaret Özeti - ${summary.date}`,
          body: html,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Gün sonu özeti hazırlandı: ${summary.totalVisits} ziyaret, ${summary.completedVisits} tamamlandı`);
      this.logger.log(`Alıcılar: ${recipients}`);
      this.logger.log('------- MAIL İÇERİĞİ -------');
      this.logger.log(this.buildSummaryText(summary));
      this.logger.log('------- MAIL SONU -------');

      return { success: true, summary };
    } catch (error) {
      this.logger.error('Mail gönderim hatası:', error);

      await this.prisma.emailDispatchLog.create({
        data: {
          type: 'daily_summary',
          recipients: '',
          subject: 'HATA - Günlük Özet',
          body: String(error),
          status: 'failed',
          sentAt: new Date(),
        },
      });

      return { success: false, error };
    }
  }

  // Manual trigger endpoint
  async triggerDailySummary(date?: string) {
    const summary = await this.reportsService.getDailySummary(date);
    const html = this.buildSummaryHtml(summary);
    const text = this.buildSummaryText(summary);

    await this.prisma.emailDispatchLog.create({
      data: {
        type: 'daily_summary_manual',
        recipients: 'manual_trigger',
        subject: `Günlük Ziyaret Özeti - ${summary.date}`,
        body: html,
        status: 'sent',
        sentAt: new Date(),
      },
    });

    return { summary, html, text };
  }

  async getEmailLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.emailDispatchLog.findMany({
        where: {},
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      }),
      this.prisma.emailDispatchLog.count(),
    ]);
    return { logs, total, page, limit };
  }

  private buildSummaryText(summary: any): string {
    const lines = [
      `📊 GÜNLÜK ZİYARET ÖZETİ - ${summary.date}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Toplam Ziyaret: ${summary.totalVisits}`,
      `Tamamlanan: ${summary.completedVisits}`,
      `İptal: ${summary.cancelledVisits}`,
      '',
    ];

    if (summary.users.length === 0) {
      lines.push('Bugün ziyaret kaydı bulunmamaktadır.');
    } else {
      for (const user of summary.users) {
        lines.push(`👤 ${user.fullName}`);
        lines.push(`   Ziyaret: ${user.totalVisits} | Tamamlanan: ${user.completed}`);
        lines.push(`   Sonuçlar: ✅${user.results.positive} ➖${user.results.neutral} ❌${user.results.negative}`);

        for (const v of user.visits) {
          const resultIcon = v.result === 'positive' ? '✅' : v.result === 'negative' ? '❌' : '➖';
          lines.push(`   ${resultIcon} ${v.companyName} (${v.duration}dk) ${v.notes ? '- ' + v.notes : ''}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private buildSummaryHtml(summary: any): string {
    const userRows = summary.users.map((user: any) => {
      const visitRows = user.visits.map((v: any) => {
        const color = v.result === 'positive' ? '#22c55e' : v.result === 'negative' ? '#ef4444' : '#eab308';
        return `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #eee">${v.companyName}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">
            <span style="color:${color};font-weight:bold">${v.result || v.companyName}</span>
          </td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">${v.duration}dk</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;color:#666">${v.notes}</td>
        </tr>`;
      }).join('');

      return `
        <div style="margin-bottom:20px">
          <h3 style="color:#1e40af;margin:0 0 8px">${user.fullName}</h3>
          <p style="margin:0 0 8px;color:#666">
            Toplam: ${user.totalVisits} | Tamamlanan: ${user.completed} |
            <span style="color:#22c55e">${user.results.positive} yatkın</span>,
            <span style="color:#eab308">${user.results.neutral} nötr</span>,
            <span style="color:#ef4444">${user.results.negative} olumsuz</span>
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="background:#f8fafc">
              <th style="padding:6px 8px;text-align:left">Müşteri</th>
              <th style="padding:6px 8px;text-align:center">Sonuç</th>
              <th style="padding:6px 8px;text-align:center">Süre</th>
              <th style="padding:6px 8px;text-align:left">Not</th>
            </tr>
            ${visitRows}
          </table>
        </div>`;
    }).join('');

    return `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
        <div style="background:#1e40af;color:white;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:20px">📊 Günlük Ziyaret Özeti</h1>
          <p style="margin:4px 0 0;opacity:0.9">${summary.date}</p>
        </div>
        <div style="padding:20px;background:#fff;border:1px solid #e2e8f0">
          <div style="display:flex;gap:16px;margin-bottom:20px">
            <div style="flex:1;background:#f0fdf4;padding:12px;border-radius:6px;text-align:center">
              <div style="font-size:24px;font-weight:bold;color:#16a34a">${summary.completedVisits}</div>
              <div style="font-size:12px;color:#666">Tamamlanan</div>
            </div>
            <div style="flex:1;background:#fef2f2;padding:12px;border-radius:6px;text-align:center">
              <div style="font-size:24px;font-weight:bold;color:#dc2626">${summary.cancelledVisits}</div>
              <div style="font-size:12px;color:#666">İptal</div>
            </div>
            <div style="flex:1;background:#eff6ff;padding:12px;border-radius:6px;text-align:center">
              <div style="font-size:24px;font-weight:bold;color:#2563eb">${summary.totalVisits}</div>
              <div style="font-size:12px;color:#666">Toplam</div>
            </div>
          </div>
          ${summary.users.length === 0 ? '<p style="color:#666;text-align:center">Bugün ziyaret kaydı bulunmamaktadır.</p>' : userRows}
        </div>
        <div style="padding:12px;background:#f8fafc;border-radius:0 0 8px 8px;text-align:center;font-size:12px;color:#94a3b8;border:1px solid #e2e8f0;border-top:none">
          Field CRM - Otomatik Gün Sonu Özeti
        </div>
      </div>`;
  }
}
