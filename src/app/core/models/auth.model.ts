export interface LoginRequest {
  codigo_empresa: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  usuario: {
    id: number;
    empresa_id: number;
    codigo_empresa: string;
    nombre_empresa: string;
    nombre: string;
    email: string;
    rol: string;
  };
}
