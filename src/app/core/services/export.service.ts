import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
}

export interface ExportKpi {
  label: string;
  value: string;
}

export interface ExportConfig {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: any[];
  kpis?: ExportKpi[];
  /** Filas que son totales/padres (para resaltar en Excel/PDF) */
  totalRowIndices?: number[];
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  // ===========================================================================
  // EXCEL
  // ===========================================================================

  async exportExcel(config: ExportConfig): Promise<void> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'CRM Contable';
    wb.created = new Date();

    const ws = wb.addWorksheet('Informe', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    // --- Título ---
    ws.mergeCells(1, 1, 1, config.columns.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = config.title;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F2937' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 28;

    // --- Subtítulo (rango de fechas, etc.) ---
    if (config.subtitle) {
      ws.mergeCells(2, 1, 2, config.columns.length);
      const subCell = ws.getCell(2, 1);
      subCell.value = config.subtitle;
      subCell.font = { size: 11, italic: true, color: { argb: 'FF6B7280' } };
      subCell.alignment = { horizontal: 'center' };
    }

    // --- KPIs ---
    let kpiRow = config.subtitle ? 3 : 2;
    if (config.kpis && config.kpis.length > 0) {
      const kpiPerRow = 4;
      const kpiRows = Math.ceil(config.kpis.length / kpiPerRow);
      for (let i = 0; i < kpiRows; i++) {
        const rowIdx = kpiRow + i;
        const batch = config.kpis.slice(i * kpiPerRow, (i + 1) * kpiPerRow);
        for (let j = 0; j < batch.length; j++) {
          const colIdx = j * 2 + 1;
          const labelCell = ws.getCell(rowIdx, colIdx);
          labelCell.value = batch[j].label;
          labelCell.font = { bold: true, size: 10, color: { argb: 'FF374151' } };
          labelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' },
          };
          const valCell = ws.getCell(rowIdx, colIdx + 1);
          valCell.value = batch[j].value;
          valCell.font = { bold: true, size: 11, color: { argb: 'FF1D4ED8' } };
        }
      }
      kpiRow += kpiRows + 1;
    }

    // --- Encabezados de tabla ---
    const headerRowNum = kpiRow + 1;
    config.columns.forEach((col, i) => {
      const cell = ws.getCell(headerRowNum, i + 1);
      cell.value = col.header;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' },
      };
      cell.alignment = {
        horizontal: col.align || 'left',
        vertical: 'middle',
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
      };
    });
    ws.getRow(headerRowNum).height = 22;

    // --- Filas de datos ---
    const totalSet = new Set(config.totalRowIndices || []);
    config.rows.forEach((row, rowIdx) => {
      const excelRow = ws.getRow(headerRowNum + 1 + rowIdx);
      const isTotal = totalSet.has(rowIdx);

      config.columns.forEach((col, colIdx) => {
        const cell = excelRow.getCell(colIdx + 1);
        let value = row[col.key];

        // Formatear números
        if (typeof value === 'number') {
          cell.value = value;
          cell.numFmt = '#,##0.00';
        } else {
          cell.value = value ?? '';
        }

        cell.alignment = {
          horizontal: col.align || 'left',
          vertical: 'middle',
        };

        if (isTotal) {
          cell.font = { bold: true, size: 10, color: { argb: 'FF1F2937' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDBEAFE' },
          };
        } else {
          cell.font = { size: 10 };
        }

        // Resaltar saldos contrarios en rojo
        if (row.esSaldoContrario && col.key === 'saldo') {
          cell.font = { bold: true, size: 10, color: { argb: 'FFDC2626' } };
        }
      });
      excelRow.commit();
    });

    // --- Anchos de columna ---
    config.columns.forEach((col, i) => {
      ws.getColumn(i + 1).width = col.width || 18;
    });

    // --- Descargar ---
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${this.sanitizeFileName(config.title)}.xlsx`);
  }

  // ===========================================================================
  // PDF
  // ===========================================================================

  exportPDF(config: ExportConfig): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Título ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(config.title, pageWidth / 2, 15, { align: 'center' });

    // --- Subtítulo ---
    let y = 22;
    if (config.subtitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text(config.subtitle, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    // --- KPIs ---
    if (config.kpis && config.kpis.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      const kpiText = config.kpis
        .map((k) => `${k.label}: ${k.value}`)
        .join('    |    ');
      doc.text(kpiText, pageWidth / 2, y, { align: 'center' });
      y += 8;
    }

    // --- Tabla ---
    const head = [config.columns.map((c) => c.header)];
    const body = config.rows.map((row) =>
      config.columns.map((col) => {
        const val = row[col.key];
        if (typeof val === 'number') {
          return val.toLocaleString('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        return val ?? '';
      }),
    );

    const totalSet = new Set(config.totalRowIndices || []);

    autoTable(doc, {
      head,
      body,
      startY: y + 2,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: config.columns.reduce((acc, col, i) => {
        acc[i] = {
          halign: col.align || 'left',
          cellWidth: col.width ? col.width * 2.5 : 'auto',
        };
        return acc;
      }, {} as any),
      didParseCell: (data) => {
        if (data.section === 'body') {
          const rowIdx = data.row.index;
          if (totalSet.has(rowIdx)) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [219, 234, 254];
          }
          // Saldo contrario en rojo
          const colKey = config.columns[data.column.index]?.key;
          if (colKey === 'saldo' && config.rows[rowIdx]?.esSaldoContrario) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // --- Pie de página con número de página ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 20,
        doc.internal.pageSize.getHeight() - 8,
      );
    }

    doc.save(`${this.sanitizeFileName(config.title)}.pdf`);
  }

  // ===========================================================================
  // WORD
  // ===========================================================================

  async exportWord(config: ExportConfig): Promise<void> {
    // --- Encabezado ---
    const children: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: config.title, bold: true, size: 32 })],
      }),
    ];

    if (config.subtitle) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: config.subtitle, italics: true, size: 20, color: '6B7280' }),
          ],
        }),
      );
    }

    // --- KPIs ---
    if (config.kpis && config.kpis.length > 0) {
      children.push(new Paragraph({ text: '' })); // Espacio
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: config.kpis.map((k) => `${k.label}: ${k.value}`).join('   |   '),
              bold: true,
              size: 22,
              color: '1D4ED8',
            }),
          ],
        }),
      );
    }

    children.push(new Paragraph({ text: '' })); // Espacio

    // --- Tabla ---
    const totalSet = new Set(config.totalRowIndices || []);

    const headerRow = new TableRow({
      tableHeader: true,
      children: config.columns.map(
        (col) =>
          new TableCell({
            width: { size: col.width ? Math.round(100 / config.columns.length) : 100 / config.columns.length, type: WidthType.PERCENTAGE },
            shading: { fill: '1E40AF' },
            children: [
              new Paragraph({
                alignment: col.align === 'right' ? AlignmentType.RIGHT : col.align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
                children: [
                  new TextRun({ text: col.header, bold: true, color: 'FFFFFF', size: 18 }),
                ],
              }),
            ],
          }),
      ),
    });

    const dataRows = config.rows.map(
      (row, rowIdx) =>
        new TableRow({
          children: config.columns.map((col) => {
            const val = row[col.key];
            const displayVal =
              typeof val === 'number'
                ? val.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : (val ?? '');
            const isTotal = totalSet.has(rowIdx);
            const isContrario = col.key === 'saldo' && row.esSaldoContrario;

            return new TableCell({
              shading: isTotal ? { fill: 'DBEAFE' } : undefined,
              children: [
                new Paragraph({
                  alignment: col.align === 'right' ? AlignmentType.RIGHT : col.align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: String(displayVal),
                      bold: isTotal || isContrario,
                      color: isContrario ? 'DC2626' : '1F2937',
                      size: 18,
                    }),
                  ],
                }),
              ],
            });
          }),
        }),
    );

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    });

    // --- Crear documento ---
    // En docx, las secciones aceptan (Paragraph | Table)[] en children
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [...children, table],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${this.sanitizeFileName(config.title)}.docx`);
  }

  // ===========================================================================
  // Utilidades
  // ===========================================================================

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ _-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 80);
  }
}
