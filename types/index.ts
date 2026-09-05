// types/index.ts

// ========== PRODUCTOS ==========
export interface Producto {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio: number;  // ← Campo agregado
  id_tipo: number;
  detalles: string;
  fecha_creacion: Date;
  ultima_modificacion: Date;
  estado: boolean;
}

export interface ProductoConRelaciones extends Producto {
  tipos?: Tipo;
  fotos?: Foto[];
}

// ========== FORMULARIOS ==========
export interface ProductoFormData {
  nombre_producto: string;
  cantidad: number;
  precio: number;  // ← Campo agregado
  id_tipo: number;
  detalles: string;
  fotos?: File[];
}