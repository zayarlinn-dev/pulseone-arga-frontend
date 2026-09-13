import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { AppLayout } from '@/components/layout/AppLayout';
import { firstPermittedRoute } from '@/components/layout/navigation';
import { useAuthStore } from '@/stores/userStore';
import { COOKIE_NAMES } from '@/config/constants';

// Route-level code splitting: the login screen must not pull the whole
// administration bundle in with it.
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'));
const PatientListPage = lazy(() => import('@/modules/patients/pages/PatientListPage'));
const PatientFormPage = lazy(() => import('@/modules/patients/pages/PatientFormPage'));
const DepartmentListPage = lazy(() => import('@/modules/departments/pages/DepartmentListPage'));
const EmployeeListPage = lazy(() => import('@/modules/employees/pages/EmployeeListPage'));
const ItemListPage = lazy(() => import('@/modules/items/pages/ItemListPage'));
const UserListPage = lazy(() => import('@/modules/users/pages/UserListPage'));
const VisitListPage = lazy(() => import('@/modules/visits/pages/VisitListPage'));
const AdmissionListPage = lazy(() => import('@/modules/admissions/pages/AdmissionListPage'));
const StoreListPage = lazy(() => import('@/modules/stores/pages/StoreListPage'));
const VendorListPage = lazy(() => import('@/modules/vendors/pages/VendorListPage'));
const ServiceCenterListPage = lazy(
  () => import('@/modules/serviceCenters/pages/ServiceCenterListPage')
);
const ServiceListPage = lazy(() => import('@/modules/services/pages/ServiceListPage'));
const RoomListPage = lazy(() => import('@/modules/rooms/pages/RoomListPage'));
const RoleListPage = lazy(() => import('@/modules/roles/pages/RoleListPage'));
const StockBalancePage = lazy(() => import('@/modules/inventory/pages/StockBalancePage'));
const LotTracePage = lazy(() => import('@/modules/inventory/pages/LotTracePage'));
const StockLedgerPage = lazy(() => import('@/modules/inventory/pages/StockLedgerPage'));
const ExpiryReportPage = lazy(() => import('@/modules/inventory/pages/ExpiryReportPage'));
const InventorySettingsPage = lazy(
  () => import('@/modules/inventory/pages/InventorySettingsPage')
);
const RegistrationFieldsPage = lazy(
  () => import('@/modules/settings/pages/RegistrationFieldsPage')
);
const OrderListPage = lazy(() => import('@/modules/orders/pages/OrderListPage'));
const InvoiceListPage = lazy(() => import('@/modules/invoices/pages/InvoiceListPage'));
const InvoiceDetailPage = lazy(() => import('@/modules/invoices/pages/InvoiceDetailPage'));
const BillingPage = lazy(() => import('@/modules/invoices/pages/BillingPage'));
const CounterSalePage = lazy(() => import('@/modules/counter/pages/CounterSalePage'));
const PharmacySaleListPage = lazy(() => import('@/modules/pharmacy/pages/PharmacySaleListPage'));
const PharmacySaleDetailPage = lazy(
  () => import('@/modules/pharmacy/pages/PharmacySaleDetailPage')
);
const DispensePage = lazy(() => import('@/modules/pharmacy/pages/DispensePage'));
const RefundPage = lazy(() => import('@/modules/invoices/pages/RefundPage'));
const RefundListPage = lazy(() => import('@/modules/invoices/pages/RefundListPage'));
const ReturnPage = lazy(() => import('@/modules/pharmacy/pages/ReturnPage'));
const ReturnListPage = lazy(() => import('@/modules/pharmacy/pages/ReturnListPage'));
const GRNListPage = lazy(() => import('@/modules/procurement/pages/GRNListPage'));
const GRNFormPage = lazy(() => import('@/modules/procurement/pages/GRNFormPage'));
const GRNDetailPage = lazy(() => import('@/modules/procurement/pages/GRNDetailPage'));
const StockDocumentListPage = lazy(
  () => import('@/modules/inventory/pages/StockDocumentListPage')
);
const StockIssuePage = lazy(() => import('@/modules/inventory/pages/StockIssuePage'));
const StockTransferPage = lazy(() => import('@/modules/inventory/pages/StockTransferPage'));
const StockAdjustmentPage = lazy(() => import('@/modules/inventory/pages/StockAdjustmentPage'));
const LookupListPage = lazy(() => import('@/modules/lookups/pages/LookupListPage'));
const ConsultantFeeListPage = lazy(
  () => import('@/modules/consultantFees/pages/ConsultantFeeListPage')
);
const ConsultantEarningsPage = lazy(
  () => import('@/modules/consultantFees/pages/ConsultantEarningsPage')
);
const ProfitabilityPage = lazy(
  () => import('@/modules/management/pages/ProfitabilityPage')
);
const WorkingCapitalPage = lazy(
  () => import('@/modules/management/pages/WorkingCapitalPage')
);

// The six ERP modules.
const AuditLogPage = lazy(() => import('@/modules/audit/pages/AuditLogPage'));
const ApprovalListPage = lazy(() => import('@/modules/approvals/pages/ApprovalListPage'));
const WorkflowListPage = lazy(() => import('@/modules/approvals/pages/WorkflowListPage'));
const AppointmentListPage = lazy(
  () => import('@/modules/appointments/pages/AppointmentListPage')
);
const AppointmentBookPage = lazy(
  () => import('@/modules/appointments/pages/AppointmentBookPage')
);
const QueueBoardPage = lazy(() => import('@/modules/appointments/pages/QueueBoardPage'));
const DoctorSchedulePage = lazy(
  () => import('@/modules/appointments/pages/DoctorSchedulePage')
);
const EncounterListPage = lazy(() => import('@/modules/clinical/pages/EncounterListPage'));
const EncounterFormPage = lazy(() => import('@/modules/clinical/pages/EncounterFormPage'));
const PatientChartPage = lazy(() => import('@/modules/clinical/pages/PatientChartPage'));
const PrescriptionListPage = lazy(
  () => import('@/modules/clinical/pages/PrescriptionListPage')
);
const PrescriptionFormPage = lazy(
  () => import('@/modules/clinical/pages/PrescriptionFormPage')
);
const HRSettingsPage = lazy(() => import('@/modules/hr/pages/HRSettingsPage'));
const RosterPage = lazy(() => import('@/modules/hr/pages/RosterPage'));
const AttendancePage = lazy(() => import('@/modules/hr/pages/AttendancePage'));
const LeaveListPage = lazy(() => import('@/modules/hr/pages/LeaveListPage'));
const SalaryStructurePage = lazy(() => import('@/modules/hr/pages/SalaryStructurePage'));
const PayrollPage = lazy(() => import('@/modules/hr/pages/PayrollPage'));
const ReportListPage = lazy(() => import('@/modules/reports/pages/ReportListPage'));
const ReportBuilderPage = lazy(() => import('@/modules/reports/pages/ReportBuilderPage'));

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Blocks a route until the user is authenticated.
 *
 * Both the store flag and the refresh cookie are checked: after a page reload
 * the persisted store may say "authenticated" while the cookies are gone, and a
 * session without a refresh token cannot be recovered.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasRefreshToken = Boolean(Cookies.get(COOKIE_NAMES.REFRESH_TOKEN));
  const location = useLocation();

  if (!isAuthenticated || !hasRefreshToken) {
    // `state.from` lets the login page send the user back where they were.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/**
 * The index route. The dashboard is the home screen for anyone allowed to read
 * it; a user without that privilege is sent to the first screen their role does
 * reach, because rendering the dashboard for them produces a page of skeletons
 * on top of five 403s and no way out of it.
 */
function LandingRoute() {
  const can = useAuthStore(state => state.can);

  if (can('get-main-dashboard-data-count')) {
    return (
      <Suspense fallback={<PageFallback />}>
        <DashboardPage />
      </Suspense>
    );
  }

  const fallbackRoute = firstPermittedRoute(can);
  if (fallbackRoute && fallbackRoute !== '/') {
    return <Navigate to={fallbackRoute} replace />;
  }

  // No route at all is reachable: the account has no grants, which a redirect
  // cannot fix, so say so instead of bouncing between empty screens.
  return <NoAccessNotice />;
}

/** Shown when a signed-in account holds no privileges whatsoever. */
function NoAccessNotice() {
  const { t } = useTranslation();

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
      <ShieldAlert className="h-8 w-8 text-muted-foreground" />
      <p className="text-base font-semibold">{t('common.error.forbiddenTitle')}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{t('common.error.forbiddenBody')}</p>
    </div>
  );
}

/** Redirects an already-authenticated user away from the login page. */
function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasRefreshToken = Boolean(Cookies.get(COOKIE_NAMES.REFRESH_TOKEN));

  if (isAuthenticated && hasRefreshToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuthenticated>
        <Suspense fallback={<PageFallback />}>
          <LoginPage />
        </Suspense>
      </RedirectIfAuthenticated>
    )
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <LandingRoute /> },
      {
        path: 'registration/patients',
        element: <Suspense fallback={<PageFallback />}><PatientListPage /></Suspense>
      },
      {
        path: 'registration/patients/new',
        element: <Suspense fallback={<PageFallback />}><PatientFormPage /></Suspense>
      },
      {
        path: 'registration/patients/:id/edit',
        element: <Suspense fallback={<PageFallback />}><PatientFormPage /></Suspense>
      },
      {
        path: 'visits',
        element: <Suspense fallback={<PageFallback />}><VisitListPage /></Suspense>
      },
      {
        path: 'admissions',
        element: <Suspense fallback={<PageFallback />}><AdmissionListPage /></Suspense>
      },
      {
        path: 'orders',
        element: <Suspense fallback={<PageFallback />}><OrderListPage /></Suspense>
      },
      {
        path: 'billing/invoices',
        element: <Suspense fallback={<PageFallback />}><InvoiceListPage /></Suspense>
      },
      {
        path: 'billing/invoices/:id',
        element: <Suspense fallback={<PageFallback />}><InvoiceDetailPage /></Suspense>
      },
      {
        path: 'billing/new',
        element: <Suspense fallback={<PageFallback />}><BillingPage /></Suspense>
      },
      {
        path: 'billing/counter',
        element: <Suspense fallback={<PageFallback />}><CounterSalePage /></Suspense>
      },
      {
        path: 'pharmacy/sales',
        element: <Suspense fallback={<PageFallback />}><PharmacySaleListPage /></Suspense>
      },
      {
        path: 'pharmacy/sales/:id',
        element: <Suspense fallback={<PageFallback />}><PharmacySaleDetailPage /></Suspense>
      },
      {
        path: 'pharmacy/dispense',
        element: <Suspense fallback={<PageFallback />}><DispensePage /></Suspense>
      },
      {
        path: 'billing/invoices/:id/refund',
        element: <Suspense fallback={<PageFallback />}><RefundPage /></Suspense>
      },
      {
        path: 'billing/refunds',
        element: <Suspense fallback={<PageFallback />}><RefundListPage /></Suspense>
      },
      {
        path: 'pharmacy/returns',
        element: <Suspense fallback={<PageFallback />}><ReturnListPage /></Suspense>
      },
      {
        path: 'pharmacy/returns/new',
        element: <Suspense fallback={<PageFallback />}><ReturnPage /></Suspense>
      },
      {
        path: 'procurement/grns',
        element: <Suspense fallback={<PageFallback />}><GRNListPage /></Suspense>
      },
      {
        path: 'procurement/grns/new',
        element: <Suspense fallback={<PageFallback />}><GRNFormPage /></Suspense>
      },
      {
        path: 'procurement/grns/:id',
        element: <Suspense fallback={<PageFallback />}><GRNDetailPage /></Suspense>
      },
      {
        path: 'inventories/stock-opens',
        element: <Suspense fallback={<PageFallback />}><StockDocumentListPage kind="stock-opens" /></Suspense>
      },
      {
        path: 'inventories/stock-transfers',
        element: <Suspense fallback={<PageFallback />}><StockDocumentListPage kind="stock-transfers" /></Suspense>
      },
      {
        path: 'inventories/stock-transfers/new',
        element: <Suspense fallback={<PageFallback />}><StockTransferPage /></Suspense>
      },
      {
        path: 'inventories/stock-damages',
        element: <Suspense fallback={<PageFallback />}><StockDocumentListPage kind="stock-damages" /></Suspense>
      },
      {
        path: 'inventories/stock-damages/new',
        element: <Suspense fallback={<PageFallback />}><StockIssuePage kind="damage" /></Suspense>
      },
      {
        path: 'inventories/stock-consumptions',
        element: <Suspense fallback={<PageFallback />}><StockDocumentListPage kind="stock-consumptions" /></Suspense>
      },
      {
        path: 'inventories/stock-consumptions/new',
        element: <Suspense fallback={<PageFallback />}><StockIssuePage kind="consumption" /></Suspense>
      },
      {
        path: 'inventories/stock-adjustments',
        element: <Suspense fallback={<PageFallback />}><StockDocumentListPage kind="stock-adjustments" /></Suspense>
      },
      {
        path: 'inventories/stock-adjustments/new',
        element: <Suspense fallback={<PageFallback />}><StockAdjustmentPage /></Suspense>
      },      {
        path: 'administration/consultant-fees',
        element: <Suspense fallback={<PageFallback />}><ConsultantFeeListPage /></Suspense>
      },
      {
        path: 'billing/consultant-earnings',
        element: <Suspense fallback={<PageFallback />}><ConsultantEarningsPage /></Suspense>
      },
      {
        path: 'management/profitability',
        element: <Suspense fallback={<PageFallback />}><ProfitabilityPage /></Suspense>
      },
      {
        path: 'management/working-capital',
        element: <Suspense fallback={<PageFallback />}><WorkingCapitalPage /></Suspense>
      },
      {
        path: 'administration/lookups',
        element: <Suspense fallback={<PageFallback />}><LookupListPage /></Suspense>
      },
      {
        path: 'administration/departments',
        element: <Suspense fallback={<PageFallback />}><DepartmentListPage /></Suspense>
      },
      {
        path: 'administration/service-centers',
        element: <Suspense fallback={<PageFallback />}><ServiceCenterListPage /></Suspense>
      },
      {
        path: 'administration/services',
        element: <Suspense fallback={<PageFallback />}><ServiceListPage /></Suspense>
      },
      {
        path: 'administration/rooms',
        element: <Suspense fallback={<PageFallback />}><RoomListPage /></Suspense>
      },
      {
        path: 'administration/employees',
        element: <Suspense fallback={<PageFallback />}><EmployeeListPage /></Suspense>
      },
      {
        path: 'administration/items',
        element: <Suspense fallback={<PageFallback />}><ItemListPage /></Suspense>
      },
      {
        path: 'administration/stores',
        element: <Suspense fallback={<PageFallback />}><StoreListPage /></Suspense>
      },
      {
        path: 'administration/vendors',
        element: <Suspense fallback={<PageFallback />}><VendorListPage /></Suspense>
      },
      {
        path: 'inventories/stock-balance',
        element: <Suspense fallback={<PageFallback />}><StockBalancePage /></Suspense>
      },
      {
        path: 'inventories/expiry',
        element: <Suspense fallback={<PageFallback />}><ExpiryReportPage /></Suspense>
      },
      {
        // Browsed to as well as linked to: the stock balance sends a row here
        // with ?itemId=&storeId=, which is the path someone checking a figure
        // they do not believe actually takes.
        path: 'inventories/stock-ledger',
        element: <Suspense fallback={<PageFallback />}><StockLedgerPage /></Suspense>
      },
      {
        path: 'inventories/settings',
        element: <Suspense fallback={<PageFallback />}><InventorySettingsPage /></Suspense>
      },
      {
        // Not under /administration: it governs the patient form as much as the
        // staff one, and belongs to neither module.
        path: 'settings/registration-fields',
        element: <Suspense fallback={<PageFallback />}><RegistrationFieldsPage /></Suspense>
      },
      {
        // Reached from a batch, not browsed to: the recall starts with the
        // batch number on the notice, and the page widens it to the whole lot.
        path: 'inventories/lots/:id',
        element: <Suspense fallback={<PageFallback />}><LotTracePage /></Suspense>
      },
      {
        path: 'administration/users',
        element: <Suspense fallback={<PageFallback />}><UserListPage /></Suspense>
      },
      {
        path: 'administration/roles',
        element: <Suspense fallback={<PageFallback />}><RoleListPage /></Suspense>
      },
      // ---------------------------------------------------------------
      // Appointments and the OPD queue
      // ---------------------------------------------------------------
      {
        path: 'appointments',
        element: <Suspense fallback={<PageFallback />}><AppointmentListPage /></Suspense>
      },
      {
        path: 'appointments/new',
        element: <Suspense fallback={<PageFallback />}><AppointmentBookPage /></Suspense>
      },
      {
        path: 'queue',
        element: <Suspense fallback={<PageFallback />}><QueueBoardPage /></Suspense>
      },
      {
        path: 'appointments/schedules',
        element: <Suspense fallback={<PageFallback />}><DoctorSchedulePage /></Suspense>
      },

      // ---------------------------------------------------------------
      // Clinical record
      // ---------------------------------------------------------------
      {
        path: 'clinical/encounters',
        element: <Suspense fallback={<PageFallback />}><EncounterListPage /></Suspense>
      },
      {
        path: 'clinical/encounters/new',
        element: <Suspense fallback={<PageFallback />}><EncounterFormPage /></Suspense>
      },
      {
        path: 'clinical/encounters/:id',
        element: <Suspense fallback={<PageFallback />}><EncounterFormPage /></Suspense>
      },
      {
        // Reached from a patient rather than browsed to: it is that patient's
        // record, and there is no list of charts to open.
        path: 'clinical/patients/:id',
        element: <Suspense fallback={<PageFallback />}><PatientChartPage /></Suspense>
      },
      {
        path: 'clinical/prescriptions',
        element: <Suspense fallback={<PageFallback />}><PrescriptionListPage /></Suspense>
      },
      {
        path: 'clinical/prescriptions/new',
        element: <Suspense fallback={<PageFallback />}><PrescriptionFormPage /></Suspense>
      },

      // ---------------------------------------------------------------
      // HR and payroll
      // ---------------------------------------------------------------
      {
        path: 'hr/roster',
        element: <Suspense fallback={<PageFallback />}><RosterPage /></Suspense>
      },
      {
        path: 'hr/attendance',
        element: <Suspense fallback={<PageFallback />}><AttendancePage /></Suspense>
      },
      {
        path: 'hr/leave',
        element: <Suspense fallback={<PageFallback />}><LeaveListPage /></Suspense>
      },
      {
        path: 'hr/salary-structures',
        element: <Suspense fallback={<PageFallback />}><SalaryStructurePage /></Suspense>
      },
      {
        path: 'hr/payroll',
        element: <Suspense fallback={<PageFallback />}><PayrollPage /></Suspense>
      },
      {
        path: 'hr/settings',
        element: <Suspense fallback={<PageFallback />}><HRSettingsPage /></Suspense>
      },

      // ---------------------------------------------------------------
      // Approvals, reports and the audit trail
      // ---------------------------------------------------------------
      {
        path: 'approvals',
        element: <Suspense fallback={<PageFallback />}><ApprovalListPage inbox /></Suspense>
      },
      {
        path: 'approvals/all',
        element: <Suspense fallback={<PageFallback />}><ApprovalListPage /></Suspense>
      },
      {
        path: 'administration/approval-workflows',
        element: <Suspense fallback={<PageFallback />}><WorkflowListPage /></Suspense>
      },
      {
        path: 'reports',
        element: <Suspense fallback={<PageFallback />}><ReportListPage /></Suspense>
      },
      {
        path: 'reports/builder',
        element: <Suspense fallback={<PageFallback />}><ReportBuilderPage /></Suspense>
      },
      {
        path: 'administration/audit-logs',
        element: <Suspense fallback={<PageFallback />}><AuditLogPage /></Suspense>
      },

      { path: '*', element: <Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense> }
    ]
  }
]);

export function RouteProvider() {
  return <RouterProvider router={router} />;
}
