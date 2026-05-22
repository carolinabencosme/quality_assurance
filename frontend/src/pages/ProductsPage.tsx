import { useEffect, useState } from 'react';
import { apiGet } from '../api';
import AppLayout from '../components/AppLayout';

type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  critical: boolean;
  categoryName: string;
};

type PageResponse = {
  content: Product[];
  totalElements: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<PageResponse>('/products?size=20&sort=name,asc')
      .then((page) => {
        setProducts(page.content);
        setTotal(page.totalElements);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AppLayout title="Productos">
      <section className="card">
        <h2>Listado ({total})</h2>
        {error && <p className="error">{error}</p>}
        <ul className="product-list">
          {products.map((p) => (
            <li key={p.id} className={p.critical ? 'critical' : ''}>
              <strong>{p.name}</strong> ({p.sku}) — {p.categoryName}
              <br />
              Stock: {p.quantity} / min {p.minStock}
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
}
