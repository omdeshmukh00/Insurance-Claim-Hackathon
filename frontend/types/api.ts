export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface BackendStatusResponse {
  name: string;
  version: string;
  modules: string[];
}
