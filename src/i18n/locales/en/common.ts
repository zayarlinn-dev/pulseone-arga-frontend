/**
 * Strings that appear in more than one module — buttons, table chrome, status
 * words. Anything used by a single screen belongs in that screen's file, so
 * this stays a shared vocabulary rather than a dumping ground.
 */
export const common = {
  appName: 'PulseOne',
  appTagline: 'Hospital Management',

  action: {
    save: 'Save',
    saving: 'Saving',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    close: 'Close',
    create: 'Create',
    creating: 'Creating',
    add: 'Add',
    edit: 'Edit',
    update: 'Update',
    updating: 'Updating',
    delete: 'Delete',
    deleting: 'Deleting',
    remove: 'Remove',
    confirm: 'Confirm',
    search: 'Search',
    searchPlaceholder: 'Search...',
    clear: 'Clear',
    clearFilters: 'Clear filters',
    reset: 'Reset',
    refresh: 'Refresh',
    retry: 'Try again',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    print: 'Print',
    export: 'Export',
    view: 'View',
    viewAll: 'View all',
    details: 'Details',
    select: 'Select',
    apply: 'Apply',
    submit: 'Submit',
    submitting: 'Submitting',
    done: 'Done',
    continue: 'Continue',
    discard: 'Discard',
    // Built from the entity name so every list page phrases its buttons the
    // same way, and so Burmese can put the modifier after the noun.
    newItem: 'New {{item}}',
    editItem: 'Edit {{item}}',
    deleteItem: 'Delete {{item}}',
    enable: 'Enable',
    disable: 'Disable'
  },

  /* Which paper the receipt comes out on. The labels name the paper rather
     than the printer, because that is what the person at the counter is
     looking at when they choose. */
  print: {
    format: 'Paper size',
    a4: 'A4 sheet',
    thermal: '80mm roll'
  },

  /* Wording every printed receipt shares. Two screens print one now — the
     bill and the dispensing slip — and a patient handed both in the same visit
     should not find the same row labelled two different ways. What only one of
     them says (which document number, who prescribed) stays in its module. */
  label: {
    actions: 'Actions',
    status: 'Status',
    name: 'Name',
    code: 'Code',
    description: 'Description',
    remark: 'Remark',
    remarks: 'Remarks',
    notes: 'Notes',
    date: 'Date',
    time: 'Time',
    createdAt: 'Created',
    updatedAt: 'Updated',
    createdBy: 'Created by',
    from: 'From',
    to: 'To',
    dateFrom: 'From date',
    dateTo: 'To date',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    total: 'Total',
    subtotal: 'Subtotal',
    grandTotal: 'Grand total',
    quantity: 'Quantity',
    qty: 'Qty',
    unit: 'Unit',
    price: 'Price',
    unitPrice: 'Unit price',
    amount: 'Amount',
    discount: 'Discount',
    tax: 'Tax',
    paid: 'Paid',
    balance: 'Balance',
    type: 'Type',
    category: 'Category',
    reference: 'Reference',
    reason: 'Reason',
    optional: 'Optional',
    required: 'Required',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    unknown: 'Unknown',
    notSet: 'Not set',
    loading: 'Loading...'
  },

  paymentMethod: {
    cash: 'Cash',
    banking: 'Bank transfer',
    'e-wallet': 'E-wallet'
  },

  returnPaymentMethod: {
    Cash: 'Cash',
    Banking: 'Bank transfer',
    'E-Wallet': 'E-wallet'
  },

  status: {
    active: 'Active',
    inactive: 'Inactive',
    disabled: 'Disabled',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    draft: 'Draft',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partiallyPaid: 'Partially paid',
    refunded: 'Refunded',
    open: 'Open',
    closed: 'Closed',
    approved: 'Approved',
    rejected: 'Rejected'
  },

  table: {
    noResults: 'No records found',
    noResultsHint: 'Try adjusting your search or filters.',
    empty: 'Nothing here yet',
    loading: 'Loading…',
    error: 'Could not load this list',
    emptyOf: 'No {{items}} found',
    rowsSelected_one: '{{count}} row selected',
    rowsSelected_other: '{{count}} rows selected'
  },

  pagination: {
    noRecords: 'No records',
    rows: 'Rows',
    showing: 'Showing {{from}}–{{to}} of {{total}}',
    page: 'Page {{page}} of {{pages}}',
    rowsPerPage: 'Rows per page',
    first: 'First page',
    last: 'Last page',
    previous: 'Previous page',
    next: 'Next page'
  },

  confirm: {
    discardTitle: 'Discard changes?',
    keepEditing: 'Keep editing',
    deleteTitle: 'Delete {{item}}?',
    deleteBody: 'This cannot be undone.',
    unsavedTitle: 'Discard unsaved changes?',
    unsavedBody: 'Anything you have typed on this form will be lost.'
  },

  toast: {
    created: '{{item}} created',
    updated: '{{item}} updated',
    deleted: '{{item}} deleted',
    saved: 'Changes saved',
    createFailed: 'Could not create {{item}}',
    updateFailed: 'Could not update {{item}}',
    deleteFailed: 'Could not delete {{item}}',
    error: 'Something went wrong',
    networkError: 'Cannot reach the server. Check your connection and try again.'
  },

  validation: {
    required: 'This field is required',
    invalid: 'Please check this value',
    maxLength: '{{field}} must be {{max}} characters or fewer',
    requiredField: '{{field}} is required',
    email: 'Enter a valid email address',
    phone: 'Enter a valid phone number',
    min: 'Must be at least {{min}}',
    max: 'Must be at most {{max}}',
    positive: 'Must be greater than zero',
    integer: 'Must be a whole number',
    selectOne: 'Please select an option'
  },

  calendar: {
    open: 'Open calendar',
    hour: 'Hour',
    minute: 'Minute',
    meridiem: 'AM or PM',
    am: 'AM',
    pm: 'PM',
    today: 'Today',
    clear: 'Clear date'
  },

  draft: {
    // Reads "You left this delivery here 5 minutes ago." — the noun comes from
    // whichever form is offering the draft back.
    notice: 'You left {{item}} here {{when}}.',
    restore: 'Restore it',
    startFresh: 'Start fresh'
  },

  error: {
    title: 'Something went wrong',
    body: 'This screen failed to render. The rest of the application is still usable.',
    unknown: 'Unknown error',
    timeout: 'The request timed out. Please try again.',
    unreachable: 'Could not reach the server. Check your connection.',
    reference: '(reference: {{id}})',
    backToDashboard: 'Back to dashboard',
    notFoundTitle: 'Page not found',
    notFoundBody: 'We could not find a page for this address.',
    goBack: 'Go back',
    goHome: 'Dashboard',
    forbiddenTitle: 'You do not have access',
    forbiddenBody: 'Ask an administrator if you need this screen.'
  }
} as const;
