import { useEffect, useState } from 'react';
import { authHeaders, clearToken, getStoredToken, login } from './auth';

type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  critical: boolean;
  status: string;
  categoryName: string;
};

type PageResponse = {
  content: Product[];
  totalElements: number;
};

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

export default function App() {
  const [username, setUsername] = useState('viewer');
  const [password, setPassword] = useState('viewer123');
  const [loggedIn, setLoggedIn] = useState(!!getStoredToken());
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = () => {
    setError(null);
    fetch(`${apiBase}/products?size=10&sort=name,asc`, { headers: authHeaders() })
      .then((res) => {
        if (res.status === 401) throw new Error('401 — Inicia sesión');
        if (res.status === 403) throw new Error('403 — Sin permiso product:view');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PageResponse>;
      })
      .then((page) => {
        setProducts(page.content);
        setTotal(page.totalElements);
      })
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    if (loggedIn) {
      loadProducts();
    }
  }, [loggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      setLoggedIn(true);
      setError(null);
    } catch {
      setError('No se pudo autenticar con Keycloak');
      setLoggedIn(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    setProducts([]);
    setTotal(0);
  };

  return (
    <main className="app">
      <header>
        <h1>Inventory QAS</h1>
        <p>Fase 2 — Keycloak + permisos granulares (QA-4)</p>
      </header>

      {!loggedIn ? (
        <section className="card">
          <h2>Iniciar sesión (Keycloak)</h2>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              Usuario
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit">Entrar</button>
          </form>
          <p className="hint">
            Prueba: viewer / viewer123 (solo lectura) · admin / admin123 (completo)
          </p>
        </section>
      ) : (
        <>
          <section className="toolbar">
            <button type="button" onClick={loadProducts}>
              Actualizar
            </button>
            <button type="button" onClick={handleLogout}>
              Salir
            </button>
          </section>
          <section className="card">
            <h2>Productos ({total})</h2>
            {error && <p className="error">{error}</p>}
            {!error && products.length === 0 && <p>Cargando…</p>}
            <ul className="product-list">
              {products.map((p) => (
                <li key={p.id} className={p.critical ? 'critical' : ''}>
                  <strong>{p.name}</strong> ({p.sku}) — {p.categoryName}
                  <br />
                  Stock: {p.quantity} / min {p.minStock}
                  {p.critical && <span className="badge"> Crítico</span>}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <footer>
        <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer">
          Swagger UI
        </a>
      </footer>
    </main>
  );
}
