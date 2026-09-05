// lib/actions/auth.ts
'use server'

import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'
import { UsuarioSinPassword, SessionUser, RegisterFormData } from '@/types'

// ========== REGISTRO ==========
export async function registrarUsuarioAction(data: RegisterFormData): Promise<UsuarioSinPassword> {
  // Validar que el email no exista
  const { data: existente } = await supabase
    .from('usuarios')
    .select('email')
    .eq('email', data.email)
    .single() as any

  if (existente) {
    throw new Error('El email ya está registrado')
  }

  // Hashear contraseña
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(data.contraseña, salt)

  // Insertar usuario con estado INACTIVO (false)
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .insert({
      nombre_usuario: data.nombre_usuario,
      email: data.email,
      contraseña: hash,
      tipo: 'user',
      estado: false
    })
    .select('id_usuario, nombre_usuario, email, tipo, estado, fecha_creacion')
    .single() as any

  if (error) {
    throw new Error(error.message)
  }

  return usuario as UsuarioSinPassword
}

// ========== LOGIN ==========
export async function loginUsuarioAction(email: string, contraseña: string): Promise<UsuarioSinPassword> {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single() as any

  if (error || !usuario) {
    throw new Error('Email o contraseña incorrectos')
  }

  // Verificar si el usuario está ACTIVO
  if (!usuario.estado) {
    throw new Error('Usuario inactivo. Espera la aprobación del administrador.')
  }

  // Comparar contraseña
  const valid = await bcrypt.compare(contraseña, usuario.contraseña)
  if (!valid) {
    throw new Error('Email o contraseña incorrectos')
  }

  // Eliminar la contraseña del objeto retornado
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { contraseña: _, ...usuarioSinPassword } = usuario
  return usuarioSinPassword as UsuarioSinPassword
}

// ========== COOKIES ==========
export async function setSessionAction(usuario: UsuarioSinPassword): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set('usuario_id', usuario.id_usuario.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax'
  })

  cookieStore.set('usuario_nombre', usuario.nombre_usuario, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax'
  })

  cookieStore.set('usuario_tipo', usuario.tipo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax'
  })
}

export async function logoutUsuarioAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('usuario_id')
  cookieStore.delete('usuario_nombre')
  cookieStore.delete('usuario_tipo')
}

export async function getCurrentUserAction(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const usuarioId = cookieStore.get('usuario_id')?.value

  if (!usuarioId) return null

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre_usuario, email, tipo, estado, fecha_creacion')
    .eq('id_usuario', parseInt(usuarioId))
    .single() as any

  if (error || !usuario) return null

  return usuario as SessionUser
}