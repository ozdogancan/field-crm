// GPS tolerance in meters
export const GPS_TOLERANCE_METERS = 200;

// Email summary time (24h format)
export const EMAIL_SUMMARY_HOUR = 18;
export const EMAIL_SUMMARY_MINUTE = 0;

// Max retry for email
export const EMAIL_MAX_RETRY = 3;
export const EMAIL_RETRY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Excel import
export const MAX_IMPORT_ROWS = 1000;

// Auth
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

// Visit result labels (Turkish)
export const VISIT_RESULT_LABELS = {
  positive: 'Çalışmaya Yatkın',
  neutral: 'Nötr',
  negative: 'Çalışmaya Yatkın Değil',
} as const;
