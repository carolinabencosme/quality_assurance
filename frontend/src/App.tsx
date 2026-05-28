import { useEffect, useState } from 'react';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/products?size=10&sort=name,asc`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PageResponse>;
      })
      .then((page) => {
        setProducts(page.content);
        setTotal(page.totalElements);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="app">
      <header>
        <h1>Inventory QAS</h1>
        <p>Fase 1 — Core productos y stock (QA-3)</p>
      </header>
      <section className="card">
        <h2>Productos ({total})</h2>
        {error && <p className="error">API: {error}</p>}
        {!error && products.length === 0 && <p>Cargando productos…</p>}
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
      <footer>
        <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer">
          Swagger UI
        </a>
        {' · '}
        <a href={`${apiBase}/products`} target="_blank" rel="noreferrer">
          API productos
        </a>
      </footer>
    </main>
  );
}
