// lib/actions/perfil.ts
'use server'

import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'

export async function actualizarPerfil(
  id_usuario: number,
  nombre: string,
  email: string,
  contraseñaActual?: string,
  nuevaContraseña?: string
) {
  // 1. Validar datos
  if (!nombre.trim() || !email.trim()) {
    throw new Error('Nombre y email son requeridos')
  }

  // 2. Actualizar nombre y email
  const { error: updateError } = await supabase
    .from('usuarios')
    .update({
      nombre_usuario: nombre.trim(),
      email: email.trim()
    })
    .eq('id_usuario', id_usuario) as any // <-- SOLUCIÓN: as any

  if (updateError) throw new Error(updateError.message)

  // 3. Si se quiere cambiar la contraseña
  if (nuevaContraseña) {
    // Verificar la contraseña actual
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('contraseña')
      .eq('id_usuario', id_usuario)
      .single() as any // <-- SOLUCIÓN: as any

    if (!usuarioData) throw new Error('Usuario no encontrado')

    const isValid = await bcrypt.compare(contraseñaActual || '', usuarioData.contraseña)
    if (!isValid) {
      throw new Error('La contraseña actual es incorrecta')
    }

    if (nuevaContraseña.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(nuevaContraseña, salt)

    const { error: passError } = await supabase
      .from('usuarios')
      .update({ contraseña: hash })
      .eq('id_usuario', id_usuario) as any // <-- SOLUCIÓN: as any

    if (passError) throw new Error(passError.message)
  }

  return { success: true }
}