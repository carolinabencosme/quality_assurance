'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductForm, {
  formValuesToCreatePayload,
  type ProductFormValues,
} from '@/components/ProductForm';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import { canManageProducts } from '@/lib/permissions';
import type { Category, Product } from '@/lib/types/product';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canManageProducts()) {
      setError('Tu usuario no tiene permiso product:manage.');
      setLoading(false);
      return;
    }

    apiGet<Category[]>('/categories')
      .then(setCategories)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiPost<Product>('/products', formValuesToCreatePayload(values));
      router.push(`/products/${created.id}/edit`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el producto');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <span className="spinner" /> Cargando formulario…
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nuevo producto</h1>
          <p className="page-sub">
            <Link href="/products" className="link-action">
              ← Volver al listado
            </Link>
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Datos del producto</h2>
        </div>
        <ProductForm
          mode="create"
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/products')}
          error={error}
          submitting={submitting}
        />
      </section>
    </>
  );
}
