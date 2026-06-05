export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export type StockLevel = {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  minStock: number;
  critical: boolean;
  status: string;
};

export type StockMovement = {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  userId: string | null;
  type: StockMovementType;
  previousQty: number;
  newQty: number;
  delta: number;
  observations: string | null;
  correlationId: string | null;
  createdAt: string;
};

export type StockMovementPayload = {
  productId: number;
  type: StockMovementType;
  quantity?: number;
  newQuantity?: number;
  observations?: string;
  userId?: string;
};

export type MovementFilters = {
  productId: string;
  type: string;
  page: number;
  size: number;
};
