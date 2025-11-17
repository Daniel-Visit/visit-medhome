import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getTodayVisits, checkinVisit } from '../services/visitService.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/today', async (req, res) => {
  try {
    const result = await getTodayVisits(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error en /today:', error);
    res.status(500).json({
      ok: false,
      visits: [],
      message: 'Error al obtener las visitas.'
    });
  }
});

router.post('/:id/checkin', async (req, res) => {
  try {
    const visitId = parseInt(req.params.id, 10);
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        ok: false,
        message: 'Las coordenadas (lat, lng) son requeridas.'
      });
    }

    if (isNaN(visitId)) {
      return res.status(400).json({
        ok: false,
        message: 'ID de visita inválido.'
      });
    }

    const result = await checkinVisit(
      visitId,
      req.user.id,
      parseFloat(lat),
      parseFloat(lng)
    );

    res.json(result);
  } catch (error) {
    console.error('Error en /checkin:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al registrar la asistencia.'
    });
  }
});

export default router;

