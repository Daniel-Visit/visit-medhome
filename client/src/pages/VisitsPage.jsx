import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VisitsApp from '../components/VisitsApp.jsx';

function VisitsPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchVisits();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.user) {
          setUserName(data.user.name);
        }
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error);
    }
  };

  const fetchVisits = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/visits/today', {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (data.ok) {
        setVisits(data.visits || []);
      } else {
        console.error('Error al obtener visitas:', data.message);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (visitId, lat, lng) => {
    try {
      const response = await fetch(`http://localhost:4000/api/visits/${visitId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ lat, lng })
      });

      const data = await response.json();

      if (data.ok) {
        // Actualizar el estado de la visita
        setVisits(prevVisits =>
          prevVisits.map(v =>
            v.id === visitId ? { ...v, status: 'DONE' } : v
          )
        );
      }

      return data;
    } catch (error) {
      console.error('Error en check-in:', error);
      return {
        ok: false,
        message: 'Error de conexión al registrar la asistencia.'
      };
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f4f5'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Cargando visitas...
        </div>
      </div>
    );
  }

  return <VisitsApp visits={visits} onConfirm={handleCheckin} userName={userName} />;
}

export default VisitsPage;

