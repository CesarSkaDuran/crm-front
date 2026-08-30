import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  /**
   * Exporta un array de objetos a Excel.
   * @param data Array de objetos a exportar
   * @param fileName Nombre del archivo (sin extensión)
   * @param sheetName Nombre de la hoja
   * @param columns Columnas a exportar (opcional). Si no se especifica, usa todas.
   */
  export<T extends Record<string, any>>(
    data: T[],
    fileName: string,
    sheetName: string = 'Datos',
    columns?: { key: keyof T; label: string }[],
  ): void {
    if (!data || data.length === 0) {
      this.exportEmpty(fileName, sheetName);
      return;
    }

    // Si se especifican columnas, filtrar y renombrar
    const rows = columns
      ? data.map((row) => {
          const obj: Record<string, any> = {};
          columns.forEach((c) => {
            obj[c.label] = row[c.key];
          });
          return obj;
        })
      : data;

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  /**
   * Exporta múltiples hojas en un solo archivo.
   */
  exportMultiSheet(
    sheets: { name: string; data: any[]; columns?: { key: string; label: string }[] }[],
    fileName: string,
  ): void {
    const wb = XLSX.utils.book_new();

    for (const sheet of sheets) {
      let rows = sheet.data;
      if (sheet.columns && sheet.data.length > 0) {
        rows = sheet.data.map((row) => {
          const obj: Record<string, any> = {};
          sheet.columns!.forEach((c) => {
            obj[c.label] = row[c.key];
          });
          return obj;
        });
      }
      const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  private exportEmpty(fileName: string, sheetName: string) {
    const ws = XLSX.utils.json_to_sheet([{ mensaje: 'No hay datos para exportar' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
}
