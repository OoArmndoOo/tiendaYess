// types/supabase.ts
export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id_usuario: number;
          nombre_usuario: string;
          email: string;
          contraseña: string;
          fecha_creacion: string;
          estado: boolean;
          tipo: 'admin' | 'user';
        };
        Insert: {
          nombre_usuario: string;
          email: string;
          contraseña: string;
          tipo?: 'admin' | 'user';
          estado?: boolean;
        };
        Update: {
          nombre_usuario?: string;
          email?: string;
          contraseña?: string;
          estado?: boolean;
          tipo?: 'admin' | 'user';
        };
      };
      tipos: {
        Row: {
          id_tipo: number;
          nombre_tipo: string;
        };
        Insert: {
          nombre_tipo: string;
        };
        Update: {
          nombre_tipo?: string;
        };
      };
      productos: {
        Row: {
          id_producto: number;
          nombre_producto: string;
          cantidad: number;
          precio: number;
          id_tipo: number;
          detalles: string;
          fecha_creacion: string;
          ultima_modificacion: string;
          estado: boolean;
        };
        Insert: {
          nombre_producto: string;
          cantidad: number;
          precio: number;
          id_tipo: number;
          detalles: string;
          estado?: boolean;
        };
        Update: {
          nombre_producto?: string;
          cantidad?: number;
          precio?: number;
          id_tipo?: number;
          detalles?: string;
          estado?: boolean;
        };
      };
      fotos: {
        Row: {
          id_foto: number;
          id_producto: number;
          foto: string;
        };
        Insert: {
          id_producto: number;
          foto: string;
        };
        Update: {
          id_producto?: number;
          foto?: string;
        };
      };
      registros: {
        Row: {
          id_registro: number;
          id_usuario: number | null;
          id_producto: number;
          detalle_registro: string;
          fecha_registro: string;
        };
        Insert: {
          id_usuario?: number | null;
          id_producto: number;
          detalle_registro: string;
        };
        Update: {
          id_usuario?: number | null;
          id_producto?: number;
          detalle_registro?: string;
        };
      };
    };
    Storage: {
      productos: {
        name: string;
        bucket_id: string;
        owner: string;
        size: number;
        created_at: string;
        updated_at: string;
        last_accessed_at: string;
      };
    };
  };
};