// lib/actions/registros.ts
'use server'

import { supabase } from '@/lib/supabaseClient'
import { cookies } from 'next/headers'

export async function registrarMovimiento(
  id_producto: number,
  detalle: string
) {
  const cookieStore = await cookies()
  const usuarioId = cookieStore.get('usuario_id')?.value

  if (!usuarioId) {
    console.warn('No se pudo registrar movimiento: usuario no autenticado')
    return
  }

  const { error } = await supabase
    .from('registros')
    .insert({
      id_usuario: parseInt(usuarioId),
      id_producto: id_producto,
      detalle_registro: detalle
    }) as any // <-- CORRECCIÓN: as any para evitar error de tipos

  if (error) {
    console.error('Error registrando movimiento:', error)
  }
}