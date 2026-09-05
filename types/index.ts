// types/index.ts

// ========== USUARIOS ==========
export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  email: string;
  contraseña: string;
  fecha_creacion: Date;
  estado: boolean;
  tipo: 'admin' | 'user';
}

export interface UsuarioSinPassword extends Omit<Usuario, 'contraseña'> {}

export interface SessionUser {
  id_usuario: number;
  nombre_usuario: string;
  email: string;
  tipo: 'admin' | 'user';
  estado: boolean;
  fecha_creacion: Date;
}

// ========== TIPOS (Categorías) ==========
export interface Tipo {
  id_tipo: number;
  nombre_tipo: string;
}

// ========== PRODUCTOS ==========
export interface Producto {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio: number;
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

// ========== FOTOS ==========
export interface Foto {
  id_foto: number;
  id_producto: number;
  foto: string;
}

// ========== REGISTROS ==========
export interface Registro {
  id_registro: number;
  id_usuario: number | null;
  id_producto: number;
  detalle_registro: string;
  fecha_registro: Date;
}

// ========== FORMULARIOS ==========
export interface LoginFormData {
  email: string;
  contraseña: string;
}

export interface RegisterFormData {
  nombre_usuario: string;
  email: string;
  contraseña: string;
}

export interface ProductoFormData {
  nombre_producto: string;
  cantidad: number;
  precio: number;
  id_tipo: number;
  detalles: string;
  fotos?: File[];
}