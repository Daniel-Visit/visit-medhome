import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginCodePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rut, setRut] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const pendingRut = localStorage.getItem('pendingRut');
    if (!pendingRut) {
      navigate('/login');
      return;
    }
    setRut(pendingRut);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setMessage('Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:4000/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ rut, code: code.trim() })
      });

      const data = await response.json();

      if (data.ok) {
        localStorage.removeItem('pendingRut');
        navigate('/visits');
      } else {
        setMessage(data.message || 'Código inválido');
      }
    } catch (error) {
      setMessage('Error de conexión. Verifica que el servidor esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const isError = message.includes('inválido') || message.includes('Error');
  const isDisabled = loading || code.length !== 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-[430px] bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900">
          Verificar código
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa el código que recibiste en tu correo
        </p>

        <div className="mb-4 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600">
          RUT: <strong className="font-semibold">{rut}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Código de acceso
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              placeholder="123456"
              maxLength="6"
              className="w-full px-3 py-3 rounded-lg border border-gray-200 text-lg text-center tracking-widest outline-none bg-white text-gray-900 font-mono focus:border-primary focus:ring-1 focus:ring-primary"
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
            disabled={isDisabled}
            className={`w-full py-3 rounded-lg border-none text-sm font-semibold text-white transition-all ${
              isDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg active:scale-[0.99] cursor-pointer'
            }`}
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginCodePage;

