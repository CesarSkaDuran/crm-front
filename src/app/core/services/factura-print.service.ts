import { Injectable } from '@angular/core';
import { API_SERVER_URL } from '../api-url';

export interface FacturaPrintOpts {
  doc: any;                 // venta o compra (con detalles y tercero)
  empresa: any;             // datos de la empresa emisora
  tipo: 'venta' | 'compra';
}

const fmt = (n: any) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(n) || 0);

const esc = (s: any) => {
  const v = String(s ?? '');
  if (v === 'null' || v === 'undefined') return '';
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

@Injectable({ providedIn: 'root' })
export class FacturaPrintService {

  /**
   * Imprime la factura usando un iframe oculto (sin ventana emergente).
   * Tamaño carta fijo y encabezados de tabla repetidos por página.
   */
  imprimir({ doc, empresa, tipo }: FacturaPrintOpts) {
    const esVenta = tipo === 'venta';
    const tercero = doc.cliente || doc.proveedor || {};
    const tituloDoc = esVenta ? 'FACTURA' : 'COMPRA';
    const terceroTitulo = esVenta ? 'Facturar a:' : 'Proveedor:';
    const numero = doc.numero_factura || doc.codigo;
    const simbolo = '$';
    const esUsd = doc.moneda_codigo && doc.moneda_codigo !== 'COP';
    const anulada = doc.estado === 0;
    const totalStr = esUsd
      ? 'US$' + fmt(doc.valor_moneda_extranjera)
      : simbolo + fmt(doc.total);
    const emailTercero = esc(tercero.email);

    const logoUrl = empresa?.logo
      ? (String(empresa.logo).startsWith('data:') || String(empresa.logo).startsWith('http')
          ? empresa.logo
          : `${API_SERVER_URL}${empresa.logo}`)
      : null;

    const detalles = doc.detalles || [];
    const filas = detalles.map((d: any) => {
      const precio = esVenta ? d.precio_unitario : d.costo_unitario;
      const base = Number(d.subtotal) || (Number(d.cantidad) * Number(precio));
      return `
        <tr>
          <td class="td-left">${esc(d.producto?.nombre || 'Producto #' + d.producto_id)}</td>
          <td>${simbolo}${fmt(precio)}</td>
          <td>${fmt(d.cantidad)}</td>
          <td>${fmt(d.descuento)}%</td>
          <td>${fmt(d.impuesto)}%</td>
          <td class="td-right">${simbolo}${fmt(base)}</td>
        </tr>`;
    }).join('');

    // Filas vacías de relleno para que la tabla ocupe la hoja carta
    const nFiller = Math.max(0, 10 - detalles.length);
    const fillers = Array.from({ length: nFiller })
      .map(() => '<tr class="filler"><td class="td-left"></td><td></td><td></td><td></td><td></td><td class="td-right"></td></tr>')
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(tituloDoc)} ${esc(numero)}</title>
<style>
  @page { size: letter; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { height: 100%; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 13px; }
  .doc { width: 100%; margin: 0 auto; position: relative;
    display: flex; flex-direction: column; min-height: 255mm; }
  .topbar { position: relative; background: #1f2430; color: #fff; padding: 26px 40px;
            display: flex; justify-content: space-between; align-items: center;
            overflow: hidden; border-bottom-right-radius: 60px; }
  .topbar::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 45%;
    background: repeating-linear-gradient(115deg, transparent 0 12px, rgba(255,255,255,.05) 12px 14px);
    clip-path: polygon(25% 0, 100% 0, 100% 100%, 0 100%); }
  .topbar .logo { display: flex; align-items: center; gap: 14px; z-index: 1; }
  .topbar .logo img { max-height: 60px; max-width: 150px; object-fit: contain; }
  .topbar .empresa-nombre { font-size: 18px; font-weight: 800; }
  .topbar .empresa-sub { font-size: 11px; color: #c7cbd6; margin-top: 2px; }
  .topbar h1 { font-size: 30px; font-weight: 800; letter-spacing: 6px; z-index: 1; }
  .body { padding: 28px 40px 0; flex: 1 1 auto; display: flex; flex-direction: column; }
  .to-row { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
  .to h2 { font-size: 16px; font-weight: 800; margin-bottom: 6px; }
  .to .name { font-weight: 700; font-size: 14px; }
  .to .sub { color: #6b7280; font-size: 12px; margin-top: 2px; }
  .total-due { text-align: right; min-width: 220px; }
  .total-due .pill { display: inline-block; background: #1f2430; color: #fff;
    padding: 6px 22px; border-radius: 20px; font-weight: 700; font-size: 13px; }
  .total-due .amount { font-size: 22px; font-weight: 800; margin: 8px 0 14px; }
  .total-due .meta { display: grid; grid-template-columns: auto auto; gap: 4px 18px; justify-content: end; }
  .total-due .meta .lbl { font-weight: 700; font-size: 11px; color: #6b7280; }
  .total-due .meta .val { font-size: 12px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 8px; }
  table.items thead { display: table-header-group; }
  table.items tr { page-break-inside: avoid; }
  table.items th { background: #eceef3; color: #374151; padding: 11px 10px; font-size: 11px;
    letter-spacing: .5px; text-align: center; text-transform: uppercase; font-weight: 700; }
  table.items th:first-child { text-align: left; }
  table.items th:last-child { text-align: right; }
  table.items td { padding: 11px 10px; text-align: center; border-bottom: 1px solid #eef0f4; }
  table.items td.td-left { text-align: left; }
  table.items td.td-right { text-align: right; }
  table.items tr.filler td { height: 34px; padding: 0 10px; border-bottom: 1px solid #f3f4f7; }
  .totales { margin-top: 14px; display: flex; justify-content: flex-end; }
  .totales table { min-width: 320px; border-collapse: collapse; }
  .totales td { padding: 5px 12px; font-size: 13px; }
  .totales td.val { text-align: right; }
  .totales tr.total td { background: #1f2430; color: #fff; font-size: 15px;
    font-weight: 800; padding: 10px 12px; }
  .usd { margin-top: 6px; text-align: right; color: #6b7280; font-size: 11px; }
  .obs { margin-top: 20px; padding: 12px; background: #f5f6f8; border-radius: 8px;
    font-size: 12px; color: #374151; }
  .pie { margin-top: auto; padding: 24px 0 20px; display: grid;
    grid-template-columns: 1fr 1fr 220px; gap: 24px; }
  .pie h2 { font-size: 13px; font-weight: 800; margin-bottom: 8px; }
  .pie .row-sub { font-size: 12px; color: #4b5563; margin-top: 2px; }
  .firma { align-self: end; }
  .firma .linea { border-top: 1.5px solid #111827; margin-top: 40px; padding-top: 6px;
    font-size: 11px; letter-spacing: 1px; text-align: center; text-transform: uppercase; }
  .bottombar { background: #1f2430; color: #fff; text-align: right; padding: 14px 40px;
    font-weight: 600; letter-spacing: .5px; border-top-left-radius: 60px; flex-shrink: 0; }
  .anulada { position: absolute; top: 45%; left: 50%; transform: translate(-50%,-50%) rotate(-25deg);
    font-size: 90px; font-weight: 900; color: rgba(200,0,0,.15); letter-spacing: 12px; }
  @media print { .doc { max-width: 100%; } }
</style>
</head>
<body>
<div class="doc">
${anulada ? '<div class="anulada">ANULADA</div>' : ''}
<div class="topbar">
  <div class="logo">
    ${logoUrl ? `<img src="${esc(logoUrl)}" alt="logo">` : ''}
    <div>
      <div class="empresa-nombre">${esc(empresa?.razon_social || empresa?.nombre || 'EMPRESA')}</div>
      <div class="empresa-sub">NIT: ${esc(empresa?.nit || '')}${empresa?.dv ? '-' + esc(empresa.dv) : ''}</div>
    </div>
  </div>
  <h1>${esc(tituloDoc)}</h1>
</div>

<div class="body">
  <div class="to-row">
    <div class="to">
      <h2>${esc(terceroTitulo)}</h2>
      <div class="name">${esc((tercero.nombre || '') + ' ' + (tercero.apellido || ''))}</div>
      ${tercero.documento ? `<div class="sub">${esVenta ? 'NIT/CC' : 'NIT'}: ${esc(tercero.documento)}${tercero.dv ? '-' + esc(tercero.dv) : ''}</div>` : ''}
      ${tercero.direccion ? `<div class="sub">${esc(tercero.direccion)}${tercero.ciudad ? ', ' + esc(tercero.ciudad) : ''}</div>` : ''}
      ${tercero.telefono ? `<div class="sub">Tel: ${esc(tercero.telefono)}</div>` : ''}
      ${emailTercero ? `<div class="sub">${emailTercero}</div>` : ''}
    </div>
    <div class="total-due">
      <div class="pill">${esVenta ? 'Total a pagar' : 'Total'}</div>
      <div class="amount">${totalStr}</div>
      <div class="meta">
        <span class="lbl">Fecha:</span><span class="val">${esc(doc.fecha ? new Date(doc.fecha).toLocaleDateString('es-CO') : '')}</span>
        <span class="lbl">Factura N°:</span><span class="val">${esc(numero)}</span>
        <span class="lbl">Pago:</span><span class="val">${doc.modo === 2 ? 'Crédito' : 'Contado'}</span>
      </div>
    </div>
  </div>

  <table class="items">
    <thead><tr>
      <th class="td-left">Descripción</th><th>${esVenta ? 'Precio' : 'Costo'}</th><th>Cantidad</th><th>Dcto.</th><th>IVA</th><th class="td-right">Total</th>
    </tr></thead>
    <tbody>${filas}${fillers}</tbody>
  </table>

  <div class="totales">
    <table>
      <tr><td>Sub-total</td><td class="val">${simbolo}${fmt(doc.base_grava)}</td></tr>
      ${Number(doc.descuento) ? `<tr><td>Descuento</td><td class="val">-${simbolo}${fmt(doc.descuento)}</td></tr>` : ''}
      <tr><td>IVA</td><td class="val">${simbolo}${fmt(doc.impuesto)}</td></tr>
      ${Number(doc.retencion) ? `<tr><td>Retención</td><td class="val">-${simbolo}${fmt(doc.retencion)}</td></tr>` : ''}
      ${Number(doc.flete) ? `<tr><td>Flete</td><td class="val">${simbolo}${fmt(doc.flete)}</td></tr>` : ''}
      <tr class="total"><td>Total ${esUsd ? esc(doc.moneda_codigo) : 'COP'}</td><td class="val">${totalStr}</td></tr>
    </table>
  </div>
  ${esUsd ? `<div class="usd">TRM: ${fmt(doc.tasa_cambio)} · Equivalente COP: $${fmt(doc.valor_cop || doc.total)}</div>` : ''}

  ${doc.observacion ? `<div class="obs"><strong>Observaciones:</strong> ${esc(doc.observacion)}</div>` : ''}

  <div class="pie">
    <div>
      <h2>Métodos de pago</h2>
      <div class="row-sub">Forma: ${doc.modo === 2 ? 'Crédito' : 'Contado'}</div>
      ${doc.concepto ? `<div class="row-sub">Concepto: ${esc(doc.concepto)}</div>` : ''}
    </div>
    <div>
      <h2>Contacto</h2>
      ${empresa?.telefono ? `<div class="row-sub">${esc(empresa.telefono)}</div>` : ''}
      ${empresa?.email ? `<div class="row-sub">${esc(empresa.email)}</div>` : ''}
      ${empresa?.direccion ? `<div class="row-sub">${esc(empresa.direccion)}</div>` : ''}
    </div>
    <div class="firma">
      <div class="linea">Firma autorizada</div>
    </div>
  </div>
</div>

<div class="bottombar">${esVenta ? 'Gracias por su compra' : 'Documento de compra'}</div>
</div>
</body>
</html>`;

    // Iframe oculto: imprime sin abrir una ventana/pestaña emergente.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 1000);
    };

    const idoc = iframe.contentWindow?.document;
    if (!idoc) {
      iframe.remove();
      return;
    }
    idoc.open();
    idoc.write(html);
    idoc.close();

    const doPrint = () => {
      const w = iframe.contentWindow;
      if (!w) return;
      w.focus();
      w.print();
      w.onafterprint = cleanup;
      // Respaldo por si onafterprint no dispara
      setTimeout(cleanup, 60000);
    };

    // Esperar a que carguen imágenes (logo) antes de imprimir
    const img = idoc.querySelector('img');
    if (img && !img.complete) {
      img.onload = () => setTimeout(doPrint, 100);
      img.onerror = () => setTimeout(doPrint, 100);
      setTimeout(doPrint, 1500); // respaldo
    } else {
      setTimeout(doPrint, 300);
    }
  }
}
