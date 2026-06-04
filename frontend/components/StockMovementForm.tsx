'use client';

import { useState } from 'react';
import type { StockLevel, StockMovementType } from '@/lib/types/stock';

export type StockMovementFormValues = {
  productId: string;
  type: StockMovementType;
  quantity: string;
  newQuantity: string;
  observations: string;
};

type Props = {
  products: StockLevel[];
  onSubmit: (values: StockMovementFormValues) => Promise<void>;
  error?: string | null;
  submitting?: boolean;
  onSuccess?: () => void;
};

const defaultValues: StockMovementFormValues = {
  productId: '',
  type: 'IN',
  quantity: '1',
  newQuantity: '0',
  observations: '',
};

const typeLabels: Record<StockMovementType, string> = {
  IN: 'Entrada (IN)',
  OUT: 'Salida (OUT)',
  ADJUSTMENT: 'Ajuste (ADJUSTMENT)',
};

export default function StockMovementForm({
  products,
  onSubmit,
  error,
  submitting = false,
}: Props) {
  const [values, setValues] = useState<StockMovementFormValues>(defaultValues);

  const update = (patch: Partial<StockMovementFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const selectedProduct = products.find((p) => String(p.productId) === values.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
    setValues(defaultValues);
  };

  return (
    <form onSubmit={handleSubmit} className="stock-movement-form">
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="grid-2">
        <div className="form-field">
          <label htmlFor="movement-product">Producto *</label>
          <select
            id="movement-product"
            value={values.productId}
            onChange={(e) => update({ productId: e.target.value })}
            required
          >
            <option value="">Seleccionar…</option>
            {products.map((p) => (
              <option key={p.productId} value={String(p.productId)}>
                {p.sku} — {p.name} (stock: {p.quantity})
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="movement-type">Tipo *</label>
          <select
            id="movement-type"
            value={values.type}
            onChange={(e) => update({ type: e.target.value as StockMovementType })}
            required
          >
            {(Object.keys(typeLabels) as StockMovementType[]).map((t) => (
              <option key={t} value={t}>
                {typeLabels[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {values.type === 'ADJUSTMENT' ? (
        <div className="form-field">
          <label htmlFor="movement-new-qty">Nueva cantidad *</label>
          <input
            id="movement-new-qty"
            type="number"
            min="0"
            step="1"
            value={values.newQuantity}
            onChange={(e) => update({ newQuantity: e.target.value })}
            required
          />
          {selectedProduct && (
            <span className="field-hint">Actual: {selectedProduct.quantity}</span>
          )}
        </div>
      ) : (
        <div className="form-field">
          <label htmlFor="movement-qty">Cantidad *</label>
          <input
            id="movement-qty"
            type="number"
            min="1"
            step="1"
            value={values.quantity}
            onChange={(e) => update({ quantity: e.target.value })}
            required
          />
          {selectedProduct && values.type === 'OUT' && (
            <span className="field-hint">Disponible: {selectedProduct.quantity}</span>
          )}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="movement-obs">Observaciones</label>
        <textarea
          id="movement-obs"
          rows={2}
          maxLength={500}
          value={values.observations}
          onChange={(e) => update({ observations: e.target.value })}
          placeholder="Motivo del movimiento…"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-inline" disabled={submitting}>
          {submitting ? 'Registrando…' : 'Registrar movimiento'}
        </button>
      </div>
    </form>
  );
}

export function formValuesToPayload(values: StockMovementFormValues) {
  const payload = {
    productId: Number(values.productId),
    type: values.type,
    observations: values.observations.trim() || undefined,
  };

  if (values.type === 'ADJUSTMENT') {
    return { ...payload, newQuantity: Number(values.newQuantity) };
  }
  return { ...payload, quantity: Number(values.quantity) };
}
