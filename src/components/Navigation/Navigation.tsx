"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Navigation.module.css';
import { navigationItems } from './Navigation.constants';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // Actualizar variable CSS global cuando cambia el estado
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--nav-expanded',
      isExpanded ? '1' : '0'
    );
    document.documentElement.style.setProperty(
      '--nav-width',
      isExpanded ? '200px' : '60px'
    );
  }, [isExpanded]);


  return (
    <nav
      className={`${styles.globalNavigation} ${isExpanded ? styles.expanded : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={styles.navContainer}>
        <div className={styles.navMainItems}>
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`${styles.navItem} ${pathname === item.path || pathname.startsWith(item.path + '/') ? styles.active : ''}`}
              title={isExpanded ? item.description : `${item.label} - ${item.description}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {isExpanded && <span className={styles.navLabel}>{item.label}</span>}
            </button>
          ))}
        </div>

        <div className={styles.navFooterItems}>
          <button
            onClick={() => router.push('/settings/connect')}
            className={`${styles.navItem} ${pathname.startsWith('/settings') ? styles.active : ''}`}
            title={isExpanded ? 'Configuración de la aplicación' : 'Configuración - Configuración de la aplicación'}
          >
            <span className={styles.navIcon}>⚙️</span>
            {isExpanded && <span className={styles.navLabel}>Configuración</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}; 