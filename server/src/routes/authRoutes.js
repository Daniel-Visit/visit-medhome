import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requestLoginCode, verifyLoginCode } from '../services/authService.js';

const router = express.Router();

router.post('/request-code', async (req, res) => {
  try {
    const { rut } = req.body;

    if (!rut) {
      return res.status(400).json({
        ok: false,
        message: 'El RUT es requerido.'
      });
    }

    const result = await requestLoginCode(rut);
    res.json(result);
  } catch (error) {
    console.error('Error en /request-code:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al procesar la solicitud.'
    });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { rut, code } = req.body;

    if (!rut || !code) {
      return res.status(400).json({
        ok: false,
        message: 'El RUT y el código son requeridos.'
      });
    }

    const result = await verifyLoginCode(rut, code);

    if (result.ok && result.token) {
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error en /verify-code:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al verificar el código.'
    });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    ok: true,
    user: {
      id: req.user.id,
      rut: req.user.rut,
      name: req.user.name
    }
  });
});

export default router;

