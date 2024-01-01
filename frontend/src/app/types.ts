
export interface AuthError {
  errorMessage: string
  code: number
}

export interface HttpResponse {
  message: string
  code: number
}
export interface PlantLog {
  ID: number;
  log: string;
  CreatedAt: string;
}

