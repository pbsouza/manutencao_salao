import { ServiceItem } from '../types';
import { formatDateBR } from './priority';

/**
 * Formats a clean, readable message for sharing via WhatsApp
 */
export function generateWhatsAppServiceSummary(service: ServiceItem, baseUrl?: string): string {
  let linkText = '';
  if (baseUrl) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    linkText = `${cleanBase}/?serviceId=${encodeURIComponent(service.id)}`;
  } else if (typeof window !== 'undefined') {
    try {
      const urlObj = new URL(window.location.href);
      urlObj.search = `serviceId=${encodeURIComponent(service.id)}`;
      urlObj.hash = '';
      linkText = urlObj.href;
    } catch {
      linkText = `${window.location.origin}${window.location.pathname}?serviceId=${encodeURIComponent(service.id)}`;
    }
  }

  const priorityEmoji =
    service.priority === 'Alta' ? '🔴 ALTA' : service.priority === 'Média' ? '🟡 MÉDIA' : '🟢 BAIXA';

  const riskBadge = `Risco: ${service.risk}/5 (GUT Score: ${service.priorityScore || 0})`;
  const statusBadge = service.status;

  const lines = [
    `*🏛️ SALÃO DO REINO • MANUTENÇÃO*`,
    `📋 *Chamado:* ${service.code || 'S/C'} — _${service.title}_`,
    ``,
    `📍 *Local:* ${service.location || 'Salão Principal'}`,
    `🏷️ *Categoria:* ${service.category}`,
    `⚡ *Prioridade:* ${priorityEmoji} | ${riskBadge}`,
    `📌 *Etapa:* ${statusBadge}`,
    `👤 *Responsável:* ${service.responsibleName || 'Não definido'}`,
  ];

  if (service.executorName && service.executorName !== service.responsibleName) {
    lines.push(`🛠️ *Executor:* ${service.executorName}`);
  }

  if (service.supervisorName) {
    lines.push(`👔 *Supervisor:* ${service.supervisorName}`);
  }

  if (service.dueDate) {
    lines.push(`📅 *Prazo:* ${formatDateBR(service.dueDate)}`);
  }

  if (service.isHighRisk) {
    lines.push(`⚠️ *ALTO RISCO (DC-82):* Requer EPIs e aprovação prévia`);
  }

  if (service.needsTM) {
    lines.push(`🏛️ *CONSULTA AO TM:* Requer aprovação do Treinador de Manutenção`);
  }

  if (service.recommendedSolution) {
    lines.push(``, `💡 *Solução Recomendada:*`, `_${service.recommendedSolution}_`);
  }

  lines.push(``, `🔗 *Acessar no App:*`, linkText);

  return lines.join('\n');
}

/**
 * Opens WhatsApp Web or native app with pre-filled message
 */
export function shareServiceOnWhatsApp(service: ServiceItem, phone?: string): void {
  const message = generateWhatsAppServiceSummary(service);
  const encodedText = encodeURIComponent(message);
  
  let targetUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    targetUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }

  if (typeof window !== 'undefined') {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Generates an iCalendar (.ics) file content for a maintenance event or workday
 */
export function generateCalendarICS({
  title,
  description,
  location,
  startDate,
  endDate,
  url,
}: {
  title: string;
  description: string;
  location: string;
  startDate: string; // YYYY-MM-DD or ISO
  endDate?: string;
  url?: string;
}): string {
  const cleanStart = startDate.replace(/-/g, '').substring(0, 8);
  const cleanEnd = (endDate || startDate).replace(/-/g, '').substring(0, 8);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `sr_event_${Date.now()}@salaodoreino.local`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Salão do Reino//Sistema de Manutenção//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${cleanStart}`,
    `DTEND;VALUE=DATE:${cleanEnd}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/\n/g, ' ')}`,
    url ? `URL:${url}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/**
 * Downloads a generated .ics calendar invite
 */
export function downloadCalendarEvent(eventData: Parameters<typeof generateCalendarICS>[0], filename = 'evento_manutencao.ics'): void {
  const ics = generateCalendarICS(eventData);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
