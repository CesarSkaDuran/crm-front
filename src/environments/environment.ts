export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  apiServerUrl: 'http://localhost:3000',
  appName: 'Countable CRM',
  appVersion: '1.0.0',
  
  // Configuración de características
  features: {
    facturacionElectronica: false,
    reportesAvanzados: true,
    conciliacionesBancarias: true,
    auditoriaDetallada: true,
    fotosUsuario: true,
  },

  // Límites
  limits: {
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    maxImageSize: 5 * 1024 * 1024, // 5 MB
    pageSize: 10,
    maxRecords: 1000,
  },

  // Timeouts
  timeouts: {
    apiTimeout: 30000, // 30 segundos
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
  },
};
