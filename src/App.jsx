import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BuildingReportForm from './components/BuildingReportForm';
import RoadReportForm from './components/RoadReportForm';
import InteractiveMap from './components/InteractiveMap';
import AfadDashboard from './components/AfadDashboard';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Simulate connection status changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleSubmit = (data) => {
    console.log('Sending data via LoRa Mesh:', data);
    // Verileri AFAD ekranında görebilmek için LocalStorage'a (canlı hafıza) ekliyoruz
    try {
      const existing = JSON.parse(localStorage.getItem('form_reports') || '[]');
      existing.push({ ...data, timestamp: new Date().toISOString() });
      localStorage.setItem('form_reports', JSON.stringify(existing));
      
      // Çoklu ekranlarda anında tetiklenmesi için özel bir storage event'i fırlatabiliriz
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error("Local storage error", e);
    }
  };

  return (
    <>
      {currentView !== 'afad' && <Header connectionStatus={connectionStatus} />}
      
      <main style={{ height: currentView === 'afad' ? '100vh' : undefined }}>
        {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {(currentView === 'building' || currentView === 'road' || currentView === 'medical' || currentView === 'supply' || currentView === 'supply_view' || currentView === 'mesh_view') && 
          <InteractiveMap onBack={handleBackToDashboard} mode={currentView} />
        }
        {currentView === 'afad' && <AfadDashboard onBack={handleBackToDashboard} onShowMap={() => handleNavigate('road')} onShowMesh={() => handleNavigate('mesh_view')} />}
      </main>
    </>
  );
}

export default App;
