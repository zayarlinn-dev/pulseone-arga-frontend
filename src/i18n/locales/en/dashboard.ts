/** The landing screen: today's counts and the trend charts under them. */
export const dashboard = {
  title: 'Dashboard',
  description: 'Today at a glance',
  loadFailed: 'Failed to load dashboard',

  tile: {
    totalPatients: 'Total patients',
    registeredToday: 'Registered today',
    activeVisits: 'Active visits',
    admitted: 'Currently admitted',
    invoicesToday: 'Invoices today',
    revenueToday: 'Revenue today',
    stockValue: 'Stock at cost',
    belowReorder: 'Below reorder level',
    expiringBatches: 'Batches expiring in 90 days'
  },

  trends: 'Trends',
  inventory: 'Inventory',
  dateRange: 'Date range',
  range: {
    days7: '7 days',
    days30: '30 days',
    days90: '90 days'
  },

  chart: {
    showChart: 'Chart',
    showTable: 'Table',
    empty: 'Nothing recorded in this period'
  },

  registrations: {
    title: 'New registrations',
    subtitle_one: '{{count}} patient registered',
    subtitle_other: '{{count}} patients registered',
    empty: 'No registrations in this period',
    headerGender: 'Gender',
    headerPatients: 'Patients',
    headerShare: 'Share'
  },

  takings: {
    title: 'Takings',
    subtitle: '{{invoiced}} invoiced · {{dispensed}} dispensed',
    empty: 'No takings in this period',
    invoices: 'Invoices',
    pharmacy: 'Pharmacy',
    headerDate: 'Date'
  }
} as const;
