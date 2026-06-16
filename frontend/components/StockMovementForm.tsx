'use client';

import { useState } from 'react';
import Icon from '@/components/icons/AppIcons';
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
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUSTMENT: 'Ajuste',
};

const typeHints: Record<StockMovementType, string> = {
  IN: 'Suma unidades al inventario.',
  OUT: 'Descuenta unidades disponibles.',
  ADJUSTMENT: 'Fija una nueva cantidad final.',
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

  const selectedProduct = products.find((product) => String(product.productId) === values.productId);

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

      <div className="form-field">
        <label htmlFor="movement-product">Producto *</label>
        <select
          id="movement-product"
          value={values.productId}
          onChange={(e) => update({ productId: e.target.value })}
          required
        >
          <option value="">Seleccionar...</option>
          {products.map((product) => (
            <option key={product.productId} value={String(product.productId)}>
              {product.sku} - {product.name} (stock: {product.quantity})
            </option>
          ))}
        </select>
        {selectedProduct && (
          <span className={selectedProduct.critical ? 'field-hint field-hint--warn' : 'field-hint'}>
            Actual: {selectedProduct.quantity} unidades. Minimo: {selectedProduct.minStock}.
          </span>
        )}
      </div>

      <div className="form-field">
        <span className="form-label">Tipo de movimiento *</span>
        <div className="movement-type-grid" role="group" aria-label="Tipo de movimiento">
          {(Object.keys(typeLabels) as StockMovementType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={values.type === type ? 'movement-type active' : 'movement-type'}
              onClick={() => update({ type })}
              aria-pressed={values.type === type}
            >
              <Icon name={type === 'IN' ? 'arrowUp' : type === 'OUT' ? 'arrowDown' : 'stock'} size={18} />
              <strong>{typeLabels[type]}</strong>
              <span>{typeHints[type]}</span>
            </button>
          ))}
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
            inputMode="numeric"
          />
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
            inputMode="numeric"
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
          placeholder="Motivo del movimiento..."
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-inline" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner spinner--light" aria-hidden /> Registrando...
            </>
          ) : (
            <>
              <Icon name="stock" size={17} /> Registrar movimiento
            </>
          )}
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
