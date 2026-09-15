// lib/actions/perfil.ts
'use server'

import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcrypt'
import { registrarMovimiento } from './registros'

export async function actualizarPerfil(
  id_usuario: number,
  nombre: string,
  email: string,
  telefono: string | null,
  contraseñaActual?: string,
  nuevaContraseña?: string
) {
  // 1. Validar datos básicos
  if (!nombre.trim() || !email.trim()) {
    throw new Error('Nombre y email son requeridos')
  }

  // 2. Validar que el email no esté en uso por otro usuario
  const { data: existente } = await supabase
    .from('usuarios')
    .select('id_usuario')
    .eq('email', email.trim())
    .neq('id_usuario', id_usuario)
    .single() as any

  if (existente) {
    throw new Error('El email ya está registrado por otro usuario')
  }

  // 3. Actualizar nombre, email y teléfono
  const { error: updateError } = await supabase
    .from('usuarios')
    .update({
      nombre_usuario: nombre.trim(),
      email: email.trim(),
      telefono: telefono?.trim() || null
    })
    .eq('id_usuario', id_usuario) as any

  if (updateError) throw new Error(updateError.message)

  // 4. Si se quiere cambiar la contraseña
  if (nuevaContraseña) {
    // Verificar que se haya ingresado la contraseña actual
    if (!contraseñaActual) {
      throw new Error('Debes ingresar tu contraseña actual para cambiarla')
    }

    // Obtener la contraseña hasheada actual
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('contraseña')
      .eq('id_usuario', id_usuario)
      .single() as any

    if (!usuarioData) throw new Error('Usuario no encontrado')

    // Verificar la contraseña actual
    const isValid = await bcrypt.compare(contraseñaActual, usuarioData.contraseña)
    if (!isValid) {
      throw new Error('La contraseña actual es incorrecta')
    }

    // Validar longitud mínima
    if (nuevaContraseña.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(nuevaContraseña, salt)

    const { error: passError } = await supabase
      .from('usuarios')
      .update({ contraseña: hash })
      .eq('id_usuario', id_usuario) as any

    if (passError) throw new Error(passError.message)
  }

  // 5. Registrar movimiento en la tabla registros
  try {
    await registrarMovimiento(
      0, // id_producto = 0 porque no aplica a un producto específico
      `Usuario "${nombre}" actualizó su perfil${telefono ? ` (tel: ${telefono})` : ''}${nuevaContraseña ? ' y cambió su contraseña' : ''}`
    )
  } catch (error) {
    // No bloqueamos la actualización si el registro falla
    console.warn('No se pudo registrar el movimiento de perfil:', error)
  }

  return { success: true }
}