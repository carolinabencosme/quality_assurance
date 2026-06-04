'use client';

import { useState } from 'react';
import type { Category, ProductStatus } from '@/lib/types/product';

export type ProductFormValues = {
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  price: string;
  quantity: string;
  minStock: string;
  status: ProductStatus;
};

type Props = {
  mode: 'create' | 'edit';
  categories: Category[];
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  error?: string | null;
  submitting?: boolean;
};

const defaultValues: ProductFormValues = {
  name: '',
  sku: '',
  description: '',
  categoryId: '',
  price: '0',
  quantity: '0',
  minStock: '0',
  status: 'ACTIVE',
};

export default function ProductForm({
  mode,
  categories,
  initialValues,
  onSubmit,
  onCancel,
  error,
  submitting = false,
}: Props) {
  const [values, setValues] = useState<ProductFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  const update = (patch: Partial<ProductFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="grid-2">
        <div className="form-field">
          <label htmlFor="name">Nombre *</label>
          <input
            id="name"
            value={values.name}
            onChange={(e) => update({ name: e.target.value })}
            required
            maxLength={200}
          />
        </div>

        <div className="form-field">
          <label htmlFor="sku">SKU *</label>
          <input
            id="sku"
            value={values.sku}
            onChange={(e) => update({ sku: e.target.value })}
            required
            maxLength={50}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => update({ description: e.target.value })}
          maxLength={5000}
        />
      </div>

      <div className="grid-2">
        <div className="form-field">
          <label htmlFor="categoryId">Categoría *</label>
          <select
            id="categoryId"
            value={values.categoryId}
            onChange={(e) => update({ categoryId: e.target.value })}
            required
          >
            <option value="">Seleccionar…</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="price">Precio *</label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => update({ price: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid-2">
        {mode === 'create' && (
          <div className="form-field">
            <label htmlFor="quantity">Stock inicial *</label>
            <input
              id="quantity"
              type="number"
              min="0"
              step="1"
              value={values.quantity}
              onChange={(e) => update({ quantity: e.target.value })}
              required
            />
          </div>
        )}

        <div className="form-field">
          <label htmlFor="minStock">Stock mínimo *</label>
          <input
            id="minStock"
            type="number"
            min="0"
            step="1"
            value={values.minStock}
            onChange={(e) => update({ minStock: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="status">Estado *</label>
          <select
            id="status"
            value={values.status}
            onChange={(e) => update({ status: e.target.value as ProductStatus })}
            required
          >
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      </div>

      {mode === 'edit' && (
        <p className="form-hint">
          La cantidad en inventario se modifica desde movimientos de stock, no desde este formulario.
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary btn-inline" disabled={submitting}>
          {submitting ? 'Guardando…' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

export function productToFormValues(product: {
  name: string;
  sku: string;
  description: string | null;
  categoryId: number;
  price: number;
  quantity: number;
  minStock: number;
  status: ProductStatus;
}): ProductFormValues {
  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? '',
    categoryId: String(product.categoryId),
    price: String(product.price),
    quantity: String(product.quantity),
    minStock: String(product.minStock),
    status: product.status,
  };
}

export function formValuesToCreatePayload(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    sku: values.sku.trim(),
    description: values.description.trim() || undefined,
    categoryId: Number(values.categoryId),
    price: Number(values.price),
    quantity: Number(values.quantity),
    minStock: Number(values.minStock),
    status: values.status,
  };
}

export function formValuesToUpdatePayload(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    sku: values.sku.trim(),
    description: values.description.trim() || undefined,
    categoryId: Number(values.categoryId),
    price: Number(values.price),
    minStock: Number(values.minStock),
    status: values.status,
  };
}
