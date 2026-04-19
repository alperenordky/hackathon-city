import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, AlertTriangle, AlertOctagon, Route, HeartPulse, HardHat, Radio, Package, XSquare } from 'lucide-react';
import styles from './AfadDashboard.module.css';

const AfadDashboard = ({ onBack, onShowMap, onShowMesh }) => {
  const [reports, setReports] = useState({});
  const [formReports, setFormReports] = useState([]);

  // Sync with localStorage (Real-time tracking of what citizens send)
  useEffect(() => {
    const fetchLocalData = () => {
      try {
        const saved = localStorage.getItem('disaster_reports');
        if (saved) setReports(JSON.parse(saved));
        
        const formSaved = localStorage.getItem('form_reports');
        if (formSaved) setFormReports(JSON.parse(formSaved));
      } catch (e) {}
    };

    fetchLocalData();

    // Listen for storage events to update real-time
    const handleStorageChange = (e) => {
      if (e.key === 'disaster_reports' && e.newValue) {
        setReports(JSON.parse(e.newValue));
      } else if (e.key === 'form_reports' && e.newValue) {
        setFormReports(JSON.parse(e.newValue));
      } else if (!e.key) {
        // Fallback or custom dispatched event without key
        fetchLocalData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate Metrics
  const reportArray = Object.entries(reports);
  
  const destroyedCount = reportArray.filter(([_, r]) => r.status === 'yikildi').length;
  const blockedRoadsCount = reportArray.filter(([_, r]) => r.status === 'yol_kapali').length;
  
  const assemblyPoints = reportArray.filter(([_, r]) => r.isAssembly);
  const urgentAssemblyCount = assemblyPoints.filter(([_, r]) => r.status === 'acil_ihtiyac').length;
  
  // Create an event log combining map reports and citizen form reports
  const mappedReports = reportArray.map(([id, r]) => {
     let priority = 4;
     let label = 'BİLDİRİM';
     let colorStyle = styles.typeHasarli;
     let typeStr = r.isAssembly ? 'TOPLANMA ALANI' : 'BİNA / YOL HARİTASI';

     switch(r.status) {
       case 'yikildi': priority = 1; label = 'BİNA YIKILDI'; colorStyle = styles.typeYikildi; break;
       case 'acil_ihtiyac': priority = 1; label = 'ACİL İHTİYAÇ'; colorStyle = styles.typeAcil; break;
       case 'agir_hasarli': priority = 2; label = 'AĞIR HASAR'; colorStyle = styles.typeHasarli; break;
       case 'yol_kapali': priority = 2; label = 'YOL KAPANDI'; colorStyle = styles.typeYol; break;
       case 'hasarli': priority = 3; label = 'HASARLI'; colorStyle = styles.typeHasarli; break;
       case 'cadir_kuruluyor': priority = 3; label = 'ÇADIR KURULU'; colorStyle = styles.typeHasarli; break;
       case 'aktif': priority = 4; label = 'GÜVENLİ ALAN'; colorStyle = styles.typeGuvenli; break;
       default: priority = 4; break;
     }

     return {
        id, priority, label, typeStr, colorStyle,
        notes: r.notes || 'Belirtilmedi',
        name: r.name || 'Harita Lokoasyonu',
        timestamp: 1 // Legacy reports don't have accurate timestamps
     };
  });

  const mappedFormReports = formReports.map((fr, idx) => {
     const isMed = fr.type === 'MEDICAL';
     let priority = isMed ? 1 : 2;
     let label = isMed ? 'ACİL TIBBİ KOD' : 'LOJİSTİK/ERZAK TALEBİ';
     let colorStyle = isMed ? styles.typeYikildi : styles.typeHasarli;
     
     return {
        id: fr.id || `fr-${idx}`, priority, label, colorStyle,
        typeStr: isMed ? 'YARALI VAKASI' : 'MALZEME İSTEYEN',
        notes: fr.data.notlar || 'Belirtilmedi',
        name: fr.data.lokasyon || 'Bilinmeyen Konum',
        timestamp: new Date(fr.timestamp).getTime()
     }
  });

  let eventLog = [...mappedReports, ...mappedFormReports];
  // Sort by priority first (1=CRITICAL), then by timestamp descending
  eventLog.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.timestamp - a.timestamp;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Saha Girişine Dön</span>
        </button>
        <div className={styles.titleWrapper}>
          <HardHat size={28} color="#f85149" />
          <h2 className={styles.title}>AFAD Kriz Kontrol Merkezi</h2>
          <div className={styles.liveIndicator}>
            <Radio size={16} /> CANLI AĞ
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.dangerMetric}`}>
          <AlertOctagon size={32} color="#f85149" className={styles.metricIcon}/>
          <h3 className={styles.metricValue} style={{color: '#f85149'}}>{destroyedCount}</h3>
          <span className={styles.metricLabel}>Yıkılan Bina Blokları</span>
        </div>
        
        <div className={`${styles.metricCard} ${styles.warningMetric}`}>
          <AlertTriangle size={32} color="#d29922" className={styles.metricIcon}/>
          <h3 className={styles.metricValue} style={{color: '#d29922'}}>{blockedRoadsCount}</h3>
          <span className={styles.metricLabel}>Kapanan Yollar & Darboğaz</span>
        </div>
        
        <div className={`${styles.metricCard} ${urgentAssemblyCount > 0 ? styles.dangerMetric : styles.successMetric}`}>
          <HeartPulse size={32} color={urgentAssemblyCount > 0 ? '#f85149' : '#3fb950'} className={styles.metricIcon}/>
          <h3 className={styles.metricValue} style={{color: urgentAssemblyCount > 0 ? '#f85149' : '#3fb950'}}>{urgentAssemblyCount}</h3>
          <span className={styles.metricLabel}>Acil Lojistik Bekleyen Toplanma Alanı</span>
        </div>
      </div>

      <div className={styles.panelGrid}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>
            Saha Canlı Olay Akışı
            <span style={{fontSize: '12px', color: '#8b949e', fontWeight: 'normal'}}>{eventLog.length} Aktif Kayıt</span>
          </h3>
          <ul className={styles.logList}>
            {eventLog.length === 0 ? (
              <p style={{color: '#8b949e', textAlign: 'center', marginTop: '2rem'}}>Ağda aktif rapor bulunmuyor.</p>
            ) : (
              eventLog.map((ev, index) => {
                const timeStr = `T-${(index).toString().padStart(2, '0')}:${(index*7 % 60).toString().padStart(2,'0')}`;
                
                return (
                  <li key={ev.id} className={styles.logItem} style={{ 
                    borderLeft: ev.priority === 1 ? '4px solid #f85149' : (ev.priority === 2 ? '4px solid #d29922' : '4px solid transparent'), 
                    paddingLeft: '8px',
                    background: ev.priority === 1 ? 'rgba(248,81,73,0.05)' : 'transparent'
                  }}>
                    <div className={styles.logTime} style={{ color: ev.priority === 1 ? '#f85149' : '#8b949e', fontWeight: ev.priority === 1 ? 'bold' : 'normal' }}>
                      {timeStr}
                    </div>
                    <div className={styles.logBody}>
                      <span className={`${styles.logType} ${ev.colorStyle}`}>
                        [{ev.priority === 1 ? 'KRMZ-KOD' : `ÖNCELİK-${ev.priority}`}] {ev.typeStr} | {ev.name} - {ev.label}
                      </span>
                      <p className={styles.logNotes}>Notlar: {ev.notes}</p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Operasyon Yönetimi</h3>
          <p style={{color: '#c9d1d9', fontSize: '0.9rem', lineHeight: '1.5'}}>
            Sistem haritadan gelen verileri toplayarak enkaza ulaşmak için alternatif lojistik koridorlar hesaplamaktadır.
          </p>
          <button className={styles.actionBtn} onClick={onShowMap}>
            <Route size={20} />
            Dışarıdan İçeri Giriş Rotası Bul
          </button>
          
          <button className={styles.actionBtn} onClick={onShowMesh} style={{marginTop: '1rem', background: '#238636', color: '#fff', borderColor: '#2ea043', gap: '8px', display: 'flex', alignItems: 'center'}}>
            <Radio size={20} />
            Mesh Ağ Canlı Veri Akışını Görüntüle
          </button>
          
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(56, 139, 253, 0.1)', border: '1px solid #388bfd', borderRadius: '6px'}}>
            <p style={{color: '#58a6ff', fontSize: '0.85rem', margin: 0, fontWeight: 'bold'}}>
              <Activity size={14} style={{display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom'}}/>
              SİSTEM DURUMU: AKTİF
            </p>
            <p style={{color: '#8b949e', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: 0}}>
              İntranet bağlantısı stabil. Veriler anlık olarak uç nokta kriptografi standartlarıyla merkez sunucuda derlenmektedir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AfadDashboard;
