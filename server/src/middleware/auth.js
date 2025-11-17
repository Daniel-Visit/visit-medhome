import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: 'No autorizado. Por favor inicia sesión.'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      rut: decoded.rut,
      name: decoded.name
    };

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado.'
    });
  }
}

