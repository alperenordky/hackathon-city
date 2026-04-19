import React, { useState, useEffect } from 'react';
import { Building2, Navigation, HeartPulse, Package, ShieldAlert, ClipboardList, XSquare, BookOpen, AlertCircle } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = ({ onNavigate }) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [formReports, setFormReports] = useState([]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginId === '111' && loginPass === '111') {
      setShowLoginModal(false);
      setLoginId('');
      setLoginPass('');
      setLoginError(false);
      onNavigate('afad');
    } else {
      setLoginError(true);
    }
  };

  useEffect(() => {
    const fetchLocalData = () => {
      try {
        const formSaved = localStorage.getItem('form_reports');
        if (formSaved) setFormReports(JSON.parse(formSaved));
      } catch (e) {}
    };

    fetchLocalData();

    const handleStorageChange = (e) => {
      if (e.key === 'form_reports' && e.newValue) {
        setFormReports(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className={styles.dashboard}>
      <div className={styles.welcomeSection}>
        <h2>Acil Durum Bildirimleri</h2>
        <p>Lütfen sahadaki durumu en hızlı ve doğru şekilde merkeze iletin.</p>
      </div>

      <div className={styles.grid}>
        <button className={`${styles.card} ${styles.buildingCard}`} onClick={() => onNavigate('building')}>
          <div className={styles.iconWrapper}>
            <Building2 size={32} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Bina Hasar Durumu</h3>
            <p className={styles.cardDesc}>Yıkılan veya ağır hasarlı binaları, enkaz durumunu bildirin.</p>
          </div>
        </button>

        <button className={`${styles.card} ${styles.roadCard}`} onClick={() => onNavigate('road')}>
          <div className={styles.iconWrapper}>
            <Navigation size={32} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Kapanan Yollar</h3>
            <p className={styles.cardDesc}>Enkaz veya çökme nedeniyle ulaşıma kapanan yolları bildirin.</p>
          </div>
        </button>

        <button className={`${styles.card} ${styles.medicalCard}`} onClick={() => onNavigate('medical')}>
          <div className={styles.iconWrapper}>
            <HeartPulse size={32} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Yaralı Bildirimi</h3>
            <p className={styles.cardDesc}>Ağır yaralı sayısını ve acil tıbbi müdahale gereksinimini bildirin.</p>
          </div>
        </button>

        <button className={`${styles.card} ${styles.supplyCard}`} onClick={() => onNavigate('supply')}>
          <div className={styles.iconWrapper}>
            <Package size={32} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Malzeme Talebi</h3>
            <p className={styles.cardDesc}>Su, çadır, battaniye ve gıda gibi acil ihtiyaçları talep edin.</p>
          </div>
        </button>
        <button className={`${styles.card}`} style={{gridColumn: '1 / -1'}} onClick={() => onNavigate('supply_view')}>
          <div className={styles.iconWrapper} style={{color: '#64748b', background: 'rgba(100, 116, 139, 0.1)'}}>
            <ClipboardList size={32} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Canlı Afet Haritasını Görüntüle</h3>
            <p className={styles.cardDesc}>Yaralı bildirimi, malzeme talebi, kapanan yollar ve bina hasar durumu gibi tüm sahadan gelen raporları anlık izleyin.</p>
          </div>
        </button>

        <button className={`${styles.card}`} style={{gridColumn: '1 / -1'}} onClick={() => setShowInfoModal(true)}>
          <div className={styles.iconWrapper} style={{color: '#0f766e', background: 'rgba(15, 118, 110, 0.1)'}}>
            <BookOpen size={32} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Afet Bilgilendirme ve Yönergeler</h3>
            <p className={styles.cardDesc}>Toplanma alanlarında yer alan donanımlar ve acil ilk yardım kitleri nasıl kullanılır? Hayat kurtaran kritik bilgiler.</p>
          </div>
        </button>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <p style={{color: '#666', fontSize: '0.9rem', margin: 0}}>
          (Jüri Demoları İçin Ekranlar)
        </p>

        <button 
          onClick={() => setShowLoginModal(true)}
          style={{
            background: '#111', color: '#f85149', padding: '12px 24px', 
            borderRadius: '8px', border: '1px solid #30363d', 
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', 
            gap: '8px', fontWeight: 'bold', fontSize: '1rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <ShieldAlert size={20} />
          City Link Kontrol Merkezine Bağlan
        </button>

        <button 
          onClick={() => {
            if(window.confirm('Tüm harita verileri, test pinleri ve AFAD logları sıfırlanacak. Demoyu baştan başlatmak istediğinize emin misiniz?')) {
              localStorage.removeItem('disaster_reports');
              localStorage.removeItem('form_reports');
              window.location.reload();
            }
          }}
          style={{
            background: 'transparent', color: '#666', padding: '8px 16px', 
            borderRadius: '4px', border: '1px dashed #ccc', 
            cursor: 'pointer', fontSize: '0.85rem', marginTop: '1rem'
          }}
        >
          Tüm Test Verilerini ve Haritayı Sıfırla
        </button>
      </div>

      {/* Bilgilendirme Modalı */}
      {showInfoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2.5rem', width: '90%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <button onClick={() => setShowInfoModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#000'} onMouseOut={e=>e.currentTarget.style.color='#666'}><XSquare size={32} /></button>
            
            <h2 style={{ color: '#15803d', marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem' }}>
              <BookOpen size={36} /> Hayat Kurtaran Kritik Bilgiler
            </h2>
            
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ borderBottom: '2px solid #bbf7d0', paddingBottom: '0.5rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20}/> 1. Toplanma Alanı Standart Donanımları
              </h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Afet anında bölgedeki ana toplanma alanlarında AFAD ve Kızılay tarafından bırakılmış şu kapalı devre kriz dolapları bulunur:</p>
              <ul style={{ color: '#374151', lineHeight: '1.8', background: '#f8fafc', padding: '1rem 2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <li><strong>Acil Durum Jenaratörü & Yakıtı:</strong> Tıbbi cihazların çalışması ve gece aydınlatması için. (Çalıştırma panosu renk kodludur)</li>
                <li><strong>Uydu İnternet Kiti:</strong> Yalnızca kritik verilerin (Yaralı & Lojistik Formları) iletimi için otomatik aktifleşen kapalı ağ.</li>
                <li><strong>OED (Otomatik Eksternal Defibrilatör) İstasyonu:</strong> Şarj edilebilir kalp şok cihazı.</li>
                <li><strong>Travma Çantası:</strong> Turnike, atel, termal battaniye ve ağır yanık jeli içerir.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ borderBottom: '2px solid #bbf7d0', paddingBottom: '0.5rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartPulse size={20}/> 2. Tıbbi Malzemelerin Temel Kullanımı
              </h3>
              <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 'bold', marginBottom: '0.5rem' }}><AlertCircle size={18}/> Kanamalarda Turnike (CAT) Uygulaması</div>
                <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.95rem', lineHeight: '1.5' }}>Gövde veya boyuna TURNİKE UYGULANMAZ. Sadece kol ve bacaklardaki fışkırır şeklindeki atardamar kanamalarında: Kanamaya en az 5-8 cm yukarıdan bandı sarın, çubuğu kanama durana kadar çevirin ve çubuğu kilitleyin. Uygulama saatini KESİNLİKLE yaralının alnına T:14.30 şeklinde yazın.</p>
              </div>

              <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 'bold', marginBottom: '0.5rem' }}><HeartPulse size={18}/> Defibrilatör (OED) Kullanımı</div>
                <p style={{ margin: 0, color: '#78350f', fontSize: '0.95rem', lineHeight: '1.5' }}>Sadece bilinci kapalı ve nefes almayan hastalarda uygulanır. Cihazı açın ve konuşan Türkçe sesli asistanın talimatlarını birebir uygulayın. Pedleri gösterildiği gibi çıplak göğse yapıştırın. Cihaz şok verirken hastaya KİMSENİN DOKUNMADIĞINA emin olun.</p>
              </div>
            </div>

            <div>
              <h3 style={{ borderBottom: '2px solid #bbf7d0', paddingBottom: '0.5rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={20}/> 3. Psikolojik Uyarılar
              </h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Deprem sonrası özellikle ilk saatlerde <strong>"Panik ve Bilgi Kirliliği"</strong> en az göçük kadar tehlikelidir. Sadece sistemdeki AFAD kriz merkezi teyitli bilgilere veya kapalı ağ haritasındaki verilere itibar edin. İhtiyacınız olmayan hiçbir tıbbi stoğu kendi çantanıza almayın.</p>
            </div>
            
          </div>
        </div>
      )}

      {/* Login Modalı */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#1e1e1e', color: '#fff', borderRadius: '12px', padding: '2.5rem', width: '90%', maxWidth: '400px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
            <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><XSquare size={24} /></button>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#f85149', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
              <ShieldAlert size={24} /> City Link Girişi
            </h2>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              {loginError && <div style={{ color: '#ff4d4f', fontSize: '0.9rem', background: 'rgba(255, 77, 79, 0.1)', padding: '8px', borderRadius: '4px' }}>Hatalı ID veya Şifre!</div>}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#aaa' }}>Giriş ID</label>
                <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#2a2a2a', color: '#fff', boxSizing: 'border-box' }} autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#aaa' }}>Şifre</label>
                <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#2a2a2a', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ background: '#f85149', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '1rem' }}>Sisteme Bağlan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
