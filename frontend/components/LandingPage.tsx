'use client';

import AnimatedNumber from '@/components/AnimatedNumber';
import BrandMark from '@/components/BrandMark';
import DashboardPreview from '@/components/DashboardPreview';
import Icon from '@/components/icons/AppIcons';
import LoginForm from '@/components/LoginForm';
import Reveal from '@/components/Reveal';
import { BRAND, LANDING_FEATURES, LANDING_STATS } from '@/lib/brand';

type Props = {
  sessionExpired?: boolean;
};

export default function LandingPage({ sessionExpired }: Props) {
  return (
    <div className="landing">
      <div className="landing-blob landing-blob--1" aria-hidden />
      <div className="landing-blob landing-blob--2" aria-hidden />
      <div className="landing-blob landing-blob--3" aria-hidden />
      <div className="landing-grid-bg" aria-hidden />

      <header className="landing-nav animate-fade-down">
        <div className="landing-nav-inner">
          <BrandMark size="sm" showLabel variant="dark" />
          <nav className="landing-nav-links" aria-label="Enlaces de la landing">
            <a href="#features">Funciones</a>
            <a href="#preview">Demo</a>
            <a href="#acceso">Acceso</a>
          </nav>
          <a href="#acceso" className="btn btn-gradient btn-sm">
            Entrar
          </a>
        </div>
      </header>

      <section className="landing-hero">
        <Reveal>
          <p className="landing-tag">
            <Icon name="sparkles" size={14} /> Nuevo panel operativo para inventario
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1>
            Cub <span>inventario inteligente</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="landing-lead">{BRAND.description}</p>
        </Reveal>
        <Reveal delay={240}>
          <div className="landing-cta">
            <a href="#acceso" className="btn btn-gradient">
              Comenzar ahora
            </a>
            <a href="#preview" className="btn btn-soft">
              Ver demo
            </a>
          </div>
        </Reveal>
      </section>

      <section id="preview" className="landing-preview-wrap" aria-labelledby="preview-title">
        <Reveal>
          <div className="section-kicker">Producto</div>
          <h2 id="preview-title" className="section-title section-title--center">
            Vista previa del panel real
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <DashboardPreview />
        </Reveal>
      </section>

      <section className="landing-stats" aria-label="Metricas de calidad">
        <div className="stats-row">
          {LANDING_STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 60}>
              <div className="stat-item">
                <strong>
                  <AnimatedNumber
                    value={stat.value}
                    format={(n) =>
                      `${'prefix' in stat ? stat.prefix : ''}${n}${'suffix' in stat ? stat.suffix : ''}`
                    }
                  />
                </strong>
                <span>{stat.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="features" className="landing-features" aria-labelledby="features-title">
        <Reveal>
          <div className="section-kicker">Sistema</div>
          <h2 id="features-title" className="section-title">
            Operacion clara de punta a punta
          </h2>
          <p className="section-sub">Inventario empresarial con evidencia de calidad lista para demo.</p>
        </Reveal>
        <div className="features-grid">
          {LANDING_FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 70} className="feature-card-wrap">
              <article className="feature-card">
                <span className="feature-icon" aria-hidden>
                  <Icon name={feature.icon} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="acceso" className="landing-auth-section" aria-labelledby="login-title">
        <div className="landing-auth-bg" aria-hidden />
        <Reveal threshold={0.2}>
          <LoginForm sessionExpired={sessionExpired} />
        </Reveal>
      </section>

      <footer className="landing-footer">
        <BrandMark size="sm" showLabel />
        <span>PUCMM &middot; Aseguramiento de Calidad de Software</span>
        <p className="landing-ports-hint">
          App: <a href="http://localhost:3000">localhost:3000</a> &middot; API:{' '}
          <a href="http://localhost:8080/swagger-ui.html">localhost:8080</a> &middot; Keycloak:{' '}
          <a href="http://localhost:8081">localhost:8081</a>
        </p>
      </footer>
    </div>
  );
}
