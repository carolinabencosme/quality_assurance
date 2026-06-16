'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/icons/AppIcons';

const BARS = [42, 68, 88, 55, 72, 61, 79];

const EVENTS = [
  { icon: 'package', text: 'Entrada - SKU-NM-001', time: '+24 u.' },
  { icon: 'stock', text: 'Salida - SKU-NM-014', time: '-8 u.' },
  { icon: 'audit', text: 'Auditoria - producto #12', time: '2m' },
] as const;

export default function DashboardPreview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={`preview-shell ${mounted ? 'preview-shell--live' : ''}`} aria-hidden>
      <div className="preview-card">
        <div className="preview-sidebar">
          <div className="preview-avatar preview-pulse" />
          <div className="preview-user-name">Almacen central</div>
          <div className="preview-status">
            <span className="preview-dot preview-dot--pulse" /> En linea
          </div>
          <div className="preview-heatmap" aria-hidden>
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className={i === 19 ? 'active' : undefined}
                style={{ animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
        </div>
        <div className="preview-main">
          <div className="preview-main-head">
            <div>
              <span className="preview-pill">Hoy</span>
              <h3>Actividad operativa</h3>
            </div>
            <span className="preview-health">98% saludable</span>
          </div>
          <ul className="preview-timeline">
            {EVENTS.map((event, i) => (
              <li
                key={event.text}
                className="preview-timeline-item"
                style={{ animationDelay: `${200 + i * 120}ms` }}
              >
                <span className="preview-event-icon">
                  <Icon name={event.icon} size={15} />
                </span>
                <span className="preview-event-text">{event.text}</span>
                <span className="preview-event-time">{event.time}</span>
              </li>
            ))}
          </ul>
          <div className="preview-chart">
            {BARS.map((height, i) => (
              <div
                key={i}
                className={`preview-chart-bar ${i === 2 ? 'active' : ''}`}
                style={{
                  height: mounted ? `${height}%` : '8%',
                  transitionDelay: `${300 + i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="preview-dock">
          <span>
            <Icon name="dashboard" size={15} />
          </span>
          <span>
            <Icon name="package" size={15} />
          </span>
          <span className="active">
            <Icon name="stock" size={15} />
          </span>
          <span>
            <Icon name="reports" size={15} />
          </span>
          <span className="badge-dot">3</span>
        </div>
      </div>
    </div>
  );
}
