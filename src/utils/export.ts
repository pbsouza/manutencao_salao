import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CategoryItem, MonthlyBudget, ServiceItem, UserMember } from '../types';
import { formatCurrencyBRL, formatDateBR, isOverdue } from './priority';

export function exportServicesToPDF(
  services: ServiceItem[],
  reportTitle: string = 'Relatório Geral de Manutenção do Salão do Reino',
  filtersApplied: string = 'Todos os registros'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Header styling
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('SALÃO DO REINO — SISTEMA DE GERENCIAMENTO DE MANUTENÇÃO', 14, 11);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(reportTitle.toUpperCase(), 14, 18);

  doc.setFontSize(8.5);
  doc.text(`Gerado em: ${dateStr} às ${timeStr}`, 235, 11);
  doc.text(`Filtros: ${filtersApplied.slice(0, 35)}`, 235, 18);

  // Summary statistics box
  const totalItems = services.length;
  const highPriority = services.filter((s) => s.priority === 'Alta').length;
  const needsTMCount = services.filter((s) => s.needsTM || s.needsTMOption === 'Sim').length;
  const overdueCount = services.filter((s) => isOverdue(s.dueDate, s.status)).length;
  const totalEstCost = services.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
  const totalActCost = services.reduce((acc, s) => acc + (s.actualCost || 0), 0);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Resumo: ${totalItems} serviços | ${highPriority} Alta Prioridade | ${needsTMCount} Consulta TM | ${overdueCount} Atrasados | Custo Estimado: ${formatCurrencyBRL(
      totalEstCost
    )} | Realizado: ${formatCurrencyBRL(totalActCost)}`,
    14,
    30
  );

  const tableData = services.map((s) => [
    s.code,
    s.category,
    s.problem || s.title,
    `R${s.risk}`,
    s.priority,
    s.responsibleName,
    s.executorName || s.responsibleName,
    s.executionMonthName || s.forecastMonth,
    s.officialStatus,
    s.status,
    formatCurrencyBRL(s.estimatedCost),
    s.needsTM || s.needsTMOption === 'Sim' ? 'SIM' : 'NÃO',
    s.highRiskWork === 'Sim' || s.isHighRisk ? 'SIM' : 'NÃO',
  ]);

  autoTable(doc, {
    startY: 34,
    head: [
      [
        'Cód.',
        'Categoria',
        'Problema / Descrição',
        'Risco',
        'Prioridade',
        'Responsável',
        'Executor',
        'Mês Execução',
        'Status Oficial',
        'Etapa Kanban',
        'Custo Est.',
        'TM',
        'Alto Risco',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 46 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 22 },
      9: { cellWidth: 26 },
      10: { cellWidth: 18, halign: 'right' },
      11: { cellWidth: 10, halign: 'center' },
      12: { cellWidth: 12, halign: 'center' },
    },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${data.pageNumber} — Sistema de Manutenção do Salão do Reino`,
        14,
        205
      );
    },
  });

  doc.save(`Relatorio_Manutencao_SR_${now.toISOString().split('T')[0]}.pdf`);
}

export function exportServicesToExcel(
  services: ServiceItem[],
  filenamePrefix: string = 'Planejamento_Consertos_Salao_do_Reino',
  categories?: CategoryItem[],
  budgets?: MonthlyBudget[],
  members?: UserMember[]
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Services (Planejamento Consertos no padrão oficial de 18 colunas)
  const servicesRows = services.map((s) => ({
    Código: s.code,
    Categoria: s.category,
    Problema: s.problem || s.title,
    'Solução Recomendada': s.recommendedSolution,
    'Nível de Risco': s.risk,
    'Gravidade (G)': s.gravity,
    'Urgência (U)': s.urgency,
    'Tendência (T)': s.trend,
    Prioridade: s.priority,
    'Score GUT': s.priorityScore,
    'Responsável Padrão': s.responsibleName,
    'Executor Designado': s.executorName || s.responsibleName,
    'Precisa Consultar o TM': s.needsTMOption || (s.needsTM ? 'Sim' : 'Não'),
    'Trabalho de Alto Risco': s.highRiskWork || (s.isHighRisk ? 'Sim' : 'Não'),
    'Custo Estimado (R$)': s.estimatedCost,
    'Custo Aprovado (R$)': s.approvedCost,
    'Custo Realizado (R$)': s.actualCost,
    'Mês de Execução': s.executionMonthName || s.forecastMonth,
    'Previsão Mês (AAAA-MM)': s.forecastMonth,
    'Status Oficial': s.officialStatus,
    'Status Operacional (Kanban)': s.status,
    'Local no Salão': s.location,
    'Data de Identificação': s.identifiedDate,
    'Prazo Limite': s.dueDate,
    Observações: s.notes,
  }));

  const wsServices = XLSX.utils.json_to_sheet(servicesRows);
  XLSX.utils.book_append_sheet(wb, wsServices, 'Planejamento Consertos');

  // Sheet 2: Resumo Financeiro & Tetos
  if (budgets && budgets.length > 0) {
    const budgetRows = budgets.map((b) => ({
      Mês: b.month,
      'Nome do Mês': b.monthName || b.month,
      'Teto de Gastos Mensal (R$)': b.ceilingAmount,
      Observações: b.notes || '',
    }));
    const wsBudgets = XLSX.utils.json_to_sheet(budgetRows);
    XLSX.utils.book_append_sheet(wb, wsBudgets, 'Orçamento Mensal');
  }

  // Sheet 3: Categorias Cadastradas
  if (categories && categories.length > 0) {
    const catRows = categories.map((c) => ({
      ID: c.id,
      Nome: c.name,
      Descrição: c.description || '',
      'Responsável Padrão': c.defaultResponsibleName || '',
      Ativa: c.active !== false ? 'Sim' : 'Não',
    }));
    const wsCats = XLSX.utils.json_to_sheet(catRows);
    XLSX.utils.book_append_sheet(wb, wsCats, 'Categorias');
  }

  // Sheet 4: Membros e Funções
  if (members && members.length > 0) {
    const memberRows = members.map((m) => ({
      ID: m.id,
      Nome: m.name,
      Função: m.role,
      Telefone: m.phone || '',
      Categorias: m.assignedCategories ? m.assignedCategories.join(', ') : '',
    }));
    const wsMembers = XLSX.utils.json_to_sheet(memberRows);
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Equipe de Manutenção');
  }

  const now = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filenamePrefix}_${now}.xlsx`);
}
