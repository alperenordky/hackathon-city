import React from 'react';
import { Activity, Radio, User, AlertCircle } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ connectionStatus = 'connected', volunteerName = 'Gönüllü - 01' }) => {
  return (
    <header className={styles.header}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <Activity size={24} />
        </div>
        <div>
          <h1 className={styles.title}>City Link</h1>
          <div className={styles.subtitle}>İlk 48 Saat Acil Bildirim Sistemi</div>
        </div>
      </div>
      
      <div className={styles.statusArea}>
        {connectionStatus === 'connected' && (
          <div className={styles.connectionBadge}>
            <Radio size={14} /> LoRa Mesh: Bağlı
          </div>
        )}
        {connectionStatus === 'connecting' && (
          <div className={`${styles.connectionBadge} ${styles.connecting}`}>
            <Radio size={14} className="animate-pulse" /> LoRa Mesh: Aranıyor...
          </div>
        )}
        {connectionStatus === 'offline' && (
          <div className={`${styles.connectionBadge} ${styles.offline}`}>
            <AlertCircle size={14} /> Çevrimdışı (Yerel Kayıt)
          </div>
        )}
        
        <div className={styles.volunteerInfo}>
          <User size={12} /> {volunteerName}
        </div>
      </div>
    </header>
  );
};

export default Header;
