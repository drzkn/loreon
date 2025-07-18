import React from 'react';
import { Card } from '../components/Card';

export const HomeScreen: React.FC = () => {
  return (
    <div className="home-screen">
      <div className="home-content">
        <header className="home-header">
          <h1>Bienvenido a Loreon</h1>
          <p>Tu plataforma de gestión de contenido con Notion y Supabase</p>
        </header>

        <div className="features-grid">
          <Card
            title="Notion Integration"
            description="Conecta y sincroniza tu contenido desde Notion de forma automática"
          >
            <button className="feature-button">
              Configurar Notion
            </button>
          </Card>

          <Card
            title="Supabase Backend"
            description="Base de datos en tiempo real con autenticación segura"
          >
            <button className="feature-button">
              Ver Dashboard
            </button>
          </Card>

          <Card
            title="Testing Suite"
            description="Suite completa de tests con cobertura del 80%+"
          >
            <button className="feature-button">
              Ejecutar Tests
            </button>
          </Card>

          <Card
            title="Arquitectura Hexagonal"
            description="Código limpio y mantenible con separación de responsabilidades"
          >
            <button className="feature-button">
              Ver Documentación
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
