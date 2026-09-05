// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase' // Lo crearemos después

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase')
}

// Creamos el cliente con tipado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)