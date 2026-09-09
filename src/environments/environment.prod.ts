export const environment = {
  production: true,
  apiUrl: 'https://api.countable.com/api/v1',
  apiServerUrl: 'https://api.countable.com',
  appName: 'Countable CRM',
  appVersion: '1.0.0',
  
  // Configuración de características
  features: {
    facturacionElectronica: true,
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
