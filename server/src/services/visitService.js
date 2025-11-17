import { getPool } from '../db/connection.js';
import { distanceInMeters } from '../utils/haversine.js';
import { config } from '../config/env.js';

export async function getTodayVisits(professionalId) {
  const pool = getPool();
  
  try {
    const [visits] = await pool.execute(
      `SELECT * FROM visits 
       WHERE professional_id = ? 
       AND DATE(scheduled_start) = CURDATE()
       ORDER BY scheduled_start`,
      [professionalId]
    );

    return {
      ok: true,
      visits: visits || []
    };
  } catch (error) {
    console.error('Error en getTodayVisits:', error);
    return {
      ok: false,
      visits: [],
      message: 'Error al obtener las visitas.'
    };
  }
}

export async function checkinVisit(visitId, professionalId, lat, lng) {
  const pool = getPool();

  try {
    // Buscar la visita
    const [visits] = await pool.execute(
      'SELECT * FROM visits WHERE id = ? AND professional_id = ?',
      [visitId, professionalId]
    );

    if (visits.length === 0) {
      return {
        ok: false,
        message: 'Visita no encontrada.'
      };
    }

    const visit = visits[0];
    const now = new Date();
    const scheduledStart = new Date(visit.scheduled_start);

    // Calcular ventana horaria
    const startAllowed = new Date(scheduledStart);
    startAllowed.setMinutes(startAllowed.getMinutes() - config.CHECKIN_MINUTES_BEFORE_START);

    const endAllowed = new Date(scheduledStart);
    endAllowed.setMinutes(endAllowed.getMinutes() + config.CHECKIN_MINUTES_AFTER_START);

    const isValidTime = now >= startAllowed && now <= endAllowed;

    // Calcular distancia
    const distance = Math.round(distanceInMeters(
      Number(visit.lat),
      Number(visit.lng),
      lat,
      lng
    ));

    const isValidRadius = distance <= config.CHECKIN_RADIUS_METERS;

    // Insertar check-in
    await pool.execute(
      `INSERT INTO visit_checkins 
       (visit_id, professional_id, checkin_time, lat, lng, distance_m, is_valid_time, is_valid_radius)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitId,
        professionalId,
        now,
        lat,
        lng,
        distance,
        isValidTime ? 1 : 0,
        isValidRadius ? 1 : 0
      ]
    );

    // Si ambos son válidos, actualizar status de la visita
    if (isValidTime && isValidRadius) {
      await pool.execute(
        'UPDATE visits SET status = ? WHERE id = ?',
        ['DONE', visitId]
      );
    }

    let message = '';
    if (isValidTime && isValidRadius) {
      message = 'Asistencia registrada correctamente.';
    } else if (!isValidTime && isValidRadius) {
      message = 'La asistencia no puede registrarse: fuera del horario permitido.';
    } else if (isValidTime && !isValidRadius) {
      message = `La asistencia no puede registrarse: estás a ${distance}m, fuera del radio permitido (${config.CHECKIN_RADIUS_METERS}m).`;
    } else {
      message = 'La asistencia no puede registrarse: fuera del horario y del radio permitido.';
    }

    return {
      ok: isValidTime && isValidRadius,
      isValidTime,
      isValidRadius,
      distanceMeters: distance,
      message
    };
  } catch (error) {
    console.error('Error en checkinVisit:', error);
    return {
      ok: false,
      message: 'Error al registrar la asistencia.'
    };
  }
}

