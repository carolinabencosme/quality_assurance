'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/icons/AppIcons';
import ProductForm, {
  formValuesToUpdatePayload,
  productToFormValues,
  type ProductFormValues,
} from '@/components/ProductForm';
import { ApiError, apiDelete, apiGet, apiPut } from '@/lib/api';
import { canManageProducts } from '@/lib/permissions';
import type { Category, Product } from '@/lib/types/product';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!canManageProducts()) {
      setError('Tu usuario no tiene permiso product:manage.');
      setLoading(false);
      return;
    }
    if (Number.isNaN(productId)) {
      setError('ID de producto invalido');
      setLoading(false);
      return;
    }

    Promise.all([apiGet<Product>(`/products/${productId}`), apiGet<Category[]>('/categories')])
      .then(([p, cats]) => {
        setProduct(p);
        setCategories(cats);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await apiPut<Product>(
        `/products/${productId}`,
        formValuesToUpdatePayload(values),
      );
      setProduct(updated);
      router.push('/products');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiDelete(`/products/${productId}`);
      router.push('/products');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo inactivar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <span className="spinner" aria-hidden /> Cargando producto...
      </div>
    );
  }

  if (!product && error) {
    return (
      <>
        <h1 className="page-title">Editar producto</h1>
        <div className="alert alert-error">{error}</div>
        <Link href="/products" className="link-action">
          <Icon name="chevronLeft" size={14} /> Volver al listado
        </Link>
      </>
    );
  }

  if (!product) return null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Editar producto</h1>
          <p className="page-sub">
            {product.sku} - Stock actual: {product.quantity} -{' '}
            <Link href="/products" className="link-action">
              <Icon name="chevronLeft" size={14} /> Volver al listado
            </Link>
          </p>
        </div>
        {product.status === 'ACTIVE' && (
          <button
            type="button"
            className="btn btn-danger btn-inline"
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
          >
            <Icon name="alert" size={17} /> Inactivar
          </button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{product.name}</h2>
        </div>
        <ProductForm
          mode="edit"
          categories={categories}
          initialValues={productToFormValues(product)}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/products')}
          error={error}
          submitting={submitting}
        />
      </section>

      {confirmOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <span className="confirm-modal-icon" aria-hidden>
              <Icon name="alert" size={22} />
            </span>
            <h2 id="confirm-title">Inactivar producto</h2>
            <p>
              {product.name} dejara de estar disponible para nuevos movimientos. Puedes cancelar
              ahora si solo querias revisar el registro.
            </p>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeactivate}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" aria-hidden /> Inactivando...
                  </>
                ) : (
                  'Inactivar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
