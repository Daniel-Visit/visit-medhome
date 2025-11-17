import { Routes, Route, Navigate } from 'react-router-dom';
import LoginRutPage from '../pages/LoginRutPage.jsx';
import LoginCodePage from '../pages/LoginCodePage.jsx';
import VisitsPage from '../pages/VisitsPage.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRutPage />} />
      <Route path="/login/verify" element={<LoginCodePage />} />
      <Route path="/visits" element={<VisitsPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;

