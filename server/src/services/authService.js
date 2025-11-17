import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/connection.js';
import { config } from '../config/env.js';
import { sendLoginCodeEmail } from './emailService.js';

export function normalizeRut(rut) {
  if (!rut) return '';
  return rut
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/\s/g, '')
    .toUpperCase();
}

export function formatRut(rut) {
  const normalized = normalizeRut(rut);
  if (normalized.length < 2) return normalized;
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  return `${body}-${dv}`;
}

export function generateLoginCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestLoginCode(rut) {
  const normalizedRut = normalizeRut(rut);
  const formattedRut = formatRut(normalizedRut);
  const pool = getPool();

  try {
    const [users] = await pool.execute(
      'SELECT id, rut, name, email FROM users WHERE rut = ? AND is_active = 1',
      [normalizedRut]
    );

    // Siempre devolver mensaje neutro
    if (users.length === 0) {
      return {
        ok: true,
        message: 'Si el RUT está registrado, se ha enviado un código a su correo.'
      };
    }

    const user = users[0];
    const code = generateLoginCode();
    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.LOGIN_CODE_EXP_MINUTES);

    await pool.execute(
      'INSERT INTO login_codes (user_id, code_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, codeHash, expiresAt]
    );

    await sendLoginCodeEmail(user.email, code);

    return {
      ok: true,
      message: 'Si el RUT está registrado, se ha enviado un código a su correo.'
    };
  } catch (error) {
    console.error('Error en requestLoginCode:', error);
    return {
      ok: true,
      message: 'Si el RUT está registrado, se ha enviado un código a su correo.'
    };
  }
}

export async function verifyLoginCode(rut, code) {
  const normalizedRut = normalizeRut(rut);
  const pool = getPool();

  try {
    const [users] = await pool.execute(
      'SELECT id, rut, name, email FROM users WHERE rut = ? AND is_active = 1',
      [normalizedRut]
    );

    if (users.length === 0) {
      return {
        ok: false,
        message: 'Código inválido o expirado.'
      };
    }

    const user = users[0];

    const [codes] = await pool.execute(
      `SELECT id, code_hash FROM login_codes 
       WHERE user_id = ? AND used = 0 AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );

    if (codes.length === 0) {
      return {
        ok: false,
        message: 'Código inválido o expirado.'
      };
    }

    const loginCode = codes[0];
    const isValid = await bcrypt.compare(code, loginCode.code_hash);

    if (!isValid) {
      return {
        ok: false,
        message: 'Código inválido o expirado.'
      };
    }

    // Marcar código como usado
    await pool.execute(
      'UPDATE login_codes SET used = 1, used_at = NOW() WHERE id = ?',
      [loginCode.id]
    );

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, rut: user.rut, name: user.name },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      ok: true,
      user: {
        id: user.id,
        rut: formatRut(user.rut),
        name: user.name
      },
      token
    };
  } catch (error) {
    console.error('Error en verifyLoginCode:', error);
    return {
      ok: false,
      message: 'Error al verificar el código.'
    };
  }
}

