import type { AuditFields } from './api';
import type { Employee, Item, Patient, Room, ServiceCenter, Service, User, Visit } from './models';

/**
 * Types for the six ERP modules: the audit trail, the approval engine,
 * appointments and the OPD queue, the clinical record, HR and payroll, and the
 * report builder.
 *
 * They live apart from models.ts for the same reason the settings catalogue
 * lives in its own i18n namespace — models.ts is already large, and keeping the
 * ERP surface separate makes it obvious which types belong to the layer added
 * on top of the original hospital system.
 */

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'export'
  | 'view';

/**
 * One line of a diff. `from` and `to` are deliberately `unknown` rather than
 * `string`: the backend preserves types so a null and an empty string stay
 * distinguishable, and flattening them here would throw that away.
 */
export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: string;
  action: AuditAction | string;
  summary?: string | null;
  changes?: FieldChange[] | null;
  userId?: number | null;
  username?: string | null;
  role?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  method?: string | null;
  path?: string | null;
  createdAt: string;
  user?: User;
}

export interface AuditFilterOptions {
  entityTypes: string[];
  actions: string[];
}

export interface AuditActivityRow {
  label: string;
  count: number;
}

export interface AuditSummary {
  total: number;
  byAction: AuditActivityRow[];
  byUser: AuditActivityRow[];
  byEntity: AuditActivityRow[];
  fromDate: string;
  toDate: string;
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalActionVerb = 'submit' | 'approve' | 'reject' | 'cancel' | 'comment';

export interface ApprovalStep {
  id: number;
  workflowId: number;
  stepNo: number;
  stepName: string;
  roleId?: number | null;
  approverUserId?: number | null;
  allowRequester?: boolean;
  role?: { id: number; roleName: string };
  approverUser?: User;
}

export interface ApprovalWorkflow extends AuditFields {
  id: number;
  workflowCode: string;
  workflowName: string;
  documentType: string;
  description?: string | null;
  minAmount: string;
  isActive?: boolean;
  steps?: ApprovalStep[];
}

export interface ApprovalAction {
  id: number;
  requestId: number;
  stepNo: number;
  action: ApprovalActionVerb | string;
  remarks?: string | null;
  actedBy?: number | null;
  actedAt: string;
  username?: string | null;
  actedUser?: User;
}

export interface ApprovalRequest extends AuditFields {
  id: number;
  requestNo: string;
  documentType: string;
  documentId: number;
  documentNo?: string | null;
  workflowId: number;
  currentStepNo: number;
  totalSteps: number;
  status: ApprovalStatus;
  amount: string;
  reason?: string | null;
  /** Whatever the raising module wanted the approver to see. Shape varies. */
  payload?: Record<string, unknown> | null;
  requestedById?: number | null;
  requestedAt: string;
  resolvedAt?: string | null;
  workflow?: ApprovalWorkflow;
  requestedBy?: User;
  actions?: ApprovalAction[];
}

export interface WorkflowStepPayload {
  stepNo: number;
  stepName: string;
  roleId?: number | null;
  approverUserId?: number | null;
  allowRequester: boolean;
}

export interface WorkflowPayload {
  workflowCode: string;
  workflowName: string;
  documentType: string;
  description?: string | null;
  minAmount: string;
  isActive?: boolean;
  steps: WorkflowStepPayload[];
}

// ---------------------------------------------------------------------------
// Appointments and the OPD queue
// ---------------------------------------------------------------------------

export type AppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'arrived'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type AppointmentSource = 'counter' | 'phone' | 'walk-in' | 'online';

export interface DoctorSchedule extends AuditFields {
  id: number;
  employeeId: number;
  serviceCenterId?: number | null;
  /** Go's time.Weekday: 0 is Sunday. */
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacityPerSlot: number;
  validFrom: string;
  validTo?: string | null;
  roomId?: number | null;
  isActive?: boolean;
  employee?: Employee;
  serviceCenter?: ServiceCenter;
  room?: Room;
}

export interface ScheduleException extends AuditFields {
  id: number;
  employeeId: number;
  exceptionDate: string;
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
  slotMinutes?: number | null;
  serviceCenterId?: number | null;
  reason?: string | null;
  employee?: Employee;
}

export interface Slot {
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  available: number;
  roomId?: number;
  serviceCenterId?: number;
}

export interface DayAvailability {
  date: string;
  doctorId: number;
  isAvailable: boolean;
  /** Why the list is empty — no clinic that weekday, or a closed day. */
  reason?: string;
  slots: Slot[];
}

export interface Appointment extends AuditFields {
  id: number;
  appointmentNo: string;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  serviceCenterId?: number | null;
  serviceId?: number | null;
  roomId?: number | null;
  visitId?: number | null;
  reason?: string | null;
  remarks?: string | null;
  cancelledReason?: string | null;
  cancelledAt?: string | null;
  rescheduledToId?: number | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  patient?: Patient;
  doctor?: Employee;
  serviceCenter?: ServiceCenter;
  service?: Service;
  room?: Room;
  visit?: Visit;
  queueToken?: QueueToken;
}

export type QueueStatus =
  | 'waiting'
  | 'called'
  | 'serving'
  | 'completed'
  | 'skipped'
  | 'cancelled';

export interface QueueToken extends AuditFields {
  id: number;
  tokenNo: number;
  tokenLabel: string;
  queueDate: string;
  serviceCenterId: number;
  patientId: number;
  doctorId?: number | null;
  appointmentId?: number | null;
  visitId?: number | null;
  roomId?: number | null;
  status: QueueStatus;
  priority: number;
  issuedAt: string;
  calledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  remarks?: string | null;
  patient?: Patient;
  doctor?: Employee;
  serviceCenter?: ServiceCenter;
  room?: Room;
  appointment?: Appointment;
}

export interface QueueBoard {
  date: string;
  serviceCenterId: number;
  nowServing: QueueToken[];
  waiting: QueueToken[];
  completed: number;
  totalIssued: number;
  averageWaitMinutes: number;
}

// ---------------------------------------------------------------------------
// Clinical record
// ---------------------------------------------------------------------------

export type EncounterStatus = 'draft' | 'finalised' | 'amended';
export type EncounterType = 'opd' | 'ipd' | 'emergency' | 'follow-up';

export interface ClinicalEncounter extends AuditFields {
  id: number;
  encounterNo: string;
  patientId: number;
  visitId?: number | null;
  checkInId?: number | null;
  doctorId: number;
  serviceCenterId?: number | null;
  appointmentId?: number | null;
  encounterDate: string;
  encounterType: EncounterType;
  chiefComplaint?: string | null;
  historyOfIllness?: string | null;
  examination?: string | null;
  assessment?: string | null;
  treatmentPlan?: string | null;
  advice?: string | null;
  followUpDate?: string | null;
  status: EncounterStatus;
  finalisedAt?: string | null;
  finalisedBy?: number | null;
  amendsId?: number | null;
  amendReason?: string | null;
  patient?: Patient;
  doctor?: Employee;
  serviceCenter?: ServiceCenter;
  visit?: Visit;
  finalisedUser?: User;
  diagnoses?: Diagnosis[];
  vitalSigns?: VitalSign[];
  prescriptions?: Prescription[];
}

export interface VitalSign extends AuditFields {
  id: number;
  patientId: number;
  encounterId?: number | null;
  visitId?: number | null;
  checkInId?: number | null;
  recordedAt: string;
  temperatureC?: number | null;
  pulseBpm?: number | null;
  respiratoryRate?: number | null;
  systolicMmHg?: number | null;
  diastolicMmHg?: number | null;
  spO2Percent?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bloodGlucoseMgDl?: number | null;
  painScore?: number | null;
  bmi?: number | null;
  remarks?: string | null;
  recordedBy?: number | null;
  recordedUser?: User;
}

export type AllergyType = 'drug' | 'food' | 'environment' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe';

export interface Allergy extends AuditFields {
  id: number;
  patientId: number;
  allergen: string;
  allergyType: AllergyType;
  reaction?: string | null;
  severity: AllergySeverity;
  status: 'active' | 'inactive';
  itemId?: number | null;
  notedOn?: string | null;
  remarks?: string | null;
  item?: Item;
}

export type HistoryCategory =
  | 'past-medical'
  | 'surgical'
  | 'family'
  | 'social'
  | 'medication'
  | 'obstetric'
  | 'immunisation';

export interface PatientHistory extends AuditFields {
  id: number;
  patientId: number;
  category: HistoryCategory;
  description: string;
  notedOn?: string | null;
  isActive?: boolean;
}

export interface ICDCode {
  id: number;
  code: string;
  description: string;
  category?: string | null;
  isActive?: boolean;
}

export type DiagnosisType =
  | 'primary'
  | 'secondary'
  | 'provisional'
  | 'final'
  | 'differential';

export interface Diagnosis extends AuditFields {
  id: number;
  encounterId: number;
  patientId: number;
  icdCodeId?: number | null;
  code?: string | null;
  description: string;
  diagnosisType: DiagnosisType;
  certainty?: string | null;
  notes?: string | null;
  icdCode?: ICDCode;
}

export type PrescriptionStatus = 'draft' | 'active' | 'dispensed' | 'cancelled';

export interface PrescriptionItem {
  id: number;
  prescriptionId: number;
  itemId?: number | null;
  itemName: string;
  dose?: string | null;
  doseUnit?: string | null;
  frequency?: string | null;
  route?: string | null;
  durationDays?: number | null;
  quantity: number;
  instructions?: string | null;
  isSubstitutionAllowed?: boolean;
  item?: Item;
}

export interface Prescription extends AuditFields {
  id: number;
  prescriptionNo: string;
  encounterId?: number | null;
  patientId: number;
  visitId?: number | null;
  doctorId: number;
  prescribedAt: string;
  status: PrescriptionStatus;
  notes?: string | null;
  pharmacySaleId?: number | null;
  dispensedAt?: string | null;
  patient?: Patient;
  doctor?: Employee;
  encounter?: ClinicalEncounter;
  items?: PrescriptionItem[];
}

/** A medicine on a script the patient is recorded as reacting to. */
export interface AllergyWarning {
  itemName: string;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string;
}

export interface PrescriptionWithWarnings extends Prescription {
  allergyWarnings?: AllergyWarning[];
}

export interface PatientChart {
  patient: Patient;
  allergies: Allergy[];
  history: PatientHistory[];
  latestVitals?: VitalSign;
  recentVitals: VitalSign[];
  encounters: ClinicalEncounter[];
  activeProblems: Diagnosis[];
}

// ---------------------------------------------------------------------------
// HR
// ---------------------------------------------------------------------------

export interface Shift extends AuditFields {
  id: number;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isNight?: boolean;
  graceMinutes: number;
  isActive?: boolean;
}

export interface Holiday extends AuditFields {
  id: number;
  holidayDate: string;
  holidayName: string;
  isPaid?: boolean;
}

export type RosterStatus = 'planned' | 'published' | 'cancelled';

export interface DutyRoster extends AuditFields {
  id: number;
  employeeId: number;
  rosterDate: string;
  shiftId: number;
  departmentId?: number | null;
  roomId?: number | null;
  status: RosterStatus;
  remarks?: string | null;
  employee?: Employee;
  shift?: Shift;
}

export interface RosterDay {
  rosterId: number;
  shiftId: number;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  status: RosterStatus;
  isNight: boolean;
}

export interface RosterGridRow {
  employeeId: number;
  employeeNo: string;
  employeeName: string;
  departmentId?: number;
  /** Keyed by ISO date. A missing key is a day off, not an empty shift. */
  days: Record<string, RosterDay>;
}

export interface RosterGrid {
  fromDate: string;
  toDate: string;
  dates: string[];
  rows: RosterGridRow[];
}

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'half-day'
  | 'leave'
  | 'holiday'
  | 'off-day';

export interface Attendance extends AuditFields {
  id: number;
  employeeId: number;
  attendanceDate: string;
  shiftId?: number | null;
  rosterId?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: AttendanceStatus;
  workedMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  leaveRequestId?: number | null;
  remarks?: string | null;
  /** Set once a payroll run has consumed the day; it stops being editable. */
  isLocked?: boolean;
  employee?: Employee;
  shift?: Shift;
}

export interface AttendanceSummaryRow {
  employeeId: number;
  employeeNo: string;
  employeeName: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  halfDays: number;
  holidayDays: number;
  workedHours: number;
  overtimeHours: number;
  totalLateMinutes: number;
}

export interface AttendanceSummary {
  fromDate: string;
  toDate: string;
  rows: AttendanceSummaryRow[];
}

export interface LeaveType extends AuditFields {
  id: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  daysPerYear: number;
  isPaid?: boolean;
  requiresApproval?: boolean;
  carryForward?: boolean;
  maxCarryDays: number;
  isActive?: boolean;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest extends AuditFields {
  id: number;
  requestNo: string;
  employeeId: number;
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  days: number;
  isHalfDay?: boolean;
  reason?: string | null;
  status: LeaveStatus;
  handover?: string | null;
  approvalRequestId?: number | null;
  decidedAt?: string | null;
  decidedBy?: number | null;
  decisionRemarks?: string | null;
  employee?: Employee;
  leaveType?: LeaveType;
  approvalRequest?: ApprovalRequest;
  decidedUser?: User;
}

export interface LeaveBalanceRow {
  leaveTypeId: number;
  leaveTypeName: string;
  isPaid: boolean;
  entitled: number;
  carriedOver: number;
  used: number;
  available: number;
}

export interface LeaveBalances {
  year: number;
  balances: LeaveBalanceRow[];
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export type ComponentType = 'earning' | 'deduction';
export type CalcType = 'fixed' | 'percent';

export interface SalaryComponent {
  id: number;
  structureId: number;
  componentType: ComponentType;
  name: string;
  calcType: CalcType;
  value: string;
  isTaxable?: boolean;
  sortOrder: number;
}

export interface SalaryStructure extends AuditFields {
  id: number;
  employeeId: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  basicSalary: string;
  currency: string;
  workingDaysPerMonth: number;
  overtimeRate: string;
  isActive?: boolean;
  remarks?: string | null;
  employee?: Employee;
  components?: SalaryComponent[];
}

export type PayrollStatus = 'draft' | 'processed' | 'approved' | 'paid' | 'cancelled';

export interface PayrollRun extends AuditFields {
  id: number;
  runNo: string;
  periodYear: number;
  periodMonth: number;
  fromDate: string;
  toDate: string;
  status: PayrollStatus;
  employeeCount: number;
  totalEarning: string;
  totalDeduction: string;
  totalNet: string;
  processedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  approvalRequestId?: number | null;
  remarks?: string | null;
  approvalRequest?: ApprovalRequest;
}

export interface PayslipLine {
  id: number;
  payslipId: number;
  componentType: ComponentType;
  name: string;
  amount: string;
  sortOrder: number;
}

export interface Payslip extends AuditFields {
  id: number;
  payrollRunId: number;
  employeeId: number;
  structureId?: number | null;
  basicSalary: string;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  overtimeHours: number;
  earnedBasic: string;
  overtimeAmount: string;
  totalEarning: string;
  totalDeduction: string;
  netPay: string;
  remarks?: string | null;
  employee?: Employee;
  payrollRun?: PayrollRun;
  lines?: PayslipLine[];
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export type ReportColumnType = 'text' | 'number' | 'money' | 'date' | 'datetime' | 'bool';

export interface ReportColumn {
  key: string;
  label: string;
  type: ReportColumnType;
  filterable: boolean;
  groupable: boolean;
  aggregatable: boolean;
}

export interface ReportSource {
  key: string;
  label: string;
  category: string;
  requiredPermission: string;
  columns: ReportColumn[];
}

export type ReportOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'in'
  | 'isNull'
  | 'notNull';

export interface ReportFilter {
  field: string;
  operator: ReportOperator;
  value?: unknown;
}

export type AggregateFunction = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface ReportAggregate {
  field: string;
  function: AggregateFunction;
}

export interface ReportRequest {
  dataSource: string;
  columns?: string[];
  filters?: ReportFilter[];
  groupBy?: string[];
  aggregates?: ReportAggregate[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

export interface ReportResultColumn {
  key: string;
  label: string;
  type: ReportColumnType;
}

export interface ReportResult {
  dataSource: string;
  columns: ReportResultColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  /** The row cap was hit, so this is a prefix rather than the whole answer. */
  truncated: boolean;
  durationMs: number;
  generatedAt: string;
}

export interface ReportDefinition extends AuditFields {
  id: number;
  reportCode: string;
  reportName: string;
  description?: string | null;
  category: string;
  dataSource: string;
  columns: string[];
  filters?: ReportFilter[] | null;
  groupBy?: string[] | null;
  aggregates?: ReportAggregate[] | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  rowLimit: number;
  /** Shipped with the product: runnable and copyable, not editable. */
  isSystem?: boolean;
  isActive?: boolean;
  requiredPermission?: string | null;
}

export interface ReportDefinitionPayload {
  reportCode: string;
  reportName: string;
  description?: string | null;
  category?: string;
  dataSource: string;
  columns: string[];
  filters?: ReportFilter[];
  groupBy?: string[];
  aggregates?: ReportAggregate[];
  sortBy?: string | null;
  sortOrder?: string | null;
  rowLimit?: number;
  isActive?: boolean;
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ReportRun {
  id: number;
  definitionId?: number | null;
  reportCode?: string | null;
  dataSource: string;
  format: string;
  rowCount: number;
  durationMs: number;
  runBy?: number | null;
  username?: string | null;
  requestId?: string | null;
  createdAt: string;
  definition?: ReportDefinition;
}
