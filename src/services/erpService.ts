import privateApi from '@/providers/privateAxios';
import { createResourceService } from './createResourceService';
import { toApiError } from '@/lib/getApiErrorMessage';
import type { ApiResponse, ListParams, PaginatedResponse } from '@/types/api';
import type {
  Allergy,
  Appointment,
  ApprovalRequest,
  ApprovalWorkflow,
  Attendance,
  AttendanceSummary,
  AuditFilterOptions,
  AuditLog,
  AuditSummary,
  ClinicalEncounter,
  DayAvailability,
  Diagnosis,
  DoctorSchedule,
  ExportFormat,
  Holiday,
  ICDCode,
  LeaveBalances,
  LeaveRequest,
  LeaveType,
  PatientChart,
  PatientHistory,
  PayrollRun,
  Payslip,
  PrescriptionWithWarnings,
  QueueBoard,
  QueueToken,
  ReportDefinition,
  ReportDefinitionPayload,
  ReportRequest,
  ReportResult,
  ReportRun,
  ReportSource,
  RosterGrid,
  SalaryStructure,
  ScheduleException,
  Shift,
  WorkflowPayload
} from '@/types/erp';

/**
 * API clients for the six ERP modules.
 *
 * Anything that is plain CRUD goes through createResourceService; the rest is
 * written out because it is not CRUD — a queue is called through, a payroll run
 * is processed, a report is described and executed.
 */

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export const auditService = {
  async getList(params: ListParams = {}): Promise<PaginatedResponse<AuditLog>> {
    try {
      const response = await privateApi.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the audit trail');
    }
  },

  async getById(id: number | string): Promise<AuditLog> {
    try {
      const response = await privateApi.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the audit entry');
    }
  },

  /**
   * Everything ever recorded about one record, oldest first. This is what the
   * "history" panel on a document screen shows.
   */
  async getEntityHistory(entityType: string, entityId: number | string): Promise<AuditLog[]> {
    try {
      const response = await privateApi.get<ApiResponse<AuditLog[]>>(
        `/audit-logs/entity/${entityType}/${entityId}`
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the record history');
    }
  },

  async getFilterOptions(): Promise<AuditFilterOptions> {
    try {
      const response = await privateApi.get<ApiResponse<AuditFilterOptions>>('/audit-logs/filters');
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the audit filters');
    }
  },

  async getSummary(params: ListParams = {}): Promise<AuditSummary> {
    try {
      const response = await privateApi.get<ApiResponse<AuditSummary>>('/audit-logs/summary', {
        params
      });
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the audit summary');
    }
  }
};

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export const approvalService = {
  ...createResourceService<ApprovalRequest>('/approvals', 'approval request'),

  /** The caller's own queue: what is waiting on them to decide. */
  async getInbox(params: ListParams = {}): Promise<PaginatedResponse<ApprovalRequest>> {
    try {
      const response = await privateApi.get<PaginatedResponse<ApprovalRequest>>(
        '/approvals/inbox',
        { params }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the approval inbox');
    }
  },

  async getInboxCount(): Promise<number> {
    try {
      const response = await privateApi.get<ApiResponse<{ count: number }>>('/approvals/inbox/count');
      return response.data.data.count;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the approval count');
    }
  },

  async getDocumentTypes(): Promise<string[]> {
    try {
      const response = await privateApi.get<ApiResponse<string[]>>('/approvals/document-types');
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the document types');
    }
  },

  /** The approval history of one document, for the panel on its own screen. */
  async getForDocument(documentType: string, documentId: number): Promise<ApprovalRequest[]> {
    try {
      const response = await privateApi.get<ApiResponse<ApprovalRequest[]>>(
        `/approvals/document/${documentType}/${documentId}`
      );
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the document approvals');
    }
  },

  async decide(
    id: number,
    action: 'approve' | 'reject' | 'cancel' | 'comment',
    remarks?: string
  ): Promise<ApprovalRequest> {
    try {
      const response = await privateApi.post<ApiResponse<ApprovalRequest>>(
        `/approvals/${id}/${action}`,
        { remarks }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to act on the approval request');
    }
  }
};

export const approvalWorkflowService = createResourceService<
  ApprovalWorkflow,
  WorkflowPayload,
  WorkflowPayload
>('/approval-workflows', 'workflow');

// ---------------------------------------------------------------------------
// Appointments and the OPD queue
// ---------------------------------------------------------------------------

export interface BookAppointmentPayload {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  serviceCenterId?: number | null;
  serviceId?: number | null;
  roomId?: number | null;
  source?: string;
  reason?: string | null;
  remarks?: string | null;
}

export const appointmentService = {
  ...createResourceService<Appointment, BookAppointmentPayload>('/appointments', 'appointment'),

  /**
   * A doctor's bookable slots for a date. Computed from their schedule template
   * less what is already booked, so it is always current — there is no stored
   * table of empty slots to go stale.
   */
  async getAvailability(doctorId: number, date: string): Promise<DayAvailability> {
    try {
      const response = await privateApi.get<ApiResponse<DayAvailability>>(
        `/doctors/${doctorId}/availability`,
        { params: { date } }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the doctor availability');
    }
  },

  async reschedule(
    id: number,
    payload: { appointmentDate: string; startTime: string; doctorId?: number; reason?: string }
  ): Promise<Appointment> {
    try {
      const response = await privateApi.post<ApiResponse<Appointment>>(
        `/appointments/${id}/reschedule`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to reschedule the appointment');
    }
  },

  async transition(
    id: number,
    action: 'cancel' | 'confirm' | 'complete' | 'no-show',
    reason?: string
  ): Promise<Appointment> {
    try {
      const response = await privateApi.post<ApiResponse<Appointment>>(
        `/appointments/${id}/${action}`,
        { reason }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to update the appointment');
    }
  },

  /** Check the patient in: the booking becomes a token in the waiting room. */
  async arrive(
    id: number,
    payload: { priority?: number; remarks?: string; openVisit?: boolean } = {}
  ): Promise<QueueToken> {
    try {
      const response = await privateApi.post<ApiResponse<QueueToken>>(
        `/appointments/${id}/arrive`,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to check the patient in');
    }
  }
};

export const doctorScheduleService = createResourceService<DoctorSchedule>(
  '/doctor-schedules',
  'schedule'
);

export const scheduleExceptionService = createResourceService<ScheduleException>(
  '/schedule-exceptions',
  'schedule exception'
);

export const queueService = {
  async getBoard(serviceCenterId: number, date?: string): Promise<QueueBoard> {
    try {
      const response = await privateApi.get<ApiResponse<QueueBoard>>('/queue/board', {
        params: { serviceCenterId, date }
      });
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the queue');
    }
  },

  async getList(params: ListParams = {}): Promise<PaginatedResponse<QueueToken>> {
    try {
      const response = await privateApi.get<PaginatedResponse<QueueToken>>('/queue/tokens', {
        params
      });
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the queue history');
    }
  },

  /** A walk-in with no appointment behind them, which is most of the list. */
  async createWalkIn(payload: {
    serviceCenterId: number;
    patientId: number;
    doctorId?: number | null;
    priority?: number;
    remarks?: string;
    openVisit?: boolean;
  }): Promise<QueueToken> {
    try {
      const response = await privateApi.post<ApiResponse<QueueToken>>('/queue/tokens', payload);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to issue the queue token');
    }
  },

  async callNext(payload: {
    serviceCenterId: number;
    doctorId?: number | null;
    roomId?: number | null;
  }): Promise<QueueToken> {
    try {
      const response = await privateApi.post<ApiResponse<QueueToken>>('/queue/call-next', payload);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to call the next patient');
    }
  },

  async updateStatus(id: number, status: string, remarks?: string): Promise<QueueToken> {
    try {
      const response = await privateApi.patch<ApiResponse<QueueToken>>(
        `/queue/tokens/${id}/status`,
        { status, remarks }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to update the queue token');
    }
  }
};

// ---------------------------------------------------------------------------
// Clinical record
// ---------------------------------------------------------------------------

export interface EncounterPayload {
  patientId: number;
  doctorId: number;
  visitId?: number | null;
  appointmentId?: number | null;
  serviceCenterId?: number | null;
  encounterType?: string;
  encounterDate?: string;
  chiefComplaint?: string | null;
  historyOfIllness?: string | null;
  examination?: string | null;
  assessment?: string | null;
  treatmentPlan?: string | null;
  advice?: string | null;
  followUpDate?: string | null;
}

export const encounterService = {
  ...createResourceService<ClinicalEncounter, EncounterPayload, EncounterPayload>(
    '/clinical/encounters',
    'consultation'
  ),

  /** Freezes the note. From here it is corrected by amending, never by editing. */
  async finalise(id: number): Promise<ClinicalEncounter> {
    try {
      const response = await privateApi.post<ApiResponse<ClinicalEncounter>>(
        `/clinical/encounters/${id}/finalise`
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to finalise the consultation');
    }
  },

  /** Opens a draft that supersedes a finalised note, leaving the original intact. */
  async amend(id: number, reason: string): Promise<ClinicalEncounter> {
    try {
      const response = await privateApi.post<ApiResponse<ClinicalEncounter>>(
        `/clinical/encounters/${id}/amend`,
        { reason }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to amend the consultation');
    }
  },

  /**
   * The whole chart in one call: allergies, history, recent readings, recent
   * notes. One request rather than five, because it is opened at the start of
   * every consultation and a half-drawn allergy list is the wrong failure.
   */
  async getChart(patientId: number): Promise<PatientChart> {
    try {
      const response = await privateApi.get<ApiResponse<PatientChart>>(
        `/clinical/patients/${patientId}/chart`
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the patient chart');
    }
  }
};

export const vitalSignService = {
  async getList(params: ListParams = {}) {
    try {
      const response = await privateApi.get<PaginatedResponse<import('@/types/erp').VitalSign>>(
        '/clinical/vitals',
        { params }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the vital signs');
    }
  },

  async create(payload: Partial<import('@/types/erp').VitalSign>) {
    try {
      const response = await privateApi.post<ApiResponse<import('@/types/erp').VitalSign>>(
        '/clinical/vitals',
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to record the vital signs');
    }
  }
};

export interface PrescriptionItemPayload {
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
}

export interface PrescriptionPayload {
  patientId: number;
  doctorId: number;
  encounterId?: number | null;
  visitId?: number | null;
  notes?: string | null;
  items: PrescriptionItemPayload[];
}

export const prescriptionService = {
  async getList(params: ListParams = {}): Promise<PaginatedResponse<PrescriptionWithWarnings>> {
    try {
      const response = await privateApi.get<PaginatedResponse<PrescriptionWithWarnings>>(
        '/clinical/prescriptions',
        { params }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the prescriptions');
    }
  },

  async getById(id: number | string): Promise<PrescriptionWithWarnings> {
    try {
      const response = await privateApi.get<ApiResponse<PrescriptionWithWarnings>>(
        `/clinical/prescriptions/${id}`
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the prescription');
    }
  },

  /**
   * Writing a script returns any allergy warnings alongside it. They do not
   * block the write — a prescriber may be making a considered decision — but
   * the screen has to show them.
   */
  async create(payload: PrescriptionPayload): Promise<PrescriptionWithWarnings> {
    try {
      const response = await privateApi.post<ApiResponse<PrescriptionWithWarnings>>(
        '/clinical/prescriptions',
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to write the prescription');
    }
  },

  async markDispensed(id: number, pharmacySaleId?: number) {
    try {
      const response = await privateApi.post<ApiResponse<PrescriptionWithWarnings>>(
        `/clinical/prescriptions/${id}/dispense`,
        { pharmacySaleId }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to mark the prescription dispensed');
    }
  },

  async cancel(id: number) {
    try {
      const response = await privateApi.post<ApiResponse<PrescriptionWithWarnings>>(
        `/clinical/prescriptions/${id}/cancel`
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to cancel the prescription');
    }
  }
};

export const allergyService = createResourceService<Allergy>('/clinical/allergies', 'allergy');
export const patientHistoryService = createResourceService<PatientHistory>(
  '/clinical/histories',
  'history entry'
);
export const diagnosisService = createResourceService<Diagnosis>(
  '/clinical/diagnoses',
  'diagnosis'
);
export const icdCodeService = createResourceService<ICDCode>('/clinical/icd-codes', 'ICD code');

// ---------------------------------------------------------------------------
// HR
// ---------------------------------------------------------------------------

export const shiftService = createResourceService<Shift>('/hr/shifts', 'shift');
export const holidayService = createResourceService<Holiday>('/hr/holidays', 'holiday');
export const leaveTypeService = createResourceService<LeaveType>('/hr/leave-types', 'leave type');

export interface RosterEntryPayload {
  employeeId: number;
  rosterDate: string;
  shiftId: number;
  departmentId?: number | null;
  roomId?: number | null;
  remarks?: string | null;
}

export const rosterService = {
  /** The planner's own shape: employees down the side, dates across. */
  async getGrid(params: {
    fromDate: string;
    toDate?: string;
    departmentId?: number;
    employeeId?: number;
  }): Promise<RosterGrid> {
    try {
      const response = await privateApi.get<ApiResponse<RosterGrid>>('/hr/roster/grid', { params });
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the roster');
    }
  },

  /** All of it or none of it — a half-written week reads as deliberate days off. */
  async bulkAssign(entries: RosterEntryPayload[], replace = true): Promise<{ written: number }> {
    try {
      const response = await privateApi.post<ApiResponse<{ written: number }>>('/hr/roster', {
        entries,
        replace
      });
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to save the roster');
    }
  },

  async publish(payload: {
    fromDate: string;
    toDate: string;
    departmentId?: number | null;
  }): Promise<{ published: number }> {
    try {
      const response = await privateApi.post<ApiResponse<{ published: number }>>(
        '/hr/roster/publish',
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to publish the roster');
    }
  },

  async remove(id: number): Promise<void> {
    try {
      await privateApi.delete(`/hr/roster/${id}`);
    } catch (error) {
      throw toApiError(error, 'Failed to remove the roster entry');
    }
  }
};

export const attendanceService = {
  async getList(params: ListParams = {}): Promise<PaginatedResponse<Attendance>> {
    try {
      const response = await privateApi.get<PaginatedResponse<Attendance>>('/hr/attendance', {
        params
      });
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the attendance');
    }
  },

  /** The monthly sheet a department head signs before payroll runs. */
  async getSummary(params: {
    fromDate: string;
    toDate?: string;
    departmentId?: number;
    employeeId?: number;
  }): Promise<AttendanceSummary> {
    try {
      const response = await privateApi.get<ApiResponse<AttendanceSummary>>(
        '/hr/attendance/summary',
        { params }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the attendance summary');
    }
  },

  /**
   * There is one attendance row per person per day, so this is an upsert: a
   * supervisor correcting a day should not have to know whether the reader
   * already made one.
   */
  async save(payload: {
    employeeId: number;
    attendanceDate: string;
    status: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    workedMinutes?: number;
    overtimeMinutes?: number;
    remarks?: string | null;
  }): Promise<Attendance> {
    try {
      const response = await privateApi.post<ApiResponse<Attendance>>('/hr/attendance', payload);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to save the attendance');
    }
  },

  async clock(direction: 'in' | 'out', employeeId: number, at?: string): Promise<Attendance> {
    try {
      const response = await privateApi.post<ApiResponse<Attendance>>(
        `/hr/attendance/clock-${direction}`,
        { employeeId, at }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, `Failed to clock ${direction}`);
    }
  }
};

export interface LeaveApplicationPayload {
  employeeId: number;
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  reason?: string | null;
  handover?: string | null;
}

export const leaveService = {
  ...createResourceService<LeaveRequest, LeaveApplicationPayload>(
    '/hr/leave-requests',
    'leave request'
  ),

  async decide(
    id: number,
    action: 'approve' | 'reject' | 'cancel',
    remarks?: string
  ): Promise<LeaveRequest> {
    try {
      const response = await privateApi.post<ApiResponse<LeaveRequest>>(
        `/hr/leave-requests/${id}/${action}`,
        { remarks }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to decide the leave request');
    }
  },

  async getBalances(employeeId: number, year?: number): Promise<LeaveBalances> {
    try {
      const response = await privateApi.get<ApiResponse<LeaveBalances>>(
        `/hr/employees/${employeeId}/leave-balances`,
        { params: { year } }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the leave balances');
    }
  }
};

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export interface SalaryStructurePayload {
  employeeId: number;
  effectiveFrom: string;
  basicSalary: string;
  currency?: string;
  workingDaysPerMonth?: number;
  overtimeRate?: string;
  remarks?: string | null;
  components?: {
    componentType: string;
    name: string;
    calcType: string;
    value: string;
    isTaxable?: boolean;
    sortOrder?: number;
  }[];
}

export const salaryStructureService = {
  async getList(params: ListParams = {}): Promise<PaginatedResponse<SalaryStructure>> {
    try {
      const response = await privateApi.get<PaginatedResponse<SalaryStructure>>(
        '/hr/salary-structures',
        { params }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the salary structures');
    }
  },

  async getById(id: number | string): Promise<SalaryStructure> {
    try {
      const response = await privateApi.get<ApiResponse<SalaryStructure>>(
        `/hr/salary-structures/${id}`
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the salary structure');
    }
  },

  /** A change of salary is a new structure, never an edit — so there is no update. */
  async create(payload: SalaryStructurePayload): Promise<SalaryStructure> {
    try {
      const response = await privateApi.post<ApiResponse<SalaryStructure>>(
        '/hr/salary-structures',
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to save the salary structure');
    }
  }
};

export const payrollService = {
  async getList(params: ListParams = {}): Promise<PaginatedResponse<PayrollRun>> {
    try {
      const response = await privateApi.get<PaginatedResponse<PayrollRun>>('/hr/payroll-runs', {
        params
      });
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the payroll runs');
    }
  },

  async getById(id: number | string): Promise<PayrollRun> {
    try {
      const response = await privateApi.get<ApiResponse<PayrollRun>>(`/hr/payroll-runs/${id}`);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the payroll run');
    }
  },

  async create(payload: {
    periodYear: number;
    periodMonth: number;
    remarks?: string | null;
  }): Promise<PayrollRun> {
    try {
      const response = await privateApi.post<ApiResponse<PayrollRun>>('/hr/payroll-runs', payload);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to open the payroll run');
    }
  },

  /**
   * Generating the payslips. Re-runnable while the run is a draft, which is
   * what lets an attendance correction be picked up without a new run.
   */
  async transition(
    id: number,
    action: 'process' | 'submit' | 'mark-paid'
  ): Promise<PayrollRun> {
    try {
      const response = await privateApi.post<ApiResponse<PayrollRun>>(
        `/hr/payroll-runs/${id}/${action}`
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to update the payroll run');
    }
  },

  async getPayslips(params: ListParams = {}): Promise<PaginatedResponse<Payslip>> {
    try {
      const response = await privateApi.get<PaginatedResponse<Payslip>>('/hr/payslips', { params });
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the payslips');
    }
  },

  async getPayslip(id: number | string): Promise<Payslip> {
    try {
      const response = await privateApi.get<ApiResponse<Payslip>>(`/hr/payslips/${id}`);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the payslip');
    }
  }
};

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export const reportService = {
  /** Only the sources this caller may actually read. */
  async getSources(): Promise<ReportSource[]> {
    try {
      const response = await privateApi.get<ApiResponse<ReportSource[]>>('/reports/sources');
      return response.data.data ?? [];
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the report sources');
    }
  },

  async run(request: ReportRequest): Promise<ReportResult> {
    try {
      const response = await privateApi.post<ApiResponse<ReportResult>>('/reports/run', request);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to run the report');
    }
  },

  async runSaved(id: number, params: { fromDate?: string; toDate?: string } = {}): Promise<ReportResult> {
    try {
      const response = await privateApi.get<ApiResponse<ReportResult>>(
        `/reports/definitions/${id}/run`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to run the report');
    }
  },

  /**
   * Exports arrive as a binary body with the filename in Content-Disposition,
   * so the blob is saved here rather than being navigated to: a plain link
   * would drop the Authorization header and come back a 401.
   */
  async export(request: ReportRequest, format: ExportFormat, fallbackName = 'report'): Promise<void> {
    try {
      const response = await privateApi.post('/reports/export', request, {
        params: { format },
        responseType: 'blob'
      });
      saveBlob(response.data as Blob, filenameFrom(response.headers, `${fallbackName}.${format}`));
    } catch (error) {
      throw toApiError(error, 'Failed to export the report');
    }
  },

  async exportSaved(
    id: number,
    format: ExportFormat,
    params: { fromDate?: string; toDate?: string } = {},
    fallbackName = 'report'
  ): Promise<void> {
    try {
      const response = await privateApi.post(
        `/reports/definitions/${id}/export`,
        {},
        { params: { format, ...params }, responseType: 'blob' }
      );
      saveBlob(response.data as Blob, filenameFrom(response.headers, `${fallbackName}.${format}`));
    } catch (error) {
      throw toApiError(error, 'Failed to export the report');
    }
  },

  async getRuns(params: ListParams = {}): Promise<PaginatedResponse<ReportRun>> {
    try {
      const response = await privateApi.get<PaginatedResponse<ReportRun>>('/reports/runs', {
        params
      });
      return response.data;
    } catch (error) {
      throw toApiError(error, 'Failed to fetch the export history');
    }
  }
};

export const reportDefinitionService = createResourceService<
  ReportDefinition,
  ReportDefinitionPayload,
  ReportDefinitionPayload
>('/reports/definitions', 'report');

/** Reads the server's chosen filename, falling back to one built here. */
function filenameFrom(headers: unknown, fallback: string): string {
  const disposition =
    typeof headers === 'object' && headers !== null
      ? (headers as Record<string, string>)['content-disposition']
      : undefined;

  const match = disposition?.match(/filename="?([^";]+)"?/);
  return match?.[1] ?? fallback;
}

/**
 * Saves a blob under a filename.
 *
 * The object URL is revoked on the next tick rather than immediately: Safari
 * has not started the download when the click handler returns, and revoking
 * synchronously cancels it.
 */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
