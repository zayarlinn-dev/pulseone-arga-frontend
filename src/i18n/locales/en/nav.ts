/**
 * Sidebar sections and items. Keys mirror the `to` routes in
 * components/layout/navigation.ts so the two stay easy to line up.
 */
export const nav = {
  section: {
    overview: 'Overview',
    patientCare: 'Patient Care',
    clinical: 'Clinical',
    billing: 'Billing',
    inventory: 'Inventory',
    hr: 'Staff',
    management: 'Management',
    administration: 'Administration'
  },

  item: {
    dashboard: 'Dashboard',
    patients: 'Patients',
    appointments: 'Appointments',
    queue: 'Queue',
    visits: 'Visits',
    admissions: 'Admissions',
    encounters: 'Consultations',
    prescriptions: 'Prescriptions',
    doctorSchedules: 'Doctor Schedules',
    roster: 'Duty Roster',
    attendance: 'Attendance',
    leave: 'Leave',
    salaryStructures: 'Salaries',
    payroll: 'Payroll',
    hrSettings: 'Staff Settings',
    approvals: 'Approvals',
    approvalWorkflows: 'Approval Workflows',
    reports: 'Reports',
    auditLog: 'Audit Trail',
    counter: 'Counter',
    orders: 'Orders',
    invoices: 'Invoices',
    pharmacy: 'Pharmacy',
    refunds: 'Refunds',
    consultantEarnings: 'Consultant Earnings',
    returns: 'Returns',
    items: 'Items',
    stores: 'Stores',
    stockBalance: 'Stock Balance',
    expiryReport: 'Expiry Report',
    stockLedger: 'Stock Ledger',
    vendors: 'Vendors',
    goodsReceived: 'Goods Received',
    transfers: 'Transfers',
    damages: 'Damages',
    consumption: 'Consumption',
    stockCounts: 'Stock Counts',
    openingBalances: 'Opening Balances',
    inventorySettings: 'Inventory Settings',
    employees: 'Employees',
    departments: 'Departments',
    serviceCenters: 'Service Centers',
    services: 'Services',
    consultantFees: 'Consultant Fees',
    rooms: 'Rooms',
    lookupLists: 'Lookup Lists',
    users: 'Users',
    roles: 'Roles',
    registrationFields: 'Registration Fields',
    profitability: 'Profitability',
    workingCapital: 'Working Capital'
  },

  soon: 'Soon',
  soonHint: 'Not available yet',

  /** Filter box above the menu, and the states it can leave the list in. */
  filter: {
    placeholder: 'Find a screen…',
    label: 'Filter menu items',
    clear: 'Clear filter',
    open: 'Find a screen (Ctrl+K)',
    empty: 'No screen matches “{{query}}”',
    emptyHint: 'Check the spelling, or clear the filter to see the whole menu.',
    /**
     * Announced to screen readers as the list narrows. Written to work for any
     * count rather than as an i18next plural: Burmese has a single plural
     * category, so a `_one`/`_other` pair would leave the Myanmar catalogue
     * carrying a form the language never selects.
     */
    resultCount: 'Matches: {{count}}'
  },

  /** Tooltip on the dot marking a collapsed section that holds the open page. */
  sectionHasActive: 'Contains the page you are on'
} as const;
