// User roles
export type UserRole = 'admin' | 'field_user';

// Prospect status
export type ProspectStatus = 'active' | 'passive' | 'visited';

// Visit result
export type VisitResult = 'positive' | 'neutral' | 'negative';

// Visit status
export type VisitStatus = 'started' | 'completed' | 'cancelled';

// Route plan status
export type RoutePlanStatus = 'draft' | 'active' | 'completed';

// Route plan item status
export type RoutePlanItemStatus = 'pending' | 'visited' | 'skipped';

// Import batch status
export type ImportBatchStatus = 'processing' | 'completed' | 'failed';

// Email dispatch status
export type EmailDispatchStatus = 'sent' | 'failed' | 'retrying';

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// User DTO
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

// Prospect DTO
export interface ProspectDto {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  latitude: number;
  longitude: number;
  sector?: string;
  notes?: string;
  status: ProspectStatus;
  createdAt: string;
}

// Visit DTO
export interface VisitDto {
  id: string;
  userId: string;
  prospectId: string;
  startTime: string;
  endTime?: string;
  result?: VisitResult;
  resultNotes?: string;
  status: VisitStatus;
  durationMinutes?: number;
}

// Login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}
