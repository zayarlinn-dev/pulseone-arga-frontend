import privateApi from '@/providers/privateAxios';
import { createResourceService } from './createResourceService';
import { toApiError } from '@/lib/getApiErrorMessage';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  CapitalSummary,
  Category,
  CheckIn,
  DeadStockRow,
  ExpiryBucket,
  MovementPoint,
  StoreCapital,
  VendorSpend,
  ConsultantEarnings,
  ConsultantServiceFee,
  Entity,
  DashboardCounts,
  Department,
  Employee,
  GenderCount,
  GRN,
  InventoryCounts,
  ItemProfit,
  PaymentMethodTotal,
  PharmacySalePoint,
  ProfitSummaryResponse,
  ProfitTrendPoint,
  RevenuePoint,
  RevenueSource,
  Invoice,
  InvoiceDetail,
  Item,
  ItemUOM,
  Order,
  Patient,
  PatientSummary,
  PaymentMethod,
  PharmacySale,
  RefundableLine,
  RefundInvoice,
  ReturnableLine,
  ReturnPaymentMethod,
  ReturnPharmacySale,
  StockAdjustment,
  StockConsumption,
  StockDamage,
  StockOpen,
  StockTransfer,
  PermissionModel,
  Role,
  Room,
  RoomBoardEntry,
  Service,
  ServiceCenter,
  StockBalanceRow,
  StockBatchBreakdown,
  StockLedgerReport,
  ExpiringBatch,
  ExpiryAlertCounts,
  InventorySettings,
  IssuePolicy,
  RegistrationForm,
  RequiredFieldSettings,
  Store,
  User,
  Vendor,
  Visit,
  VisitType
} from '@/types/models';

/**
 * Clients for every CRUD resource. Endpoint paths match the Go router, which in
 * turn matches the legacy Sails URL space.
 */
export const departmentService = createResourceService<Department>(
  '/administration/departments',
  'department'
);
export const serviceCenterService = createResourceService<ServiceCenter>(
  '/administration/service-centers',
  'service center'
);
export const employeeService = createResourceService<Employee>(
  '/administration/employees',
  'employee'
);
export const serviceCatalogService = createResourceService<Service>(
  '/administration/services',
  'service'
);
export const vendorService = createResourceService<Vendor>('/administration/vendors', 'vendor');
export const storeService = createResourceService<Store>('/administration/stores', 'store');
/**
 * Items take one argument that is not a column: the stores to open the item in.
 * The backend creates a zero-quantity mapping row per store in the same
 * transaction, and an item with no mapping cannot hold stock anywhere.
 *
 * It is accepted on create only — update ignores it.
 */
export interface ItemCreatePayload extends Partial<Item> {
  storeIds?: number[];
}

export interface ItemUOMPayload {
  uomId: number;
  factorToBase: number;
  isPurchaseDefault: boolean;
  /** Null leaves the unit unsellable, which is what a carton is. */
  salePrice?: string | null;
}

export const itemService = {
  ...createResourceService<Item, ItemCreatePayload, Partial<Item>>(
    '/administration/items',
    'item'
  ),

  /**
   * The units one item may be keyed in — its base unit, its sale unit, and any
   * purchase unit added on top. They hang off the item because a "carton" is
   * only 200 tablets in the context of the medicine it is a carton of.
   */
  async getUnits(itemId: number | string): Promise<ItemUOM[]> {
    try {
      const response = await privateApi.get<ApiResponse<ItemUOM[]>>(
        `/administration/items/${itemId}/uoms`
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch item units');
    }
  },

  async addUnit(itemId: number | string, payload: ItemUOMPayload): Promise<ItemUOM> {
    try {
      const response = await privateApi.post<ApiResponse<ItemUOM>>(
        `/administration/items/${itemId}/uoms`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to add the unit');
    }
  },

  async updateUnit(
    itemId: number | string,
    unitId: number,
    payload: ItemUOMPayload
  ): Promise<ItemUOM> {
    try {
      const response = await privateApi.put<ApiResponse<ItemUOM>>(
        `/administration/items/${itemId}/uoms/${unitId}`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to update the unit');
    }
  },

  async removeUnit(itemId: number | string, unitId: number): Promise<void> {
    try {
      await privateApi.delete(`/administration/items/${itemId}/uoms/${unitId}`);
    } catch (error) {
      throw toApiError(error, 'Failed to remove the unit');
    }
  }
};

export const roomService = {
  ...createResourceService<Room>('/administration/rooms', 'room'),

  /** Rooms that are active and free — the only ones an admission may claim. */
  async getAvailable(): Promise<Room[]> {
    try {
      const response = await privateApi.get<ApiResponse<Room[]>>('/administration/rooms/available');
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch available rooms');
    }
  },

  /**
   * The ward board: every room, with the patients currently in them. One
   * request rather than paging the room list and the admission list separately
   * and joining them in the browser.
   */
  async getBoard(): Promise<RoomBoardEntry[]> {
    try {
      const response = await privateApi.get<ApiResponse<RoomBoardEntry[]>>(
        '/administration/rooms/board'
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to load the ward board');
    }
  }
};

export const patientService = {
  ...createResourceService<Patient>('/registration/patients', 'patient'),

  /** Registration-desk lookup by patient no, name, phone or NRC. */
  async search(term: string): Promise<Patient[]> {
    try {
      const response = await privateApi.get<ApiResponse<Patient[]>>('/registration/patients/search', {
        params: { search: term }
      });
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to search patients');
    }
  },

  /**
   * The history panel shown once a patient is selected — visit count, what was
   * done last time, and what is still owed. One request, because every screen
   * that picks a patient shows it straight away.
   */
  async summary(id: number | string): Promise<PatientSummary> {
    try {
      const response = await privateApi.get<ApiResponse<PatientSummary>>(
        `/registration/patients/${id}/summary`
      );
      if (!response.data.data) throw new Error('Patient summary not found');
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to load patient summary');
    }
  },

  /**
   * Every visit this patient has opened, newest first.
   *
   * Fetched whole rather than paged: it is the list the chart filters its bills
   * by, and a dropdown that hides the visit someone is looking for is worse
   * than no filter at all.
   */
  async getVisits(id: number | string): Promise<Visit[]> {
    try {
      const response = await privateApi.get<ApiResponse<Visit[]>>(
        `/registration/patients/${id}/visits`
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to load the patient visits');
    }
  }
};

/**
 * Opening a visit is not a plain insert: the backend allocates the visit code
 * and closes whichever visit is currently open, so the payload is a request
 * rather than a Visit.
 */
export interface VisitCreatePayload {
  patientId: number;
  visitType: VisitType;
}

export const visitService = createResourceService<Visit, VisitCreatePayload>('/visits', 'visit');

export interface CheckOutPayload {
  dischargeReason?: string | null;
  checkOutDate?: string;
}

export const checkInService = {
  ...createResourceService<CheckIn>('/rooms/check-in', 'admission'),

  /** Discharges an admission and hands the room back to housekeeping. */
  async checkOut(id: number | string, payload: CheckOutPayload = {}): Promise<void> {
    try {
      await privateApi.post(`/rooms/check-in/${id}/check-out`, payload);
    } catch (error) {
      throw toApiError(error, 'Failed to discharge patient');
    }
  }
};

/**
 * A role's grants are replaced wholesale: `moduleIds` is the complete list the
 * role should end up with, not a delta. Omitting it on update leaves the
 * existing grants alone.
 */
export interface RolePayload {
  roleName: string;
  description?: string | null;
  moduleIds?: number[];
}

export const roleService = createResourceService<Role, RolePayload, RolePayload>(
  '/administration/roles',
  'role'
);

/**
 * Ordering. Prices are not part of the payload — the backend reads them from
 * the service catalogue, so a client cannot name its own price.
 */
export interface OrderLinePayload {
  serviceId: number;
  qty: number;
  employeeId?: number | null;
  percentageDiscount?: number | null;
  amountDiscount?: string | null;
  orderRemarks?: string | null;
}

export interface OrderCreatePayload {
  patientId: number;
  /** Omitted, the backend bills it against the patient's open visit. */
  visitId?: number | null;
  lines: OrderLinePayload[];
}

export const orderService = {
  ...createResourceService<Order, OrderCreatePayload>('/orders', 'order'),

  /** Voids an order. Refused once any of its lines have been billed. */
  async cancel(id: number | string): Promise<void> {
    try {
      await privateApi.post(`/orders/${id}/cancel`);
    } catch (error) {
      throw toApiError(error, 'Failed to cancel order');
    }
  }
};

export interface InvoiceCreatePayload {
  invoiceDetailIds: number[];
  percentageDiscount?: number | null;
  amountDiscount?: string | null;
  tax?: string | null;
  paidBy: PaymentMethod;
  paidAmount: string;
  transactionNo?: string | null;
}

export interface InvoicePayPayload {
  paidAmount: string;
  paidBy: PaymentMethod;
  transactionNo?: string | null;
}

export const invoiceService = {
  ...createResourceService<Invoice, InvoiceCreatePayload>('/invoices', 'invoice'),

  /** The cashier's worklist: everything ordered but not yet billed. */
  async getBillableLines(patientId: number, visitId?: number | null): Promise<InvoiceDetail[]> {
    try {
      const response = await privateApi.get<ApiResponse<InvoiceDetail[]>>(
        '/invoices/billable-lines',
        { params: { patientId, visitId: visitId ?? undefined } }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch outstanding charges');
    }
  },

  /** Payments accumulate, so a deposit now and the balance later both work. */
  async pay(id: number | string, payload: InvoicePayPayload): Promise<Invoice> {
    try {
      const response = await privateApi.post<ApiResponse<Invoice>>(`/invoices/${id}/pay`, payload);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to record payment');
    }
  },

  /** Voids the bill and releases its charges so they can be billed again. */
  async cancel(id: number | string, reasons?: string | null): Promise<void> {
    try {
      await privateApi.post(`/invoices/${id}/cancel`, { reasons: reasons ?? null });
    } catch (error) {
      throw toApiError(error, 'Failed to cancel invoice');
    }
  }
};

/**
 * The walk-in counter.
 *
 * Services and medicine are rung up together and settled on the spot, with no
 * order behind them: the backend raises the invoice, dispenses the medicine
 * onto it and takes the payment in one transaction. Prices are not in the
 * payload — the backend reads them from the two catalogues.
 */
export interface CounterServiceLinePayload {
  serviceId: number;
  qty: number;
  /** Falls back to the sale's `employeeId` when unset. */
  employeeId?: number | null;
  percentageDiscount?: number | null;
  amountDiscount?: string | null;
  remarks?: string | null;
}

export interface CounterItemLinePayload {
  itemId: number;
  /** In the item's sale unit, the way the counter enters it. */
  qty: number;
  percentageDiscount?: number | null;
  amountDiscount?: string | null;
  remarks?: string | null;
}

export interface CounterSaleCreatePayload {
  /** Optional: a counter sale may be a plain walk-in with no patient record. */
  patientId?: number | null;
  visitId?: number | null;
  /** Required once the basket carries any medicine. */
  storeId?: number | null;
  /** Default consultant credited with every service line. */
  employeeId?: number | null;
  services: CounterServiceLinePayload[];
  items: CounterItemLinePayload[];
  percentageDiscount?: number | null;
  amountDiscount?: string | null;
  tax?: string | null;
  paidBy: PaymentMethod;
  paidAmount: string;
  transactionNo?: string | null;
}

/** One sellable line of a store's stock, as the counter's item grid sees it. */
export interface StoreItem {
  itemStoreMapId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  genericName?: string | null;
  salePrice: string;
  /** On hand in base units. Divide by `conversionFactor` for sale units. */
  totalQty: number;
  /** Base units per sale unit — tablets per box. */
  conversionFactor: number;
  /** The unit totalQty is counted in. */
  baseUom?: string | null;
  /** The unit salePrice is quoted in, and the one a sale line is keyed in. */
  saleUom?: string | null;
  /**
   * The other units this item may be sold in, each with its own price — a loose
   * tablet where the item is normally sold by the box. The sale unit itself is
   * not among them; it is `salePrice` and `saleUom` above.
   */
  units?: StoreItemUnit[];
}

/** One alternative unit a sale line may be keyed in. */
export interface StoreItemUnit {
  uomId: number;
  name: string;
  /** Base units in one of it, for turning the balance into this unit. */
  factorToBase: number;
  salePrice: string;
}

export const counterSaleService = {
  /**
   * Rings up a basket as one paid invoice.
   *
   * `idempotencyKey` is not optional in practice: a counter sale moves stock,
   * and an operator who sees nothing happen presses Charge again. The backend
   * replays the first answer for a repeated key rather than dispensing twice.
   */
  async create(payload: CounterSaleCreatePayload, idempotencyKey: string): Promise<Invoice> {
    try {
      const response = await privateApi.post<ApiResponse<Invoice>>('/counter-sales', payload, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to complete the sale');
    }
  },

  /** The sellable stock in one store — the counter's medicine grid. */
  async getStoreItems(storeId: number, inStockOnly = true): Promise<StoreItem[]> {
    try {
      const response = await privateApi.get<ApiResponse<StoreItem[]>>(
        `/dropdown/stores/${storeId}/items`,
        { params: { inStockOnly: inStockOnly ? 'true' : undefined } }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the store catalogue');
    }
  }
};

/**
 * Dispensing. Quantities are in the item's sale unit — the backend converts to
 * base units and picks the batches itself (soonest expiry first), so the client
 * never names a batch or a price.
 */
export interface PharmacySaleLinePayload {
  itemId: number;
  qty: number;
  percentageDiscount?: number | null;
  amountDiscount?: string | null;
  orderRemarks?: string | null;
}

export interface PharmacySaleCreatePayload {
  patientId: number;
  storeId: number;
  visitId?: number | null;
  /** The prescribing doctor, when there is one. */
  employeeId?: number | null;
  lines: PharmacySaleLinePayload[];
  percentageDiscount?: number | null;
  amountDiscount?: string | null;
  tax?: string | null;
  paidBy: PaymentMethod;
  paidAmount: string;
  transactionNo?: string | null;
}

export const pharmacySaleService = {
  ...createResourceService<PharmacySale, PharmacySaleCreatePayload>(
    '/pharmacy/sales',
    'pharmacy sale'
  ),

  async pay(id: number | string, payload: InvoicePayPayload): Promise<PharmacySale> {
    try {
      const response = await privateApi.post<ApiResponse<PharmacySale>>(
        `/pharmacy/sales/${id}/pay`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to record payment');
    }
  },

  /** Voids the sale and puts the medicine back into the batches it left. */
  async cancel(id: number | string, reasons?: string | null): Promise<void> {
    try {
      await privateApi.post(`/pharmacy/sales/${id}/cancel`, { reasons: reasons ?? null });
    } catch (error) {
      throw toApiError(error, 'Failed to cancel sale');
    }
  }
};

/** One line being given back. Exactly one id is set, matching the API. */
export interface RefundLinePayload {
  invoiceDetailId?: number;
  pharmacySaleDetailId?: number;
  refundQty: number;
}

export interface RefundInvoiceCreatePayload {
  invoiceId: number;
  paidBy: PaymentMethod;
  transactionNo?: string | null;
  refundRemarks?: string | null;
  lines: RefundLinePayload[];
}

export const refundInvoiceService = {
  ...createResourceService<RefundInvoice, RefundInvoiceCreatePayload>(
    '/refund-invoices',
    'refund'
  ),

  /** What is still refundable on an invoice, and how much of each is left. */
  async getRefundableLines(invoiceId: number | string): Promise<RefundableLine[]> {
    try {
      const response = await privateApi.get<ApiResponse<RefundableLine[]>>(
        `/invoices/${invoiceId}/refundable-lines`
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch refundable charges');
    }
  }
};

export interface ReturnPharmacyLinePayload {
  pharmacySaleDetailId: number;
  returnQty: number;
}

export interface ReturnPharmacySaleCreatePayload {
  patientId: number;
  returnReasonId: number;
  /** Capitalised on this endpoint only — see ReturnPaymentMethod. */
  paidBy: ReturnPaymentMethod;
  transactionNo?: string | null;
  returnPharmacySaleDetails: ReturnPharmacyLinePayload[];
}

export const returnPharmacySaleService = {
  ...createResourceService<ReturnPharmacySale, ReturnPharmacySaleCreatePayload>(
    '/pharmacy/returns',
    'return'
  ),

  /** What a patient still has outstanding against dispensed medicine. */
  async getReturnableLines(patientId: number): Promise<ReturnableLine[]> {
    try {
      const response = await privateApi.get<ApiResponse<ReturnableLine[]>>(
        '/pharmacy/returns/returnable-lines',
        { params: { patientId } }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch returnable medicine');
    }
  }
};

/**
 * Receiving goods. Totals are computed by the backend from the lines — a
 * client-supplied subtotal is ignored, so what is shown here is a quote.
 */
export interface GRNBatchPayload {
  batchNo: string;
  batchDate?: string | null;
  expiryDate?: string | null;
  /** In the purchase unit, like the line it belongs to. */
  qty: number;
}

export interface GRNLinePayload {
  itemId: number;
  storeId: number;
  /**
   * The unit `qty` and `itemPrice` are in, chosen from the item's units.
   * Omitting it means the item's sale unit, which is how every note written
   * before item units existed is read.
   */
  uomId?: number | null;
  qty: number;
  itemPrice: string;
  amountDiscount?: string | null;
  itemBatches?: GRNBatchPayload[];
}

export interface GRNCreatePayload {
  vendorId: number;
  grnCategoryId: number;
  invoiceNo: string;
  invoiceDate: string;
  amountDiscount?: string | null;
  tax?: string | null;
  grnItems: GRNLinePayload[];
}

export interface GRNReturnPayload {
  itemBatchId?: number | null;
  qty: number;
}

export const grnService = {
  ...createResourceService<GRN, GRNCreatePayload>('/procurement/grns', 'goods received note'),

  /** Sends part of a received line back to the vendor, taking the stock out. */
  async returnItem(grnItemId: number, payload: GRNReturnPayload): Promise<void> {
    try {
      await privateApi.post(`/procurement/grn-items/${grnItemId}/return`, payload);
    } catch (error) {
      throw toApiError(error, 'Failed to return the line');
    }
  },

  /** Voids a received line outright. Refused once its stock has moved. */
  async cancelItem(grnItemId: number): Promise<void> {
    try {
      await privateApi.post(`/procurement/grn-items/${grnItemId}/cancel`);
    } catch (error) {
      throw toApiError(error, 'Failed to cancel the line');
    }
  }
};

/**
 * Stock documents.
 *
 * Each is create-and-read only: there is no update or delete, because a stock
 * movement that happened is corrected with another document rather than by
 * rewriting history. The generic client's update/remove are simply unused.
 */
export interface StockIssueLinePayload {
  itemStoreMapId: number;
  /** Naming a batch is optional; left out, the backend picks FEFO. */
  itemBatchId?: number | null;
  qty: number;
  itemPrice?: string | null;
  remarks?: string | null;
}

export interface StockDamageCreatePayload {
  damageDate: string;
  remarks?: string | null;
  stockDamageItems: StockIssueLinePayload[];
}

export interface StockConsumptionCreatePayload {
  consumptionDate: string;
  remarks?: string | null;
  stockConsumptionItems: StockIssueLinePayload[];
}

export interface StockAdjustmentLinePayload {
  itemStoreMapId: number;
  itemBatchId?: number | null;
  /** What was counted. The backend works out the delta from what it held. */
  groundQty: number;
  itemPrice?: string | null;
  remarks?: string | null;
}

export interface StockAdjustmentCreatePayload {
  adjustmentDate: string;
  remarks?: string | null;
  stockAdjustmentItems: StockAdjustmentLinePayload[];
}

export interface StockTransferLinePayload {
  stockItemStoreMapId: number;
  transferStoreId: number;
  stockItemBatchId?: number | null;
  transferQty: number;
  remarks?: string | null;
}

export interface StockTransferCreatePayload {
  transferDate: string;
  remarks?: string | null;
  stockTransferItems: StockTransferLinePayload[];
}

export interface StockOpenBatchPayload {
  batchNo: string;
  batchDate?: string | null;
  expiryDate?: string | null;
  qty: number;
}

export interface StockOpenLinePayload {
  itemId: number;
  storeId: number;
  qty: number;
  itemPrice?: string | null;
  remarks?: string | null;
  itemBatches?: StockOpenBatchPayload[];
}

export interface StockOpenCreatePayload {
  openingDate: string;
  remarks?: string | null;
  stockOpenItems: StockOpenLinePayload[];
}

export const stockOpenService = createResourceService<StockOpen, StockOpenCreatePayload>(
  '/inventories/stock-opens',
  'opening balance'
);

export const stockDamageService = createResourceService<StockDamage, StockDamageCreatePayload>(
  '/inventories/stock-damages',
  'damage note'
);

export const stockConsumptionService = createResourceService<
  StockConsumption,
  StockConsumptionCreatePayload
>('/inventories/stock-consumptions', 'consumption note');

export const stockAdjustmentService = createResourceService<
  StockAdjustment,
  StockAdjustmentCreatePayload
>('/inventories/stock-adjustments', 'stock adjustment');

export const stockTransferService = createResourceService<
  StockTransfer,
  StockTransferCreatePayload
>('/inventories/stock-transfers', 'stock transfer');

/** The configured rate: which consultant earns what for which service. */
export const consultantServiceFeeService = createResourceService<ConsultantServiceFee>(
  '/administration/consultant-service-fees',
  'consultant fee'
);

export interface ConsultantFeeFilters extends DateRangeParams {
  employeeId?: number | string;
  patientId?: number | string;
  invoiceId?: number | string;
}

export const consultantFeeService = {
  /** Earnings per consultant over a period — the payroll figure. */
  async getSummary(filters: ConsultantFeeFilters = {}): Promise<ConsultantEarnings[]> {
    try {
      const response = await privateApi.get<ApiResponse<ConsultantEarnings[]>>(
        '/consultant-fees/summary',
        { params: filters }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch consultant earnings');
    }
  }
};

/**
 * The lookup tables everything else hangs off — vendor types, UOMs, admission
 * types, GRN categories, return reasons. Entities live under `/entities`, not
 * under `/administration`, matching the legacy URL space.
 */
export const categoryService = createResourceService<Category>(
  '/administration/categories',
  'category'
);

export const entityService = createResourceService<Entity>('/entities', 'option');

export const permissionService = {
  /** Every protected action, grouped by model — the role editor's tree. */
  async listModules(): Promise<PermissionModel[]> {
    try {
      const response = await privateApi.get<ApiResponse<PermissionModel[]>>('/permissions/modules');
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch modules');
    }
  }
};

/**
 * Users need a distinct create payload: the password is write-only, so it is
 * absent from the User type but required when creating one.
 */
export interface UserCreatePayload {
  username: string;
  password: string;
  role: User['role'];
  isActive?: boolean;
  isSuperUser?: boolean;
  remarks?: string | null;
}

export interface UserUpdatePayload extends Partial<Omit<UserCreatePayload, 'password'>> {
  password?: string;
}

export const userService = {
  ...createResourceService<User, UserCreatePayload, UserUpdatePayload>(
    '/administration/users',
    'user'
  ),

  /** Enables or disables an account — also how a locked-out user is restored. */
  async setActive(id: number, isActive: boolean): Promise<void> {
    try {
      await privateApi.patch(`/administration/users/${id}/active`, { isActive });
    } catch (error) {
      throw toApiError(error, 'Failed to update user status');
    }
  }
};

/** One batch sitting in a store, as the batch picker sees it. */
export interface ItemBatchOption {
  id: number;
  batchNo: string;
  expiryDate?: string | null;
  /** What is left of this batch now. */
  batchQty: number;
  /** What was originally received into it. */
  qty: number;
  /**
   * Past its expiry date. Expired batches are still listed, because a damage
   * note and a stock count both have to reach them — a batch that vanished
   * from the picker is a batch nobody can write off. Screens that issue stock
   * should show it as unavailable; the backend refuses to dispense one either
   * way.
   */
  isExpired: boolean;
}

/**
 * One delivery of one item, as a recall sees it.
 *
 * A lot sits in as many `item_batch` rows as there are stores holding it, and
 * what joins them is the document it arrived on — not the batch number, which
 * two vendors can reuse. `tracedBy` says which key the backend was able to use,
 * so a lot that fell back to the batch number is visibly less certain.
 */
export interface LotIdentity {
  itemId: number;
  itemCode: string;
  itemName: string;
  batchNo: string;
  batchDate?: string | null;
  expiryDate?: string | null;
  sourceDocument?: string;
  vendorName?: string;
  tracedBy: 'goods received note' | 'opening stock document' | 'batch number';
  batchIds: number[];
}

export interface LotPosition {
  itemBatchId: number;
  itemStoreMapId: number;
  storeId: number;
  storeName: string;
  receivedQty: number;
  onHandQty: number;
}

/** A patient who was given medicine from the lot and still has it. */
export interface LotRecipient {
  pharmacySaleDetailId: number;
  pharmacySaleNo?: string | null;
  invoiceNo?: string | null;
  orderDate: string;
  orderStatus: string;
  patientId?: number | null;
  patientName: string;
  phoneNo: string;
  qty: number;
  storeName: string;
}

export interface LotTrace {
  lot: LotIdentity;
  totalOnHand: number;
  totalDispensed: number;
  positions: LotPosition[];
  recipients: LotRecipient[];
}

export const lotService = {
  /**
   * Traces the lot a batch belongs to: every store still holding it, and every
   * patient who was dispensed some. Keyed off any one batch of the lot, because
   * that is what the user has on screen.
   */
  async trace(itemBatchId: number | string): Promise<LotTrace> {
    try {
      const response = await privateApi.get<ApiResponse<LotTrace>>(
        `/inventories/lots/${itemBatchId}/trace`
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to trace the lot');
    }
  }
};

export const inventoryService = {
  /**
   * Batches with stock left in one item/store row, soonest expiry first.
   * A stock count works batch by batch, which is why it needs this.
   */
  async getBatches(itemStoreMapId: number): Promise<ItemBatchOption[]> {
    try {
      const response = await privateApi.get<ItemBatchOption[]>('/dropdown/item-batches', {
        params: { itemStoreMapId }
      });
      return response.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch batches');
    }
  },

  async getStockBalance(
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<PaginatedResponse<StockBalanceRow>> {
    try {
      const response = await privateApi.get<PaginatedResponse<StockBalanceRow>>(
        '/inventories/stock-balance',
        { params }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch stock balance');
    }
  },

  /**
   * The batches behind one stock balance row, in the order the store's issue
   * policy would draw them down.
   */
  async getBatchBreakdown(
    itemStoreMapId: number,
    includeEmpty = false
  ): Promise<StockBatchBreakdown> {
    try {
      const response = await privateApi.get<ApiResponse<StockBatchBreakdown>>(
        `/inventories/item-store-maps/${itemStoreMapId}/batches`,
        { params: includeEmpty ? { includeEmpty: 'true' } : {} }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch batches');
    }
  },

  /**
   * One item's stock card: the balance it opened the period with, every
   * movement since, and the balance after each of them.
   *
   * Paginated, and the page carries the balance it opens from — so page two
   * continues the column rather than restarting it. `itemId` is required;
   * everything else narrows the report.
   */
  async getStockLedger(params: {
    itemId: number | string;
    storeId?: number | string;
    fromDate?: string;
    toDate?: string;
    referenceType?: string;
    transitionType?: string;
    page?: number;
    limit?: number;
  }): Promise<StockLedgerReport> {
    try {
      const response = await privateApi.get<ApiResponse<StockLedgerReport>>(
        '/inventories/stock-ledgers',
        { params }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the stock ledger');
    }
  },

  async getExpiryAlerts(
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<PaginatedResponse<ExpiringBatch>> {
    try {
      const response = await privateApi.get<PaginatedResponse<ExpiringBatch>>(
        '/administration/items/expiry-alerts',
        { params }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch expiry alerts');
    }
  },

  async getExpiryAlertCounts(): Promise<ExpiryAlertCounts> {
    try {
      const response = await privateApi.get<ApiResponse<ExpiryAlertCounts>>(
        '/administration/items/expiry-alerts/count'
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch expiry alert counts');
    }
  }
};

/**
 * Inventory settings: the batch issue policy and the expiry windows.
 *
 * Both writes return the whole settings payload, so the screen re-renders from
 * what the server actually stored rather than from what it hoped it sent.
 */
export const settingsService = {
  async getInventory(): Promise<InventorySettings> {
    try {
      const response = await privateApi.get<ApiResponse<InventorySettings>>('/settings/inventory');
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch inventory settings');
    }
  },

  async updateInventory(payload: {
    issuePolicy?: IssuePolicy;
    expiryAlertDays?: number;
    expiryCriticalDays?: number;
  }): Promise<InventorySettings> {
    try {
      const response = await privateApi.put<ApiResponse<InventorySettings>>(
        '/settings/inventory',
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to update inventory settings');
    }
  },

  /** Null clears the override and returns the store to the system default. */
  async updateStorePolicy(storeId: number, issuePolicy: IssuePolicy | null): Promise<void> {
    try {
      await privateApi.put(`/settings/inventory/stores/${storeId}/issue-policy`, { issuePolicy });
    } catch (error) {
      throw toApiError(error, 'Failed to update the store issue policy');
    }
  },

  /**
   * Which fields patient and employee registration insist on.
   *
   * Readable by anyone signed in — the two forms have to know what to mark and
   * refuse before they can be filled in — while the write below needs the
   * settings privilege.
   */
  async getRequiredFields(): Promise<RequiredFieldSettings> {
    try {
      const response =
        await privateApi.get<ApiResponse<RequiredFieldSettings>>('/settings/required-fields');
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the required field settings');
    }
  },

  /**
   * Replaces one form's rules with the set given: a field the form has and this
   * list omits goes back to optional, so the screen saves what it shows.
   */
  async updateRequiredFields(
    form: RegistrationForm,
    fields: string[]
  ): Promise<RequiredFieldSettings> {
    try {
      const response = await privateApi.put<ApiResponse<RequiredFieldSettings>>(
        `/settings/required-fields/${form}`,
        { fields }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to update the required field settings');
    }
  }
};


/** Both chart endpoints take the same inclusive "YYYY-MM-DD" range. */
export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}

export const dashboardService = {
  async getMainCounts(): Promise<DashboardCounts> {
    try {
      const response = await privateApi.get<ApiResponse<DashboardCounts>>(
        '/dashboard/main-dashboard/count'
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch dashboard counts');
    }
  },

  async getInventoryCounts(): Promise<InventoryCounts> {
    try {
      const response = await privateApi.get<ApiResponse<InventoryCounts>>(
        '/dashboard/inventory-dashboard/count'
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch inventory counts');
    }
  },

  async getRevenueChart(params: DateRangeParams = {}): Promise<RevenuePoint[]> {
    try {
      const response = await privateApi.get<ApiResponse<RevenuePoint[]>>(
        '/dashboard/chart/invoice',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the revenue chart');
    }
  },

  async getPharmacySaleChart(params: DateRangeParams = {}): Promise<PharmacySalePoint[]> {
    try {
      const response = await privateApi.get<ApiResponse<PharmacySalePoint[]>>(
        '/dashboard/chart/pharmacy-sale',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the pharmacy chart');
    }
  },

  async getPatientGenderChart(params: DateRangeParams = {}): Promise<GenderCount[]> {
    try {
      const response = await privateApi.get<ApiResponse<GenderCount[]>>(
        '/dashboard/chart/patient',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the registrations chart');
    }
  }
};

/** The profitability screen's range, plus how the trend is bucketed. */
export interface ProfitTrendParams extends DateRangeParams {
  groupBy?: 'day' | 'week' | 'month';
}

/**
 * The owner's view: what was earned, what it cost, and what was left.
 *
 * Every call takes the same range so the summary, the trend and the two
 * breakdowns under it always describe one period. The page passes one filter
 * state to all of them for exactly that reason.
 */
export const managementService = {
  async getProfitSummary(params: DateRangeParams = {}): Promise<ProfitSummaryResponse> {
    try {
      const response = await privateApi.get<ApiResponse<ProfitSummaryResponse>>(
        '/management/profit/summary',
        { params }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the profit summary');
    }
  },

  async getProfitTrend(params: ProfitTrendParams = {}): Promise<ProfitTrendPoint[]> {
    try {
      const response = await privateApi.get<ApiResponse<ProfitTrendPoint[]>>(
        '/management/profit/trend',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the profit trend');
    }
  },

  async getRevenueSources(params: DateRangeParams = {}): Promise<RevenueSource[]> {
    try {
      const response = await privateApi.get<ApiResponse<RevenueSource[]>>(
        '/management/profit/sources',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the revenue breakdown');
    }
  },

  async getTopItems(params: DateRangeParams & { limit?: number } = {}): Promise<ItemProfit[]> {
    try {
      const response = await privateApi.get<ApiResponse<ItemProfit[]>>(
        '/management/profit/top-items',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the top medicines');
    }
  },

  async getPaymentMix(params: DateRangeParams = {}): Promise<PaymentMethodTotal[]> {
    try {
      const response = await privateApi.get<ApiResponse<PaymentMethodTotal[]>>(
        '/management/profit/payment-mix',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the payment breakdown');
    }
  }
};

/**
 * Where the money is when it is not in the bank.
 *
 * The valuation endpoints take no range — stock at cost is what is on the shelf
 * now, and there is no "as of last month" to ask for. Only the two flow
 * endpoints and the summary's flow half read the period.
 */
export const workingCapitalService = {
  async getCapitalSummary(
    params: DateRangeParams & { deadDays?: number } = {}
  ): Promise<CapitalSummary> {
    try {
      const response = await privateApi.get<ApiResponse<CapitalSummary>>(
        '/management/inventory/summary',
        { params }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the working capital summary');
    }
  },

  async getCapitalByStore(): Promise<StoreCapital[]> {
    try {
      const response = await privateApi.get<ApiResponse<StoreCapital[]>>(
        '/management/inventory/by-store'
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch capital by store');
    }
  },

  async getDeadStock(params: { days?: number; limit?: number } = {}): Promise<DeadStockRow[]> {
    try {
      const response = await privateApi.get<ApiResponse<DeadStockRow[]>>(
        '/management/inventory/dead-stock',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch dead stock');
    }
  },

  async getExpiryExposure(): Promise<ExpiryBucket[]> {
    try {
      const response = await privateApi.get<ApiResponse<ExpiryBucket[]>>(
        '/management/inventory/expiry-exposure'
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch expiry exposure');
    }
  },

  async getMovementTrend(params: ProfitTrendParams = {}): Promise<MovementPoint[]> {
    try {
      const response = await privateApi.get<ApiResponse<MovementPoint[]>>(
        '/management/inventory/movement-trend',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the movement trend');
    }
  },

  async getVendorSpend(params: DateRangeParams & { limit?: number } = {}): Promise<VendorSpend[]> {
    try {
      const response = await privateApi.get<ApiResponse<VendorSpend[]>>(
        '/management/inventory/vendor-spend',
        { params }
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch vendor spend');
    }
  }
};
