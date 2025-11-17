import { useState } from 'react';
import '../styles/visits.css';

function VisitsApp({ visits, onConfirm, userName }) {
  const [openItems, setOpenItems] = useState(new Set());
  const [checkinStatus, setCheckinStatus] = useState({});

  const toggleItem = (visitId) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(visitId)) {
      newOpen.delete(visitId);
    } else {
      // Cerrar todos los demás
      newOpen.clear();
      newOpen.add(visitId);
    }
    setOpenItems(newOpen);
  };

  const handleCheckin = async (visit) => {
    if (!navigator.geolocation) {
      setCheckinStatus({
        [visit.id]: {
          ok: false,
          message: 'Tu navegador no soporta geolocalización.'
        }
      });
      return;
    }

    setCheckinStatus({
      [visit.id]: { loading: true }
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await onConfirm(visit.id, latitude, longitude);
        setCheckinStatus({
          [visit.id]: result
        });
      },
      (error) => {
        setCheckinStatus({
          [visit.id]: {
            ok: false,
            message: 'No se pudo obtener tu ubicación. Por favor, permite el acceso a la geolocalización.'
          }
        });
      }
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En progreso',
      'DONE': 'Completada'
    };
    return statusMap[status] || status;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const today = visits.length > 0 ? formatDate(visits[0].scheduled_start) : '';

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="header-title">Visitas domiciliarias</div>
          <div className="header-subtitle">
            {today} · {visits.length} {visits.length === 1 ? 'visita agendada' : 'visitas agendadas'}
          </div>
        </div>
        {userName && (
          <div className="user-pill">
            <span className="user-pill-dot"></span>
            <span>{userName}</span>
          </div>
        )}
      </header>

      <section className="accordion">
        {visits.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            No hay visitas agendadas para hoy
          </div>
        ) : (
          visits.map((visit) => {
            const isOpen = openItems.has(visit.id);
            const status = checkinStatus[visit.id];
            const isDone = visit.status === 'DONE';

            return (
              <article key={visit.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
                <div className="accordion-header" onClick={() => toggleItem(visit.id)}>
                  <div className="accordion-heading">
                    <div className="accordion-name">{visit.patient_name}</div>
                    <div className="accordion-address">{visit.address}</div>
                  </div>
                  <div className="accordion-meta">
                    <div className="accordion-time">
                      {formatTime(visit.scheduled_start)} – {formatTime(visit.scheduled_end)}
                    </div>
                    <div className={`status-chip ${isDone ? 'done' : ''}`}>
                      {getStatusText(visit.status)}
                    </div>
                  </div>
                  <div className="accordion-arrow">&gt;</div>
                </div>
                <div className="accordion-body">
                  <div className="patient-card">
                    <div className="patient-avatar">{getInitials(visit.patient_name)}</div>
                    <div className="patient-info">
                      <div className="patient-name-row">
                        <div className="patient-name">{visit.patient_name}</div>
                        <div className="tag-chip">Visita domiciliaria</div>
                      </div>
                      <div className="patient-address">{visit.address}</div>
                      <div className="patient-meta">
                        Rango permitido de registro: desde 10 minutos antes hasta 20 minutos después del inicio.
                      </div>
                    </div>
                  </div>

                  <div className="map-card">
                    <div className="map-header">
                      <div className="map-header-left">
                        <div className="map-title">Validación de ubicación</div>
                        <div className="map-legend">
                          <div className="legend-item">
                            <span className="dot dot-patient"></span>
                            <span>Dirección del paciente</span>
                          </div>
                          <div className="legend-item">
                            <span className="dot dot-user"></span>
                            <span>Tu posición estimada</span>
                          </div>
                        </div>
                      </div>
                      <div className="radius-badge">Radio 150 m</div>
                    </div>

                    <div className="map-container">
                      <div className="map-gradient"></div>
                      <div className="map-radius-circle"></div>

                      <div className="map-pin-patient">
                        <div className="pin-dot"></div>
                        <div>Paciente</div>
                      </div>

                      <div className="map-pin-user">
                        <div className="pin-dot"></div>
                        <div>Tú</div>
                      </div>

                      <div className="map-distance-pill">
                        {status?.distanceMeters !== undefined
                          ? `Distancia estimada: ${status.distanceMeters} m`
                          : 'Distancia estimada: -- m'}
                      </div>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon">i</div>
                    <div>
                      Al confirmar la asistencia, la aplicación validará tu ubicación actual y el horario respecto
                      a la visita agendada. Si estás fuera del radio permitido o del rango horario, se mostrará una alerta.
                    </div>
                  </div>

                  <button
                    className="main-button"
                    onClick={() => handleCheckin(visit)}
                    disabled={status?.loading || isDone}
                  >
                    <span className="main-button-label">
                      {status?.loading
                        ? 'Registrando...'
                        : isDone
                        ? 'Asistencia ya registrada'
                        : 'Confirmar asistencia a esta visita'}
                    </span>
                  </button>

                  {status && !status.loading && (
                    <div className={`status-message ${status.ok ? '' : status.isValidTime === false || status.isValidRadius === false ? 'warning' : 'error'}`}>
                      {status.message}
                      {status.distanceMeters !== undefined && (
                        <div style={{ marginTop: '4px', fontSize: '10px' }}>
                          Distancia: {status.distanceMeters}m · 
                          Tiempo: {status.isValidTime ? '✓' : '✗'} · 
                          Radio: {status.isValidRadius ? '✓' : '✗'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

export default VisitsApp;

