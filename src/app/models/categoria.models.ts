export interface Categoria {
  id: number;
  empresa_id: number;
  nombre: string;
  descripcion: string | null;
  tipo: number; // 1 producto, 2 servicio
  padre_id: number | null;
  padre?: Categoria | null;
  hijos?: Categoria[];
  estado: number;
  total_productos?: number;
  total_productos_acum?: number;
  nombre_padre?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaTreeNode extends Categoria {
  hijos: CategoriaTreeNode[];
  total_productos: number;
  total_productos_acum: number;
}

export interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
  tipo: number;
  padre_id?: number | null;
}

export interface UpdateCategoriaDto extends Partial<CreateCategoriaDto> {}
