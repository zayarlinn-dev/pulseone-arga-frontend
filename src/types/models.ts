import type { AuditFields } from './api';

/**
 * Domain types mirroring the Go models' JSON output.
 *
 * Optional fields are optional here for the same reason they are pointers on
 * the backend: the column is nullable, and omitting one from an update payload
 * means "leave it alone".
 */

export interface Department extends AuditFields {
  id: number;
  departmentCode: string;
  departmentName: string;
  description?: string | null;
  departmentType: 'clinical' | 'non-clinical';
}

export interface ServiceCenter extends AuditFields {
  id: number;
  serviceCenterCode: string;
  serviceCenterName: string;
  serviceCenterLocation?: string | null;
  isActive?: boolean;
  priority?: 'primary' | 'emergency' | null;
  description?: string | null;
  departmentId: number;
  serviceCenterTypeId: number;
  department?: Department;
  serviceCenterType?: Entity;
}

export type EmploymentCategory = 'doctor' | 'nurse' | 'general';
export type Gender = 'male' | 'female' | 'others';

export interface Employee extends AuditFields {
  id: number;
  employeeNo: string;
  fullName: string;
  shortName?: string | null;
  fatherName?: string | null;
  employmentCategory: EmploymentCategory;
  isActive?: boolean;
  employmentStatus?: 'permanent' | 'temporary' | 'internship' | null;
  dob?: string | null;
  age?: number | null;
  gender: Gender;
  maritalStatus?: 'single' | 'married' | 'divorced' | null;
  qualification?: string | null;
  phoneNo?: string | null;
  email?: string | null;
  stateNumber?: string | null;
  nrcType?: string | null;
  nrcNo?: string | null;
  address?: string | null;
  departmentId: number;
  districtId?: number | null;
  townshipId?: number | null;
  stateId?: number | null;
  department?: Department;
  employeeImageUrl?: string | null;
}

export interface Store extends AuditFields {
  id: number;
  storeCode: string;
  storeName: string;
  storeDescription?: string | null;
  isActive?: boolean;
  storeType: 'medical' | 'general';
  isDefaultStore: boolean;
  isMainStore: boolean;
}

/**
 * The generic lookup dimension: "UOM", "Vendor Type", "Admission Type", …
 *
 * Neither Category nor Entity carries timestamps — both tables were created
 * with Sequelize's `timestamps: false`, so there is no createdAt to sort or
 * display. Do not add one to these types without a migration behind it.
 */
export interface Category {
  id: number;
  categoryName: string;
  entities?: Entity[];
}

/** One option inside a Category. `selected` marks the default choice. */
export interface Entity {
  id: number;
  entityName: string;
  sort?: number;
  selected: boolean;
  categoryId: number;
  category?: Category;
}

export interface Item extends AuditFields {
  id: number;
  itemCode: string;
  itemName: string;
  genericName?: string | null;
  itemDescription?: string | null;
  salePrice: string;
  isActive?: boolean;
  isManual?: boolean;
  conversionFactor: number;
  itemCategoryId: number;
  baseUomId: number;
  saleUomId: number;
  itemCategory?: Entity;
  baseUom?: Entity;
  saleUom?: Entity;
  displayName?: string;
}

/**
 * One unit an item may be keyed in, and what it is worth in base units.
 *
 * `conversionFactor` on the item can only describe two units; this describes as
 * many as the item has — the carton it is bought in as well as the box it is
 * sold in. A document line records which one it used and freezes the factor, so
 * adding a unit later never changes what an older document says.
 */
export interface ItemUOM {
  id: number;
  itemId: number;
  uomId: number;
  /** Base units in one of this unit: a box of ten tablets is 10. */
  factorToBase: number;
  /** The unit a goods received note offers first. At most one per item. */
  isPurchaseDefault: boolean;
  /**
   * What one of this unit sells for. Null means the unit is bought or counted
   * in but not sold in — a carton — and the sale screens do not offer it. It is
   * never derived from the factor: ten loose tablets are not priced as a tenth
   * of a box each.
   *
   * The item's own sale unit ignores this and uses `item.salePrice`.
   */
  salePrice?: string | null;
  uom?: Entity;
}

export interface Vendor extends AuditFields {
  id: number;
  vendorCode: string;
  vendorName: string;
  billingAddress?: string | null;
  contactNo?: string | null;
  vendorCurrency?: 'mmk' | 'usd' | 'sgd' | 'baht' | null;
  isActive?: boolean;
  remarks?: string | null;
  vendorTypeId: number;
  vendorType?: Entity;
}

export interface Room extends AuditFields {
  id: number;
  roomCode: string;
  roomName: string;
  roomType: 'general' | 'private' | 'icu' | 'deluxe' | 'semi-private' | 'isolation';
  totalBeds: number;
  floor?: string | null;
  description?: string | null;
  isActive?: boolean;
  roomStatus: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
}

/**
 * One room on the ward board, with whoever is in it right now.
 *
 * `occupants` is a list because the board draws a bed per bed the room has; an
 * admission claims the whole room today, so in practice it holds nought or one.
 */
export interface RoomBoardEntry extends Room {
  occupants: CheckIn[];
}

export interface Service extends AuditFields {
  id: number;
  serviceCode: string;
  serviceName: string;
  isActive?: boolean;
  cptDescription?: string | null;
  specialInstruction?: string | null;
  servicePrice: string;
  serviceCategoryId: number;
  serviceCenterId?: number | null;
  serviceCategory?: Entity;
  serviceCenter?: ServiceCenter;
}

export interface Visit extends AuditFields {
  id: number;
  visitCode: string;
  isActive?: boolean;
  patientId: number;
  patient?: Patient;
}

/** Prefix the backend allocates the visit code from. */
export type VisitType = 'OP' | 'ER' | 'IP';

export type RegistrationCategory = 'walk-in' | 'emergency' | 'new-born';
export type MaritalStatus = 'single' | 'married' | 'divorced';
export type IdentityType = 'nrc' | 'passport' | 'driving-licence';

/** NRC prefixes. The column is an enum of "1".."14", not a number. */
export type NrcStateNumber =
  | '1' | '2' | '3' | '4' | '5' | '6' | '7'
  | '8' | '9' | '10' | '11' | '12' | '13' | '14';

/** NRC citizenship marker: Naing, Ay/Naing, Pyu, Yay, Sa, Thwe. */
export type NrcType = 'N' | 'A' | 'P' | 'Y' | 'S' | 'T';

export type EmergencyContactRelationship =
  | 'father' | 'mother' | 'husband' | 'wife'
  | 'sister' | 'brother' | 'partner' | 'relative';

export interface Patient extends AuditFields {
  id: number;
  patientNo: string;
  vip?: boolean;
  patientName: string;
  gender: Gender;
  fatherName?: string | null;
  dob?: string | null;
  age?: number | null;
  maritalStatus?: MaritalStatus | null;
  phoneNo?: string | null;
  secondaryPhoneNo?: string | null;
  address?: string | null;

  emergencyContactName?: string | null;
  emergencyContactGender?: Gender | null;
  emergencyContactRelationship?: EmergencyContactRelationship | null;
  emergencyContactAddress?: string | null;
  emergencyContactPhoneNo?: string | null;
  emergencyContactSecondaryPhoneNo?: string | null;
  emergencyContactStateId?: number | null;
  emergencyContactTownshipId?: number | null;

  identityType?: IdentityType | null;
  stateNumber?: NrcStateNumber | null;
  nrcType?: NrcType | null;
  nrcNo?: string | null;

  /** Where the patient was referred from, and to whom. */
  refHospital?: string | null;
  refDoctor?: string | null;
  refHospitalPatientNo?: string | null;
  refVoucher?: string | null;
  refStaff?: string | null;
  refOther?: string | null;
  refToConsultantId?: number | null;
  refToStaffId?: number | null;

  registrationCategory: RegistrationCategory;
  townshipId?: number | null;
  stateId?: number | null;
  /** NRC district ("OuKaMa"), not the postal address. */
  districtId?: number | null;
  visitId?: number | null;
  visit?: Visit;
  patientImageUrl?: string | null;
}

export interface CheckIn extends AuditFields {
  id: number;
  admissionNo: string;
  checkInDate: string;
  checkOutDate?: string | null;
  status: 'admitted' | 'discharged' | 'transferred';
  remarks?: string | null;
  admissionReason?: string | null;
  dischargeReason?: string | null;
  isActive?: boolean;
  patientId: number;
  roomId: number;
  admissionTypeId: number;
  attendingDoctorId?: number | null;
  visitId?: number | null;
  patient?: Patient;
  room?: Room;
  admissionType?: Entity;
  attendingDoctor?: Employee;
}

/** One line of the patient's visit history, with what that visit cost. */
export interface PatientSummaryVisit {
  id: number;
  visitCode: string;
  visitDate?: string | null;
  isActive: boolean;
  serviceCount: number;
  billedAmount: string;
}

/** A service performed during a visit. */
export interface PatientSummaryService {
  serviceName: string;
  qty: number;
  orderDate?: string | null;
  orderStatus: OrderStatus;
  totalAmount: string;
  doctorName?: string | null;
}

/** A medicine dispensed during a visit. */
export interface PatientSummaryMedicine {
  itemName: string;
  qty: number;
  orderDate?: string | null;
  orderStatus: OrderStatus;
}

/** The patient's most recent inpatient stay. */
export interface PatientSummaryAdmission {
  id: number;
  admissionNo: string;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  status: 'admitted' | 'discharged' | 'transferred';
  roomName?: string | null;
  admissionReason?: string | null;
  dischargeReason?: string | null;
  doctorName?: string | null;
}

/**
 * The history panel shown the moment a patient is picked: how often they have
 * been here, what happened last time, and what they still owe.
 */
export interface PatientSummary {
  visitCount: number;
  firstVisitDate?: string | null;
  lastVisitDate?: string | null;
  daysSinceLastVisit?: number | null;
  admissionCount: number;
  isAdmitted: boolean;
  invoiceCount: number;
  totalBilled: string;
  outstandingAmount: string;
  unbilledLineCount: number;

  lastVisit?: PatientSummaryVisit | null;
  lastVisitServices: PatientSummaryService[];
  lastVisitMedicines: PatientSummaryMedicine[];
  lastAdmission?: PatientSummaryAdmission | null;
  recentVisits: PatientSummaryVisit[];
}

export type UserRole = 'admin' | 'billing' | 'store' | 'nurse';

export interface User extends AuditFields {
  id: number;
  username: string;
  isActive: boolean;
  remarks?: string | null;
  isSuperUser?: boolean;
  role: UserRole;
}

export interface Role extends AuditFields {
  id: number;
  roleName: string;
  description?: string | null;
  modules?: Module[];
}

export interface Module {
  id: number;
  moduleName: string;
  modulePrivilege: string;
  method: string;
  modelId: number;
}

/**
 * A grouping of modules ("Patient", "Item", …). The role editor renders its
 * permission tree from these, one section per model.
 */
export interface PermissionModel {
  id: number;
  modelName: string;
  modules?: Module[];
}

/**
 * Ordering and billing.
 *
 * The split is worth stating: an InvoiceDetail row is created when a service is
 * *ordered*, with `invoiceId` still null. Billing attaches existing unbilled
 * lines to a new invoice rather than creating lines, so "what does this patient
 * owe?" is the set of details with no invoice yet.
 *
 * Money arrives as a string — the backend's decimal columns are serialised that
 * way so no precision is lost in JavaScript's binary floats.
 */
export type OrderStatus = 'ordered' | 'purchased' | 'cancelled' | 'returned' | 'dispensed';
export type LineStatus = 'ordered' | 'purchased' | 'cancelled' | 'returned';
export type PaymentMethod = 'cash' | 'banking' | 'e-wallet';
export type InvoiceStatus = 'unpaid' | 'paid' | 'cancelled' | 'refunded' | 'pending';

export interface Order extends AuditFields {
  id: number;
  orderNo: string;
  orderDate: string;
  orderStatus: OrderStatus;
  visitId?: number | null;
  patientId: number;
  patient?: Patient;
  visit?: Visit;
  invoiceDetails?: InvoiceDetail[];
}

export interface InvoiceDetail extends AuditFields {
  id: number;
  orderDate: string;
  servicePrice: string;
  qty: number;
  percentageDiscount?: number | null;
  percentageDiscountAmount: string;
  amountDiscount: string;
  totalAmount: string;
  orderRemarks?: string | null;
  orderStatus: LineStatus;
  invoiceId?: number | null;
  orderId?: number | null;
  visitId?: number | null;
  /** The consultant credited with the service; drives their fee when billed. */
  employeeId?: number | null;
  serviceId: number;
  patientId?: number | null;
  service?: Service;
  employee?: Employee;
  order?: Order;
}

export interface Invoice extends AuditFields {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  subTotal: string;
  percentageDiscount?: number | null;
  percentageDiscountAmount: string;
  amountDiscount: string;
  netAmount: string;
  paidAmount: string;
  paidBy: PaymentMethod;
  /** A percentage, applied after discounts. `taxAmount` is the money. */
  tax?: string | null;
  taxAmount?: string | null;
  changeAmount: string;
  invoiceStatus: InvoiceStatus;
  transactionNo?: string | null;
  isCancelRequested: boolean;
  orderId?: number | null;
  patientId?: number | null;
  visitId?: number | null;
  patient?: Patient;
  visit?: Visit;
  order?: Order;
  invoiceDetails?: InvoiceDetail[];
  /** Medicine billed onto this invoice rather than onto a pharmacy sale. */
  pharmacySaleDetails?: PharmacySaleDetail[];
  createdUser?: User;
}

/**
 * Dispensing.
 *
 * A sale line is stored per *batch*, not per item: filling 50 tablets from a
 * nearly-empty batch and then the next one produces two detail rows. That is
 * what makes a recall or a return traceable to the stock it came from, and it
 * is why `qty` here is in the item's base unit rather than the sale unit the
 * counter typed in.
 */
export type IssuedStatus = 'unpaid' | 'paid' | 'cancelled' | 'refunded';

export interface ItemBatch {
  id: number;
  batchNo: string;
  batchQty: number;
  expiryDate?: string | null;
}

export interface PharmacySaleDetail extends AuditFields {
  id: number;
  orderDate: string;
  itemPrice: string;
  qty: number;
  percentageDiscount?: number | null;
  percentageDiscountAmount: string;
  amountDiscount: string;
  totalAmount: string;
  orderStatus: OrderStatus;
  orderRemarks?: string | null;
  pharmacySaleId?: number | null;
  /**
   * Set instead of `pharmacySaleId` when the medicine was billed straight onto
   * an invoice — what a counter sale writes, and what the legacy backend has
   * always written. Exactly one of the two is populated.
   */
  invoiceId?: number | null;
  visitId?: number | null;
  itemStoreMapId: number;
  itemBatchId?: number | null;
  patientId?: number | null;
  itemStoreMap?: { id: number; itemId: number; storeId: number; item?: Item };
  itemBatch?: ItemBatch;
}

export interface PharmacySale extends AuditFields {
  id: number;
  pharmacySaleNo: string;
  issuedStatus: IssuedStatus;
  subTotal: string;
  percentageDiscount?: number | null;
  percentageDiscountAmount: string;
  amountDiscount: string;
  /** The net payable — the pharmacy table's name for it. */
  issuedBalance: string;
  paidAmount: string;
  paidBy: PaymentMethod;
  tax?: string | null;
  taxAmount?: string | null;
  changeAmount: string;
  issuedDate: string;
  transactionNo?: string | null;
  patientId: number;
  employeeId?: number | null;
  visitId?: number | null;
  patient?: Patient;
  employee?: Employee;
  visit?: Visit;
  pharmacySaleDetails?: PharmacySaleDetail[];
  createdUser?: User;
}

/**
 * Giving money back.
 *
 * Two separate documents, because they are two separate counters: a *refund*
 * reverses part of an invoice (services and any medicine billed on it), while a
 * *return* is medicine handed back at the pharmacy counter against the sale
 * itself. Both put stock back and both count against the same sold quantity, so
 * a packet cannot be given back twice through different doors.
 */
export interface RefundableLine {
  /** Exactly one of these is set, matching what the refund endpoint accepts. */
  invoiceDetailId?: number;
  pharmacySaleDetailId?: number;
  kind: 'service' | 'medicine';
  description: string;
  batchNo?: string | null;
  soldQty: number;
  refundedQty: number;
  refundableQty: number;
  totalAmount: string;
}

export interface RefundInvoiceDetailRow {
  id: number;
  refundQty: number;
  refundAmount: string;
  invoiceDetailId: number;
  invoiceDetail?: InvoiceDetail;
}

export interface RefundPharmacyDetailRow {
  id: number;
  refundQty: number;
  refundAmount: string;
  pharmacySaleDetailId: number;
  pharmacySaleDetail?: PharmacySaleDetail;
  itemBatch?: ItemBatch;
  itemStoreMap?: { id: number; itemId: number; item?: Item };
}

export interface RefundInvoice extends AuditFields {
  id: number;
  refundInvoiceNo: string;
  subTotal: string;
  payableAmount: string;
  refundAmount: string;
  paidBy: PaymentMethod;
  transactionNo?: string | null;
  tax?: number | null;
  taxAmount?: string | null;
  invoiceRefundDate?: string | null;
  refundRemarks?: string | null;
  invoiceId: number;
  invoice?: Invoice;
  refundInvoiceDetails?: RefundInvoiceDetailRow[];
  refundPharmacySaleDetails?: RefundPharmacyDetailRow[];
}

export interface ReturnableLine {
  pharmacySaleDetailId: number;
  pharmacySaleNo?: string | null;
  orderDate: string;
  itemCode: string;
  itemName: string;
  batchNo?: string | null;
  soldQty: number;
  returnedQty: number;
  returnableQty: number;
  totalAmount: string;
}

/**
 * Returns use a capitalised payment enum — 'Cash', not 'cash'. That is how the
 * legacy column was defined; it is not a typo, and sending lower case is
 * rejected.
 */
export type ReturnPaymentMethod = 'Cash' | 'Banking' | 'E-Wallet';

export interface ReturnPharmacySaleDetailRow {
  id: number;
  returnQty: number;
  returnAmount: string;
  pharmacySaleDetailId: number;
  pharmacySaleDetail?: PharmacySaleDetail;
  itemBatch?: ItemBatch;
  itemStoreMap?: { id: number; itemId: number; item?: Item };
}

export interface ReturnPharmacySale extends AuditFields {
  id: number;
  subTotal: string;
  paidAmount: string;
  paidBy: ReturnPaymentMethod;
  transactionNo?: string | null;
  returnedDate: string;
  returnReasonId: number;
  patientId: number;
  returnReason?: Entity;
  patient?: Patient;
  returnPharmacySaleDetails?: ReturnPharmacySaleDetailRow[];
}

/**
 * Procurement.
 *
 * A goods-received note is how stock enters the hospital: receiving a line
 * creates the ItemBatch rows that every later sale and transfer draws down.
 * Quantities are entered in the purchase unit and converted to base units
 * before they touch a stock column, exactly as dispensing does in reverse.
 */
export interface GRNItem {
  id: number;
  itemPrice: string;
  qty: number;
  amountDiscount: string;
  subTotal: string;
  isReturned?: boolean;
  isCancelled?: boolean;
  grnId: number;
  storeId: number;
  itemStoreMapId: number;
  /**
   * The unit `qty` and `itemPrice` are in, and what one of it was worth in base
   * units when the note was written. Absent on notes keyed before item units
   * existed, which are read in the item's sale unit.
   */
  uomId?: number | null;
  factorToBase?: number | null;
  uom?: Entity;
  store?: Store;
  itemStoreMap?: { id: number; itemId: number; storeId: number; item?: Item };
  itemBatches?: ItemBatch[];
}

export interface GRN extends AuditFields {
  id: number;
  grnNo: string;
  /** The vendor's own invoice number, not ours. */
  invoiceNo: string;
  invoiceDate: string;
  subTotal: string;
  amountDiscount: string;
  tax?: string | null;
  taxAmount?: string | null;
  netAmount: string;
  vendorId: number;
  grnCategoryId: number;
  vendor?: Vendor;
  grnCategory?: Entity;
  grnItems?: GRNItem[];
  createdUser?: User;
}

/**
 * Stock documents.
 *
 * Five ways stock moves without a patient being involved: an opening balance,
 * a transfer between stores, a write-off, internal consumption, and a stock
 * count correction. None of them is editable once posted — a movement that
 * happened is corrected with another document, not by rewriting it.
 *
 * They all address stock by `itemStoreMapId` (this item, in this store) rather
 * than by item, which is why the line pickers below are built on the stock
 * balance rather than the item catalogue.
 */
interface StockDocumentHeader extends AuditFields {
  id: number;
  remarks?: string | null;
}

export interface StockDocumentLine {
  id: number;
  itemPrice: string;
  subTotal: string;
  remarks?: string | null;
  itemStoreMapId: number;
  itemBatchId?: number | null;
  itemStoreMap?: { id: number; itemId: number; storeId: number; item?: Item; store?: Store };
  itemBatch?: ItemBatch;
}

export interface StockOpenItemRow extends Omit<StockDocumentLine, 'itemBatchId' | 'itemBatch'> {
  qty: number;
  storeId: number;
  store?: Store;
  itemBatches?: ItemBatch[];
}

export interface StockOpen extends StockDocumentHeader {
  openingNo: string;
  openingDate: string;
  stockOpenItems?: StockOpenItemRow[];
}

export interface StockDamageItemRow extends StockDocumentLine {
  damageQty: number;
  onHandQty: number;
}

export interface StockDamage extends StockDocumentHeader {
  damageNo: string;
  damageDate: string;
  stockDamageItems?: StockDamageItemRow[];
}

export interface StockConsumptionItemRow extends StockDocumentLine {
  useQty: number;
  onHandQty: number;
}

export interface StockConsumption extends StockDocumentHeader {
  consumptionNo: string;
  consumptionDate: string;
  stockConsumptionItems?: StockConsumptionItemRow[];
}

export interface StockAdjustmentItemRow extends StockDocumentLine {
  /** What was actually counted on the shelf. */
  groundQty: number;
  /** What the system believed at the time — the difference is the movement. */
  onHandQty: number;
}

export interface StockAdjustment extends StockDocumentHeader {
  adjustmentNo: string;
  adjustmentDate: string;
  stockAdjustmentItems?: StockAdjustmentItemRow[];
}

export interface StockTransferItemRow {
  id: number;
  transferQty: number;
  remarks?: string | null;
  stockItemStoreMapId: number;
  transferItemStoreMapId: number;
  stockItemBatchId?: number | null;
  transferItemBatchId?: number | null;
  stockStoreId?: number | null;
  transferStoreId?: number | null;
  stockItemStoreMap?: { id: number; itemId: number; storeId: number; item?: Item };
  transferItemStoreMap?: { id: number; itemId: number; storeId: number; item?: Item };
  stockItemBatch?: ItemBatch;
  stockStore?: Store;
  transferStore?: Store;
}

export interface StockTransfer extends StockDocumentHeader {
  transferNo: string;
  transferDate: string;
  stockTransferItems?: StockTransferItemRow[];
}

export interface StockBalanceRow {
  itemStoreMapId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  storeId: number;
  storeName: string;
  totalQty: number;
  reorderQty?: number;
  salePrice: string;
  /** What the shelf would fetch if it all sold, at the current sale price. */
  stockValue: string;
  /**
   * What was actually paid for what is still there, summed off the batches.
   * Cost belongs to the delivery, not the item, so two deliveries at two prices
   * contribute their own.
   */
  stockCost: string;
  /**
   * The part of totalQty sitting in batches with no cost recorded — legacy rows
   * and openings keyed without prices. Reported separately so a half-costed
   * store does not read as cheap.
   */
  unvaluedQty: number;
  /**
   * The unit totalQty is counted in, and the one every stock document keys.
   * Optional because an item whose UOM row was deleted still has stock.
   */
  baseUom?: string | null;
  /** The unit sale_price is quoted in, and the one sale screens key. */
  saleUom?: string | null;
  /** Base units per sale unit — tablets per box. */
  conversionFactor: number;
}

/**
 * How automatic batch allocation picks which lot leaves the shelf first.
 *
 * - `fefo` — first expired, first out. The pharmacy default.
 * - `fifo` — first in, first out. The oldest receipt goes first.
 * - `lifo` — last in, first out. The newest receipt goes first.
 *
 * Expiry always wins: a batch carrying an expiry date is issued soonest-first
 * whatever the policy says, so `fifo` and `lifo` order only the batches with no
 * expiry date at all. That makes the setting fully effective in a general store
 * and deliberately inert in a medical one.
 */
export type IssuePolicy = 'fefo' | 'fifo' | 'lifo';

/** Which expiry band a batch falls into. */
export type ExpiryStatus = 'none' | 'expired' | 'critical' | 'warning' | 'ok';

/** One batch behind a stock balance row. */
export interface StockBatch {
  id: number;
  batchNo: string;
  batchDate?: string | null;
  expiryDate?: string | null;
  /** Live remaining quantity, in base units. This is the sellable figure. */
  batchQty: number;
  /** Frozen as-received quantity, kept for audit. Never falls. */
  qty: number;
  costPrice: string;
  /** costPrice x batchQty — what is still on the shelf, at what it cost. */
  stockCost: string;
  /** Null when undated, negative when already past its date. */
  daysToExpiry?: number | null;
  expiryStatus: ExpiryStatus;
  /**
   * Position in the issue queue under the store's policy: 1 is the batch the
   * next automatic allocation draws from. Zero for a batch that cannot be
   * drawn on — empty, or expired.
   */
  issueOrder: number;
}

/** The batch drill-down behind one stock balance row. */
export interface StockBatchBreakdown {
  itemStoreMapId: number;
  itemId: number;
  itemName: string;
  storeId: number;
  storeName: string;
  issuePolicy: IssuePolicy;
  expiryAlertDays: number;
  expiryCriticalDays: number;
  /** The balance as item_store_map records it. */
  recordedQty: number;
  /**
   * The same balance summed off the batches. It should equal recordedQty —
   * that is the invariant the stock design rests on — so both are shown and a
   * mismatch is surfaced rather than hidden.
   */
  batchQtySum: number;
  stockCost: string;
  batches: StockBatch[];
}

/**
 * The document types a stock movement can be caused by, as `item_transition`
 * records them. Every one of them is written by the stock service, so this list
 * is the complete set of ways stock can move.
 */
export type StockReferenceType =
  | 'open'
  | 'grn'
  | 'return_grn'
  | 'transfer'
  | 'invoice'
  | 'refund_invoice'
  | 'pharmacy'
  | 'damage'
  | 'adjustment'
  | 'consumption';

/** Which way the stock went. */
export type TransitionType = 'in' | 'out';

/** One line of the stock ledger, and the balance the item stood at after it. */
export interface StockLedgerMovement {
  id: number;
  transitionDate: string;
  transitionType: TransitionType;
  referenceType: StockReferenceType;
  /** The document number, when the posting recorded one. */
  referenceNo?: string | null;
  storeId: number;
  storeName: string;
  itemBatchId?: number | null;
  batchNo?: string | null;
  expiryDate?: string | null;
  /** Always positive; `transitionType` carries the direction. */
  qty: number;
  /** The same quantity in the column it belongs to, so neither is signed. */
  inQty: number;
  outQty: number;
  /** The balance once this movement had been applied. */
  balance: number;
}

/** How much of the period's movement one kind of document accounts for. */
export interface StockLedgerUsage {
  referenceType: StockReferenceType;
  transitionType: TransitionType;
  movements: number;
  qty: number;
}

/**
 * One item's stock card: what it opened the period holding, every movement
 * since, and what the history says it should be holding now.
 */
export interface StockLedgerReport {
  itemId: number;
  itemCode: string;
  itemName: string;
  baseUom?: string | null;

  /** Absent when the ledger covers every store. */
  storeId?: number | null;
  storeName?: string;

  fromDate?: string;
  toDate?: string;

  /**
   * False once a direction or document-type filter is on. The rows are then a
   * selection rather than a continuous history, so the running balance column
   * is withdrawn instead of showing figures the item never stood at.
   */
  balanceApplicable: boolean;

  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;

  /**
   * The reconciliation. `recordedQty` is what item_store_map says is on the
   * shelf; `ledgerBalance` is the same figure derived from every movement ever
   * posted. They are supposed to be equal, so `drift` is normally zero and a
   * non-zero value means something wrote stock without going through the stock
   * service.
   */
  recordedQty: number;
  ledgerBalance: number;
  drift: number;

  /** Always the whole period, never narrowed by the filters. */
  usage: StockLedgerUsage[];

  page: number;
  pageSize: number;
  total: number;
  totalPages: number;

  /** The balance the first row of this page opens from. */
  pageOpening: number;
  movements: StockLedgerMovement[];
}

/** One at-risk batch on the expiry report. */
export interface ExpiringBatch {
  itemBatchId: number;
  itemStoreMapId: number;
  batchNo: string;
  batchDate?: string | null;
  expiryDate?: string | null;
  qty: number;
  costPrice: string;
  stockCost: string;
  daysToExpiry?: number | null;
  expiryStatus: ExpiryStatus;
  itemId: number;
  itemCode: string;
  itemName: string;
  storeId: number;
  storeName: string;
  baseUom?: string | null;
}

/** The badge numbers for the expiry bell. */
export interface ExpiryAlertCounts {
  count: number;
  expired: number;
  critical: number;
  expiryAlertDays: number;
  expiryCriticalDays: number;
}

/** One store and the policy it runs under. */
export interface StorePolicy {
  storeId: number;
  storeCode: string;
  storeName: string;
  storeType: 'medical' | 'general';
  /** The store's own override, or null when it follows the system default. */
  issuePolicy: IssuePolicy | null;
  /** What actually applies, override or not. */
  effectivePolicy: IssuePolicy;
  isActive?: boolean;
}

/** The inventory settings screen in one payload. */
export interface InventorySettings {
  issuePolicy: IssuePolicy;
  expiryAlertDays: number;
  expiryCriticalDays: number;
  policies: IssuePolicy[];
  stores: StorePolicy[];
}

/** The registration forms whose required fields are configurable. */
export type RegistrationForm = 'patient' | 'employee';

/**
 * What a value looks like on the wire. The forms hold everything as strings, so
 * this matters only to the server's emptiness check — an id of 0 means nothing
 * was chosen, while an age of 0 is a newborn.
 */
export type FieldKind = 'text' | 'enum' | 'date' | 'number' | 'id';

/** One field of a registration form, and whether the desk has to fill it in. */
export interface RequiredFieldSetting {
  key: string;
  section: string;
  kind: FieldKind;
  /**
   * Required by the schema itself, so the switch is shown as on and disabled.
   * "Mandatory because the database says so" and "mandatory because we chose
   * it" look identical at the desk, and are not the same thing to whoever is
   * editing the rules.
   */
  alwaysRequired: boolean;
  required: boolean;
}

export interface RequiredFieldForm {
  form: RegistrationForm;
  fields: RequiredFieldSetting[];
}

/** Both registration forms and everything they may ask for. */
export interface RequiredFieldSettings {
  forms: RequiredFieldForm[];
}

export type FeeType = 'percentage' | 'fixed';

/**
 * The rate a consultant is on for a service — the configuration, not the money.
 * A percentage takes that share of the billed line; a fixed fee is per unit, so
 * three procedures earn three fees.
 */
export interface ConsultantServiceFee extends AuditFields {
  id: number;
  isActive?: boolean;
  feeType: FeeType;
  feeValue: string;
  employeeId: number;
  serviceId: number;
  employee?: Employee;
  service?: Service;
}

/**
 * What a consultant actually earned, frozen at the moment of billing.
 *
 * The rate is copied rather than referenced: revising a consultant's rate in
 * April must not move what they earned on a March invoice. Read-only — these
 * rows are written by the invoice that earned them and removed by the
 * cancellation that voided it.
 */
export interface ConsultantFee extends AuditFields {
  id: number;
  feeType: FeeType;
  feeValue: string;
  feeAmount: string;
  invoiceDetailId: number;
  invoiceId: number;
  employeeId: number;
  serviceId: number;
  patientId?: number | null;
  employee?: Employee;
  service?: Service;
  patient?: Patient;
  invoice?: Invoice;
}

export interface ConsultantEarnings {
  employeeId: number;
  employeeNo: string;
  fullName: string;
  services: number;
  patients: number;
  totalFee: string;
}

export interface InventoryCounts {
  totalItems: number;
  totalStores: number;
  belowReorder: number;
  expiringBatches: number;
  stockValue: string;
}

/**
 * One day's invoiced takings.
 *
 * `date` is a full RFC3339 timestamp at midnight in the server's zone, not a
 * bare date — MySQL's DATE() result is scanned back into a time. Compare and
 * group on its first ten characters rather than the whole string.
 */
export interface RevenuePoint {
  date: string;
  invoiceTotal: string;
  invoiceCount: number;
}

export interface PharmacySalePoint {
  date: string;
  saleTotal: string;
  saleCount: number;
}

export interface GenderCount {
  gender: Gender;
  count: number;
}

export interface DashboardCounts {
  totalPatients: number;
  todayPatients: number;
  activeVisits: number;
  admittedPatients: number;
  todayInvoices: number;
  todayRevenue: string;
}

// ---------------------------------------------------------------------------
// Management — the owner's view of the business
// ---------------------------------------------------------------------------

/**
 * One period's trading result, in the order a profit statement is read down.
 *
 * Every money field is a decimal string, not a number: these are kyat totals
 * that the backend computes with `decimal` precisely so they do not go through
 * a float, and parsing them into one here would give that back.
 *
 * The figures are ACCRUAL — what was billed in the period, collected or not.
 * That is a different question from the dashboard's "what is in the drawer",
 * and the two will disagree whenever an invoice is part-paid. `receivables` is
 * the size of that gap.
 */
export interface ProfitSummary {
  fromDate: string;
  toDate: string;

  serviceRevenue: string;
  medicineRevenue: string;
  grossRevenue: string;

  discounts: string;
  refunds: string;
  returns: string;
  netRevenue: string;

  medicineCost: string;
  consultantFees: string;
  /** Gross, not net: no salaries, rent or tax are recorded in this system. */
  grossProfit: string;
  marginPercent: string;

  invoices: number;
  patients: number;
  averageInvoice: string;
  receivables: string;

  /**
   * Dispensed lines whose batch carries no cost. Their revenue counts and their
   * cost does not, so profit is overstated by however much they cost — the
   * screen says so rather than presenting the inflated margin as fact.
   */
  uncostedLines: number;
}

export interface ProfitSummaryResponse {
  current: ProfitSummary;
  previous: ProfitSummary;
}

/** One bucket of the trend. `bucket` is a bare "YYYY-MM-DD", never a timestamp. */
export interface ProfitTrendPoint {
  bucket: string;
  revenue: string;
  deductions: string;
  cost: string;
  profit: string;
}

export type RevenueSourceKind = 'service-center' | 'pharmacy' | 'unassigned';

/**
 * Where the money came from. `source` is empty for the pharmacy and unassigned
 * rows — they are named from `kind` so the label follows the user's language
 * rather than being fixed in English by the API.
 */
export interface RevenueSource {
  source: string;
  kind: RevenueSourceKind;
  revenue: string;
  cost: string;
  profit: string;
}

/** One medicine's contribution over the period. */
export interface ItemProfit {
  itemId: number;
  itemCode: string;
  itemName: string;
  qty: number;
  revenue: string;
  cost: string;
  profit: string;
  marginPercent: string;
}

/** Collected cash by how it was taken — a cash figure, unlike the rest. */
export interface PaymentMethodTotal {
  method: PaymentMethod;
  amount: string;
  documents: number;
}

// ---------------------------------------------------------------------------
// Working capital — the money sitting on the shelf
// ---------------------------------------------------------------------------

/**
 * Stock valued in money, plus what moved through it over the period.
 *
 * The two halves are different kinds of figure and the screen keeps them apart.
 * The levels are as of now and have no period — "stock at cost over the last 30
 * days" is not a question. The flows belong to the range.
 *
 * Every value is at COST, from `item_batch.cost_price`, because that is the
 * only place a cost exists. `unvaluedQty` is stock whose batch carries no cost
 * and which is therefore missing from all of it.
 */
export interface CapitalSummary {
  stockAtCost: string;
  stockAtRetail: string;
  potentialMargin: string;

  deadStockValue: string;
  deadStockItems: number;
  /** The idle window the figures above were computed on. */
  deadStockDays: number;
  expiredValue: string;
  expiringValue: string;
  /** The expiry window, read from inventory settings — not fixed at 90. */
  expiringDays: number;
  belowReorder: number;
  itemsInStock: number;
  batchesInStock: number;

  unvaluedQty: number;
  unvaluedBatches: number;

  fromDate: string;
  toDate: string;
  receivedCost: string;
  issuedCost: string;
  damagedCost: string;
  consumedCost: string;
  uncostedMovements: number;
}

export interface StoreCapital {
  storeId: number;
  storeName: string;
  storeType: string;
  items: number;
  atCost: string;
  atRetail: string;
}

/** One item whose money has stopped moving. */
export interface DeadStockRow {
  itemId: number;
  itemCode: string;
  itemName: string;
  storeId: number;
  storeName: string;
  qty: number;
  value: string;
  /** Null when none of it has ever been issued — the worst case, not the best. */
  daysIdle: number | null;
}

/** Shelf-life bands, always returned in this order, empty ones included. */
export type ExpiryBucketName = 'expired' | 'days30' | 'days90' | 'days180' | 'beyond' | 'none';

export interface ExpiryBucket {
  bucket: ExpiryBucketName;
  batches: number;
  qty: number;
  value: string;
}

/** Stock value arriving against stock value leaving. `bucket` is a bare date. */
export interface MovementPoint {
  bucket: string;
  in: string;
  out: string;
}

export interface VendorSpend {
  vendorId: number;
  vendorName: string;
  notes: number;
  amount: string;
}
