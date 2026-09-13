import {
  Activity,
  BadgeDollarSign,
  Banknote,
  BedDouble,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CheckCheck,
  CircleUser,
  ClipboardCheck,
  Coins,
  ClipboardList,
  CalendarClock,
  DoorOpen,
  FileSpreadsheet,
  FileText,
  GitBranch,
  HandCoins,
  Handshake,
  History,
  Hospital,
  LayoutDashboard,
  List,
  ListOrdered,
  NotebookPen,
  Package,
  Plane,
  Wallet,
  PackageMinus,
  PackageOpen,
  PackagePlus,
  PackageX,
  Pill,
  Receipt,
  RotateCcw,
  ScanLine,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  TrendingUp,
  Truck,
  Undo2,
  UserCog,
  Users,
  Warehouse
} from 'lucide-react';
import type { en } from '@/i18n/locales/en';

/** Catalogue paths, so a renamed key fails the build instead of the sidebar. */
export type NavItemKey = `nav.item.${keyof typeof en.nav.item}`;
export type NavSectionKey = `nav.section.${keyof typeof en.nav.section}`;

export interface NavItem {
  /**
   * Translated where it is rendered rather than here: this module is evaluated
   * once at import time, so a label resolved now would keep the language the
   * app happened to boot in even after the user switches.
   */
  labelKey: NavItemKey;
  to: string;
  /**
   * Must be unique across the whole catalogue. Collapsed to the rail the icon
   * is the *only* thing identifying the item, and four screens sharing a
   * stethoscope made that column unreadable — pick a distinct glyph for a new
   * entry rather than reusing the nearest one.
   */
  icon: typeof LayoutDashboard;
  /** Privilege required to see the item; omit to always show it. */
  permission?: string;
  /**
   * Module the backend exposes but the frontend has no screen for yet. Shown
   * greyed out with a "Soon" pill instead of sending the user into a 404 —
   * clear this flag as each route lands in RouteProvider.
   */
  soon?: boolean;
}

export interface NavSection {
  labelKey: NavSectionKey;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: 'nav.section.overview',
    items: [{ labelKey: 'nav.item.dashboard', to: '/', icon: LayoutDashboard, permission: 'get-main-dashboard-data-count' }]
  },
  {
    labelKey: 'nav.section.patientCare',
    items: [
      { labelKey: 'nav.item.patients', to: '/registration/patients', icon: Users, permission: 'get-patient' },
      // Appointments and the queue sit directly under patients: between them
      // they are the whole front desk, and the desk opens all three at once.
      {
        labelKey: 'nav.item.appointments',
        to: '/appointments',
        icon: CalendarCheck,
        permission: 'get-appointment'
      },
      { labelKey: 'nav.item.queue', to: '/queue', icon: ListOrdered, permission: 'get-queue' },
      { labelKey: 'nav.item.visits', to: '/visits', icon: Activity, permission: 'get-visit' },
      { labelKey: 'nav.item.admissions', to: '/admissions', icon: BedDouble, permission: 'get-check-in' }
    ]
  },
  {
    labelKey: 'nav.section.clinical',
    items: [
      {
        labelKey: 'nav.item.encounters',
        to: '/clinical/encounters',
        icon: NotebookPen,
        permission: 'get-encounter'
      },
      {
        labelKey: 'nav.item.prescriptions',
        to: '/clinical/prescriptions',
        icon: FileText,
        permission: 'get-prescription'
      },
      // Last in the section: it is configuration, not a daily screen.
      {
        labelKey: 'nav.item.doctorSchedules',
        to: '/appointments/schedules',
        icon: CalendarRange,
        permission: 'get-doctor-schedule'
      }
    ]
  },
  {
    labelKey: 'nav.section.billing',
    items: [
      // First in the section on purpose: the walk-in counter is the busiest
      // billing screen, and it is the one reached without a prior order.
      { labelKey: 'nav.item.counter', to: '/billing/counter', icon: ScanLine, permission: 'create-invoice' },
      { labelKey: 'nav.item.orders', to: '/orders', icon: ClipboardList, permission: 'get-order' },
      { labelKey: 'nav.item.invoices', to: '/billing/invoices', icon: Receipt, permission: 'get-invoice' },
      { labelKey: 'nav.item.pharmacy', to: '/pharmacy/sales', icon: Pill, permission: 'get-pharmacy-sale' },
      { labelKey: 'nav.item.refunds', to: '/billing/refunds', icon: Undo2, permission: 'get-refund-invoice' },
      {
        labelKey: 'nav.item.consultantEarnings',
        to: '/billing/consultant-earnings',
        icon: HandCoins,
        permission: 'get-consultant-service-fee'
      },
      {
        labelKey: 'nav.item.returns',
        to: '/pharmacy/returns',
        icon: RotateCcw,
        permission: 'get-return-pharmacy-sale'
      }
    ]
  },
  {
    labelKey: 'nav.section.inventory',
    items: [
      { labelKey: 'nav.item.items', to: '/administration/items', icon: Package, permission: 'get-item' },
      { labelKey: 'nav.item.stores', to: '/administration/stores', icon: Warehouse, permission: 'get-store' },
      {
        labelKey: 'nav.item.stockBalance',
        to: '/inventories/stock-balance',
        icon: Boxes,
        permission: 'get-stock-balance'
      },
      // Directly after the balance: it is the same stock, filtered to the part
      // that is about to stop being worth anything.
      {
        labelKey: 'nav.item.expiryReport',
        to: '/inventories/expiry',
        icon: CalendarClock,
        permission: 'get-stock-balance'
      },
      // And then how the balance got to be what it is. The balance answers
      // "how much"; this answers "why", which is the question asked the moment
      // the two disagree with what is on the shelf.
      {
        labelKey: 'nav.item.stockLedger',
        to: '/inventories/stock-ledger',
        icon: ScrollText,
        permission: 'get-stock-ledger'
      },
      { labelKey: 'nav.item.vendors', to: '/administration/vendors', icon: Handshake, permission: 'get-vendor' },
      {
        labelKey: 'nav.item.goodsReceived',
        to: '/procurement/grns',
        icon: PackagePlus,
        permission: 'get-grn'
      },
      {
        labelKey: 'nav.item.transfers',
        to: '/inventories/stock-transfers',
        icon: Truck,
        permission: 'get-stock-transfer'
      },
      {
        labelKey: 'nav.item.damages',
        to: '/inventories/stock-damages',
        icon: PackageX,
        permission: 'get-stock-damage'
      },
      {
        labelKey: 'nav.item.consumption',
        to: '/inventories/stock-consumptions',
        icon: PackageMinus,
        permission: 'get-stock-consumption'
      },
      {
        labelKey: 'nav.item.stockCounts',
        to: '/inventories/stock-adjustments',
        icon: ClipboardCheck,
        permission: 'get-stock-adjustment'
      },
      {
        labelKey: 'nav.item.openingBalances',
        to: '/inventories/stock-opens',
        icon: PackageOpen,
        permission: 'get-stock-open'
      },
      // Last in the section: it is configuration, not a daily screen.
      {
        labelKey: 'nav.item.inventorySettings',
        to: '/inventories/settings',
        icon: SlidersHorizontal,
        permission: 'get-setting'
      }
    ]
  },
  {
    labelKey: 'nav.section.hr',
    items: [
      { labelKey: 'nav.item.roster', to: '/hr/roster', icon: CalendarDays, permission: 'get-roster' },
      {
        labelKey: 'nav.item.attendance',
        to: '/hr/attendance',
        icon: ClipboardCheck,
        permission: 'get-attendance'
      },
      { labelKey: 'nav.item.leave', to: '/hr/leave', icon: Plane, permission: 'get-leave' },
      {
        labelKey: 'nav.item.salaryStructures',
        to: '/hr/salary-structures',
        icon: Wallet,
        permission: 'get-salary-structure'
      },
      { labelKey: 'nav.item.payroll', to: '/hr/payroll', icon: Banknote, permission: 'get-payroll' },
      // Last in the section: it is configuration, not a daily screen.
      {
        labelKey: 'nav.item.hrSettings',
        to: '/hr/settings',
        icon: SlidersHorizontal,
        permission: 'get-shift'
      }
    ]
  },
  {
    // Above Administration and below the daily work: it is what the people who
    // own the place come here to read, not a setting anyone maintains.
    labelKey: 'nav.section.management',
    items: [
      // The inbox first: it is the only item here that is somebody's queue
      // rather than a report, and it goes stale if it is not looked at.
      {
        labelKey: 'nav.item.approvals',
        to: '/approvals',
        icon: CheckCheck,
        permission: 'get-approval'
      },
      { labelKey: 'nav.item.reports', to: '/reports', icon: FileSpreadsheet, permission: 'get-report' },
      {
        labelKey: 'nav.item.profitability',
        to: '/management/profitability',
        icon: TrendingUp,
        permission: 'get-management-report'
      },
      {
        labelKey: 'nav.item.workingCapital',
        to: '/management/working-capital',
        icon: Coins,
        permission: 'get-inventory-capital-report'
      }
    ]
  },
  {
    labelKey: 'nav.section.administration',
    items: [
      { labelKey: 'nav.item.employees', to: '/administration/employees', icon: UserCog, permission: 'get-employee' },
      { labelKey: 'nav.item.departments', to: '/administration/departments', icon: Building2, permission: 'get-department' },
      {
        labelKey: 'nav.item.serviceCenters',
        to: '/administration/service-centers',
        icon: Hospital,
        permission: 'get-service-center'
      },
      { labelKey: 'nav.item.services', to: '/administration/services', icon: Stethoscope, permission: 'get-service' },
      {
        labelKey: 'nav.item.consultantFees',
        to: '/administration/consultant-fees',
        icon: BadgeDollarSign,
        permission: 'get-consultant-service-fee'
      },
      { labelKey: 'nav.item.rooms', to: '/administration/rooms', icon: DoorOpen, permission: 'get-room' },
      {
        labelKey: 'nav.item.lookupLists',
        to: '/administration/lookups',
        icon: List,
        permission: 'get-category'
      },
      { labelKey: 'nav.item.users', to: '/administration/users', icon: CircleUser, permission: 'get-user' },
      { labelKey: 'nav.item.roles', to: '/administration/roles', icon: ShieldCheck, permission: 'get-role' },
      {
        labelKey: 'nav.item.approvalWorkflows',
        to: '/administration/approval-workflows',
        icon: GitBranch,
        permission: 'get-approval-workflow'
      },
      {
        labelKey: 'nav.item.auditLog',
        to: '/administration/audit-logs',
        icon: History,
        permission: 'get-audit-log'
      },
      // Last in the section: it is configuration, not a daily screen.
      {
        labelKey: 'nav.item.registrationFields',
        to: '/settings/registration-fields',
        icon: ClipboardCheck,
        permission: 'get-setting'
      }
    ]
  }
];

/**
 * Finds the section/item pair matching a pathname so the header can show where
 * the user is. The longest matching `to` wins, which keeps nested routes such
 * as "/administration/items/12" pointing at their list page.
 */
export function findActiveNav(pathname: string): { section?: NavSection; item?: NavItem } {
  let match: { section: NavSection; item: NavItem } | undefined;

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      const isMatch = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
      if (!isMatch) continue;
      if (!match || item.to.length > match.item.to.length) match = { section, item };
    }
  }

  return match ?? {};
}

/** Two-letter monogram used by the avatar bubbles. */
export function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * The first screen this user is actually allowed to open, used as the landing
 * route. The dashboard is only the default for users who hold its privilege —
 * everyone else used to land on it anyway and got a grid of skeletons over five
 * 403s instead of a usable page.
 *
 * Returns undefined when no item is reachable, which means the account has no
 * grants at all and needs a role, not a redirect.
 */
export function firstPermittedRoute(can: (permission: string) => boolean): string | undefined {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.soon) continue;
      if (!item.permission || can(item.permission)) return item.to;
    }
  }
  return undefined;
}
