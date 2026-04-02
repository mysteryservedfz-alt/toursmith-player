import React from "react";
import "@/index.css";
import "@/App.css";
import "leaflet/dist/leaflet.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import L from "leaflet";
import Icons from "./components/Icons";
import { useAuth, AuthProvider } from "./components/authContext";
import AuthPage from "./components/AuthPages";
import ToursList from "./components/ToursList";
import TourEditor from "./components/editor/TourEditor";
import PlayerLayout from "./components/PlayerLayout";

// Remove "Made with Emergent" badge
(function removeBadge() {
  const kill = () => {
    document.querySelectorAll('#emergent-badge, [id*="emergent-badge"]').forEach(el => el.remove());
  };
  kill();
  document.addEventListener('DOMContentLoaded', kill);
  window.addEventListener('load', kill);
  setInterval(kill, 300);
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(kill).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ==================== PROTECTED ROUTE ====================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};

// ==================== APP ====================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/admin" element={<ProtectedRoute><ToursList /></ProtectedRoute>} />
          <Route path="/admin/tour/:tourId" element={<ProtectedRoute><TourEditor /></ProtectedRoute>} />
          <Route path="/play/:tourId" element={<PlayerLayout Icons={Icons} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
