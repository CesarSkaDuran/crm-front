import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ImportResult {
  total: number;
  exitosos: number;
  fallidos: number;
  errores: string[];
  datos: any[];
}

@Injectable({ providedIn: 'root' })
export class ImportService {
  /**
   * Lee un archivo CSV o Excel y retorna un array de objetos.
   * @param file Archivo a importar
   * @returns Promise con los datos parseados
   */
  async parseFile(file: File): Promise<any[]> {
    const data = await this.readFile(file);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
    return rows as any[];
  }

  private readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target!.result as ArrayBuffer);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Mapea las columnas del archivo importado a las columnas esperadas.
   * @param datos Datos parseados del archivo
   * @param mapping Objeto { columnaDestino: columnaOrigen }
   */
  mapearColumnas(datos: any[], mapping: Record<string, string>): any[] {
    return datos.map((row) => {
      const obj: any = {};
      Object.entries(mapping).forEach(([destino, origen]) => {
        obj[destino] = row[origen] ?? '';
      });
      return obj;
    });
  }

  /**
   * Valida que los datos tengan los campos obligatorios.
   * @param datos Datos a validar
   * @param camposRequeridos Campos que no pueden estar vacíos
   */
  validar(datos: any[], camposRequeridos: string[]): ImportResult {
    const errores: string[] = [];
    let exitosos = 0;
    let fallidos = 0;
    const datosValidos: any[] = [];

    datos.forEach((row, idx) => {
      const faltantes = camposRequeridos.filter((c) => !row[c] && row[c] !== 0);
      if (faltantes.length > 0) {
        fallidos++;
        errores.push(`Fila ${idx + 2}: faltan campos ${faltantes.join(', ')}`);
      } else {
        exitosos++;
        datosValidos.push(row);
      }
    });

    return {
      total: datos.length,
      exitosos,
      fallidos,
      errores,
      datos: datosValidos,
    };
  }

  /**
   * Descarga una plantilla Excel con las columnas esperadas.
   * @param columnas Columnas de la plantilla
   * @param fileName Nombre del archivo
   */
  descargarPlantilla(columnas: string[], fileName: string): void {
    const row: Record<string, string> = {};
    columnas.forEach((c) => (row[c] = ''));
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
}
