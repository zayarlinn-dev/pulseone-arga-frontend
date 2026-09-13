/**
 * Billing: orders, the walk-in counter, invoices, refunds, pharmacy sales and
 * consultant earnings. Spread into the catalogue root, so a screen reads
 * `t('orders.title')`.
 */
export const billing = {
  orders: {
    entity: 'Order',
    title: 'Orders',
    description: 'Services requested during a visit, waiting to be billed',
    searchPlaceholder: 'Search by order no...',
    empty: 'No orders found',
    bill: 'Bill',
    billAria: 'Bill {{number}}',
    cancelAria: 'Cancel {{number}}',

    column: {
      orderNo: 'Order No',
      patient: 'Patient',
      visit: 'Visit',
      services: 'Services',
      unbilled: 'Unbilled',
      ordered: 'Ordered'
    },

    more: '+{{count}} more',
    unnamedService: 'Service',

    status: {
      ordered: 'Ordered',
      purchased: 'Billed',
      dispensed: 'Dispensed',
      cancelled: 'Cancelled',
      returned: 'Returned'
    },

    filter: {
      label: 'Filter by order status',
      all: 'All statuses'
    },

    cancel: {
      title: 'Cancel order',
      confirm: 'Cancel order',
      body: 'Cancel {{number}}? Its outstanding charges are voided and will not appear on any bill.',
      toast: 'Order cancelled',
      failed: 'Failed to cancel order'
    },

    modal: {
      title: 'New order',
      description:
        "Services ordered here become the patient's outstanding charges, ready for the cashier to bill.",
      patient: 'Patient',
      selectPatient: 'Select a patient first',
      addService: 'Add at least one service',
      billedAgainst: 'Billed against {{visit}}.',
      openVisit: 'the visit currently open for this patient',
      services: 'Services',
      addLine: 'Add line',
      service: 'Service',
      loadingServices: 'Loading services...',
      selectService: 'Select a service',
      qty: 'Qty',
      quantity: 'Quantity',
      discountPercent: 'Disc %',
      discountAria: 'Line discount percentage',
      removeLine: 'Remove line',
      consultant: 'Consultant',
      noConsultant: 'No consultant credited',
      remarks: 'Remarks',
      lineTotal: 'Line total',
      orderTotal: 'Order total',
      lineCount_one: '{{count}} line',
      lineCount_other: '{{count}} lines',
      submit: 'Create order'
    }
  },

  invoices: {
    title: 'Invoices',
    description: 'Bills raised against patient visits',
    searchPlaceholder: 'Search by invoice no or transaction reference...',
    empty: 'No invoices found',
    back: 'Back to invoices',

    column: {
      invoiceNo: 'Invoice No',
      patient: 'Patient',
      visit: 'Visit',
      net: 'Net',
      paid: 'Paid',
      method: 'Method',
      billed: 'Billed'
    },

    owing: '{{amount}} owing',

    status: {
      paid: 'Paid',
      pending: 'Part paid',
      unpaid: 'Unpaid',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    },

    filter: {
      label: 'Filter by invoice status',
      all: 'All statuses',
      patient: 'One patient'
    },

    detail: {
      notFound: 'This invoice could not be loaded.',
      billedOn: 'Billed {{date}}',
      billedBy: 'by {{user}}',
      takePayment: 'Take payment',
      refund: 'Refund',
      cancel: 'Cancel',
      receiptTitle: 'Invoice',
      phone: 'Tel {{number}}',
      patient: 'Patient',
      walkIn: 'Walk-in',
      visit: 'Visit',

      // The letterhead block. Every row is a label and a figure, so they read
      // the same stacked on an 80mm roll as they do in two columns on A4.
      meta: {
        invoiceNo: 'Invoice no.',
        date: 'Date',
        patientNo: 'Patient no.',
        patientPhone: 'Phone',
        orderNo: 'Order no.',
        cashier: 'Cashier',
        transactionNo: 'Transaction ref.'
      },

      header: {
        no: 'No.',
        item: 'Description',
        price: 'Unit price',
        qty: 'Qty',
        amount: 'Amount'
      },
      noLines: 'This invoice has no lines.',
      // The two bands the bill is read in: what was done, then what was
      // dispensed.
      services: 'Services',
      medicine: 'Medicine',
      batch: 'batch {{number}}',
      unnamedItem: 'Item #{{id}}',
      subtotal: 'Subtotal',
      // The line columns print without a currency to stay narrow, so the
      // subtotal is where the receipt says what the figures are in.
      subtotalIn: 'Subtotal ({{currency}})',
      discountPercent: 'Discount {{rate}}%',
      discount: 'Discount',
      tax: 'Tax {{rate}}%',
      netAmount: 'Net amount',
      paidBy: 'Paid ({{method}})',
      change: 'Change',
      balanceOwing: 'Balance owing',
      voided: 'This invoice was {{status}}.',
      thanks: 'Thank you for your visit.',
      printedAt: 'Printed {{date}}',
      signature: {
        cashier: 'Cashier',
        received: 'Received by'
      },

      payModal: {
        title: 'Take payment',
        description:
          '{{amount}} is outstanding on {{number}}. Part payments are allowed — the balance stays owing.',
        amount: 'Amount received',
        paidBy: 'Paid by',
        reference: 'Transaction reference',
        submit: 'Record payment'
      },

      cancelModal: {
        title: 'Cancel invoice',
        description:
          '{{number}} is voided and its charges go back to outstanding, ready to be billed again. Any medicine on it goes back on the shelf, and any consultant fees earned on it are removed.',
        keep: 'Keep invoice',
        confirm: 'Cancel invoice'
      },

      toast: {
        paid: 'Payment recorded',
        payFailed: 'Failed to record payment',
        cancelled: 'Invoice cancelled — its charges are outstanding again',
        cancelFailed: 'Failed to cancel invoice'
      }
    }
  },

  newBill: {
    title: 'New bill',
    newBillButton: 'New Bill',
    subtitle: 'Bill a patient for the services they have received this visit.',
    patient: 'Patient',
    currentVisit: 'Current visit',
    outstanding: 'Outstanding charges',
    outstandingHint: 'Everything ordered for this patient that has not been billed yet.',
    selectAll: 'Select all',
    clearAll: 'Clear all',
    findPatient: 'Find a patient to see what they owe.',
    nothingOutstanding: 'Nothing outstanding — every charge for this patient has been billed.',
    orderService: 'Order a service',
    unnamedService: 'Service #{{id}}',
    less: 'less {{amount}}',

    summary: 'Bill summary',
    subtotal: 'Subtotal',
    discountPercent: 'Discount {{rate}}%',
    discount: 'Discount',
    tax: 'Tax {{rate}}%',
    netAmount: 'Net amount',
    overDiscounted: 'The discount is larger than the bill.',
    discountPercentLabel: 'Discount %',
    discountAmountLabel: 'Discount amount',
    taxPercentLabel: 'Tax %',
    paidBy: 'Paid by',
    amountReceived: 'Amount received',
    amountReceivedHint: 'Leave at zero to raise the bill unpaid.',
    transactionRef: 'Transaction reference',
    changeDue: 'Change due',
    balanceOwing: 'Balance owing',

    submitPaid: 'Take payment',
    submitPart: 'Record part payment',
    submitUnpaid: 'Raise unpaid bill',

    toast: {
      created: 'Invoice {{number}} created',
      failed: 'Failed to create invoice',
      selectCharge: 'Select at least one charge to bill',
      overDiscounted: 'The discount is larger than the bill'
    }
  },

  refunds: {
    title: 'Refunds',
    description: 'Money given back against an invoice',
    searchPlaceholder: 'Search by refund no...',
    empty: 'No refunds recorded',
    column: {
      refundNo: 'Refund No',
      againstInvoice: 'Against invoice',
      patient: 'Patient',
      refunded: 'Refunded',
      method: 'Method',
      refundedOn: 'Refunded on',
      reason: 'Reason'
    }
  },

  refundForm: {
    back: 'Back to the invoice',
    title: 'Refund {{number}}',
    subtitle: '{{name}} — enter how many units of each charge are being given back.',
    thisPatient: 'This patient',
    refundable: 'Refundable charges',
    refundableHint: 'Medicine refunded here goes back into the batch it came from.',
    nothingToRefund: 'This invoice has no charges to refund.',
    allRefunded: 'Everything on this invoice has already been refunded.',
    kind: {
      medicine: 'medicine',
      service: 'service'
    },
    leftToRefund: '{{left}} of {{sold}} left to refund',
    alreadyRefunded: '{{count}} already given back',
    batch: 'batch {{number}}',
    qtyAria: 'Refund quantity for {{item}}',
    ofTotal: 'of {{amount}}',
    refundEverything: 'Refund everything still outstanding',
    refundAll: 'Refund all',

    summary: 'Refund summary',
    invoiceNet: 'Invoice net',
    lines: 'Lines',
    units: '{{count}} units',
    refundAmount: 'Refund amount',
    overQty: 'A quantity is higher than what is left to refund.',
    refundedBy: 'Refunded by',
    transactionRef: 'Transaction reference',
    reason: 'Reason',
    submit: 'Refund {{amount}}',

    toast: {
      recorded: 'Refund {{number}} recorded',
      failed: 'Failed to record the refund',
      enterQty: 'Enter a quantity on at least one line',
      overQty: 'A quantity is higher than what is left to refund'
    }
  },

  counter: {
    services: 'Services',
    medicines: 'Medicines',
    searchServices: 'Search services...',
    searchMedicines: 'Search medicines...',
    searchScan: 'Search or scan, then press Enter to add',
    searchAria: 'Search the catalogue',
    clearSearch: 'Clear search',
    dispenseFrom: 'Dispense from',
    selectStore: 'Select a store',
    doctor: 'Attending doctor',
    noDoctor: 'No doctor credited',
    chooseStore: 'Choose a store to see what it has in stock.',
    noMatch: 'Nothing matches that search.',
    nothingToSell: 'Nothing to sell here yet.',
    onTicket: '{{count}} on ticket',
    ticket: 'Ticket',
    ticketLines_one: '{{count}} line',
    ticketLines_other: '{{count}} lines',
    attachPatient: 'Attach a patient',
    attachPatientHint:
      "Optional. Attached, the sale joins this patient's history and can be refunded against them later; left off, it is recorded as a plain walk-in.",
    patient: 'Patient',

    tile: {
      none: 'None',
      left: '{{qty}} left'
    },

    lines: {
      pickPrompt: 'Pick a service or medicine to start the ticket.',
      tapPrompt: 'Tap a service or medicine to start the ticket.',
      unitAria: 'Unit for {{item}}',
      qtyAria: 'Quantity of {{item}}',
      discountAria: 'Discount percentage on {{item}}',
      removeAria: 'Remove {{item}}',
      oneFewer: 'One fewer {{item}}',
      oneMore: 'One more {{item}}',
      less: 'less {{rate}}%',
      noDiscount: 'None',
      onlyInStock: 'Only {{qty}} in stock — the sale will be refused.'
    },

    keypad: {
      deleteDigit: 'Delete last digit'
    },

    panel: {
      clearPatient: 'Clear patient',
      walkIn: 'Walk-in — attach a patient',
      discountPercent: 'Disc %',
      discountAmount: 'Disc amt',
      taxPercent: 'Tax %',
      subtotal: 'Subtotal',
      discountRate: 'Discount {{rate}}%',
      discount: 'Discount',
      tax: 'Tax {{rate}}%',
      overDiscounted: 'The discount is larger than the ticket.',
      methodCash: 'Cash',
      methodBanking: 'Bank',
      methodWallet: 'Wallet',
      transactionRef: 'Transaction reference',
      received: 'Received',
      exactWithAmount: 'Exact — {{amount}}',
      exact: 'Exact',
      total: 'Total',
      changeDue: 'Change due',
      stillToPay: 'Still to pay',
      balanceOwing: 'Balance owing',
      clearTicket: 'Clear the ticket',
      chargeFullRequired: 'Payment in full required',
      chargeTakePayment: 'Take payment',
      chargePartPayment: 'Record part payment',
      chargeToAccount: 'Charge to account'
    },

    toast: {
      completed: '{{number}} — {{amount}}',
      failed: 'Failed to complete the sale',
      noMatch: 'Nothing matches "{{term}}"',
      outOfStock: '{{item}} is out of stock',
      clearMedicineFirst: 'Remove the medicine on this ticket before changing store',
      emptyTicket: 'The ticket is empty',
      overDiscounted: 'The discount is larger than the ticket',
      selectStore: 'Select the store the medicine comes from',
      walkInFullPayment:
        'A walk-in sale must be paid in full — attach a patient to leave a balance'
    }
  },

  consultantFees: {
    entity: 'Consultant fee',
    newFee: 'New Fee',
    title: 'Consultant Fees',
    description: 'What each consultant earns when a service they performed is billed',
    empty: 'No consultant fees configured — services billed for these doctors will earn nothing',
    editAria: 'Edit fee',
    deleteAria: 'Delete fee',
    filterConsultant: 'Filter by consultant',
    allConsultants: 'All consultants',
    deleteTitle: 'Delete consultant fee',
    deleteBody:
      'Remove this rate for {{name}}? Earnings already recorded on past invoices are not affected.',
    thisConsultant: 'this consultant',

    column: {
      consultant: 'Consultant',
      service: 'Service',
      fee: 'Fee'
    },

    feeKind: {
      ofLine: 'of line',
      perUnit: 'per unit'
    },

    modal: {
      editTitle: 'Edit consultant fee',
      newTitle: 'New consultant fee',
      description:
        'What this consultant earns when this service is billed. The rate is copied onto each invoice, so changing it here affects future billing only — it never moves what has already been earned.',
      consultant: 'Consultant',
      selectConsultant: 'Select a consultant',
      service: 'Service',
      selectService: 'Select a service',
      feeType: 'Fee type',
      percentage: 'Percentage of the line',
      fixed: 'Fixed amount per unit',
      percentageLabel: 'Percentage',
      amountLabel: 'Amount',
      percentageHint: 'Share of the discounted line total.',
      fixedHint: 'Paid once per unit billed.',
      activeHint: 'Inactive rates are ignored when an invoice is raised.'
    },

    validation: {
      consultantRequired: 'Consultant is required',
      serviceRequired: 'Service is required',
      valueRequired: 'Value is required',
      valueFormat: 'Enter an amount with at most two decimals',
      percentageMax: 'A percentage cannot exceed 100'
    }
  },

  consultantEarnings: {
    title: 'Consultant Earnings',
    description:
      'Fees earned on billed services, frozen at the rate that applied when the invoice was raised',
    heading: 'Earnings {{from}} – {{to}}',
    totalPayable: 'Total payable',
    individualServices: 'Individual services',
    emptySummary: 'No consultant earnings in this period',
    emptyDetail: 'No services credited to a consultant in this period',
    allConsultants: 'All consultants',
    column: {
      consultant: 'Consultant',
      services: 'Services',
      patients: 'Patients',
      earned: 'Earned',
      service: 'Service',
      patient: 'Patient',
      invoice: 'Invoice',
      rate: 'Rate',
      billed: 'Billed'
    }
  }
} as const;
