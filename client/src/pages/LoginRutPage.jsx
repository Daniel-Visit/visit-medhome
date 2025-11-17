import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginRutPage() {
  const [rut, setRut] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rut.trim()) {
      setMessage('Por favor ingresa tu RUT');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:4000/api/auth/request-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rut: rut.trim() })
      });

      const data = await response.json();

      if (data.ok) {
        localStorage.setItem('pendingRut', rut.trim());
        navigate('/login/verify');
      } else {
        setMessage(data.message || 'Error al solicitar el código');
      }
    } catch (error) {
      setMessage('Error de conexión. Verifica que el servidor esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const isError = message.includes('Error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-[430px] bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900">
          Iniciar sesión
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa tu RUT para recibir un código de acceso por correo
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              RUT
            </label>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="12345678-9"
              className="w-full px-3 py-3 rounded-lg border border-gray-200 text-sm outline-none bg-white text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`p-2.5 rounded-lg mb-4 text-xs ${
              isError 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg border-none text-sm font-semibold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg active:scale-[0.99] cursor-pointer'
            }`}
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginRutPage;

