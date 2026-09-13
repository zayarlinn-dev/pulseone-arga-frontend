/** Dispensing, pharmacy sales and counter returns. */
export const pharmacy = {
  sales: {
    title: 'Pharmacy Sales',
    description: 'Medicines dispensed, and the stock they came out of',
    searchPlaceholder: 'Search by sale no or transaction reference...',
    empty: 'No pharmacy sales found',
    dispense: 'Dispense',
    back: 'Back to pharmacy sales',

    column: {
      saleNo: 'Sale No',
      patient: 'Patient',
      prescribedBy: 'Prescribed by',
      net: 'Net',
      paid: 'Paid',
      method: 'Method',
      dispensed: 'Dispensed'
    },

    owing: '{{amount}} owing',

    status: {
      paid: 'Paid',
      unpaid: 'Unpaid',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    },

    filter: {
      label: 'Filter by status',
      all: 'All statuses'
    }
  },

  saleDetail: {
    notFound: 'This sale could not be loaded.',
    back: 'Back to sales',
    dispensedOn: 'Dispensed {{date}}',
    dispensedBy: 'by {{user}}',
    takePayment: 'Take payment',
    cancel: 'Cancel',
    receiptTitle: 'Pharmacy receipt',
    phone: 'Tel {{number}}',
    patient: 'Patient',
    prescribedBy: 'Prescribed by',
    overTheCounter: 'Over the counter',
    visit: 'Visit',

    // The letterhead block, worded to match the bill's — a patient handed both
    // in one visit should not have to read two different receipts.
    meta: {
      saleNo: 'Sale no.',
      date: 'Date',
      patientNo: 'Patient no.',
      patientPhone: 'Phone',
      dispensedBy: 'Dispensed by',
      transactionNo: 'Transaction ref.'
    },

    header: {
      no: 'No.',
      item: 'Description',
      price: 'Unit price',
      qty: 'Qty',
      amount: 'Amount'
    },
    unnamedItem: 'Item #{{id}}',
    batch: 'batch {{number}}',
    expiry: 'exp {{date}}',
    noLines: 'This sale has no lines.',
    subtotal: 'Subtotal',
    subtotalIn: 'Subtotal ({{currency}})',
    discount: 'Discount',
    discountPercent: 'Discount {{rate}}%',
    tax: 'Tax {{rate}}%',
    netAmount: 'Net amount',
    paidBy: 'Paid ({{method}})',
    change: 'Change',
    balanceOwing: 'Balance owing',
    voided: 'This sale was {{status}}.',
    thanks: 'Thank you for your visit.',
    printedAt: 'Printed {{date}}',
    signature: {
      pharmacist: 'Pharmacist',
      received: 'Received by'
    },

    payModal: {
      title: 'Take payment',
      description:
        '{{amount}} is outstanding on {{number}}. The sale settles once it is paid in full.',
      amount: 'Amount received',
      paidBy: 'Paid by',
      reference: 'Transaction reference',
      submit: 'Record payment'
    },

    cancelModal: {
      title: 'Cancel sale',
      description:
        '{{number}} is voided and every packet goes back into the batch it came from. Only do this if the medicine is physically back on the shelf.',
      keep: 'Keep sale',
      confirm: 'Cancel sale'
    },

    toast: {
      paid: 'Payment recorded',
      payFailed: 'Failed to record payment',
      cancelled: 'Sale cancelled — the medicine is back on the shelf',
      cancelFailed: 'Failed to cancel sale'
    }
  },

  dispense: {
    title: 'Dispense medicine',
    subtitle: 'Stock leaves the shelf as soon as this is saved, soonest-expiry batch first.',
    patient: 'Patient',
    dispenseFrom: 'Dispense from',
    selectStore: 'Select a store',
    prescribedBy: 'Prescribed by',
    prescribedByHint: 'Optional — for an over-the-counter sale, leave unset.',
    notRecorded: 'Not recorded',

    medicines: 'Medicines',
    addLine: 'Add line',
    medicine: 'Medicine',
    chooseStoreFirst: 'Choose a store first',
    loadingItems: 'Loading items...',
    selectMedicine: 'Select a medicine',
    quantityIn: 'Quantity in {{unit}}',
    quantity: 'Quantity',
    qty: 'Qty',
    discountPercent: 'Disc %',
    discountAria: 'Line discount percentage',
    removeLine: 'Remove line',
    remarksPlaceholder: 'Dosage / remarks',
    lineTotal: 'Line total',
    onHand: '{{qty}} on hand',
    notEnough: ' — not enough for this line',
    dispenses: 'dispenses {{note}}',

    summary: 'Sale summary',
    subtotal: 'Subtotal',
    discountRate: 'Discount {{rate}}%',
    discount: 'Discount',
    tax: 'Tax {{rate}}%',
    netAmount: 'Net amount',
    overDiscounted: 'The discount is larger than the sale.',
    discountPercentLabel: 'Discount %',
    discountAmountLabel: 'Discount amount',
    taxPercentLabel: 'Tax %',
    paidBy: 'Paid by',
    amountReceived: 'Amount received',
    amountReceivedHint: 'Leave at zero to dispense on account.',
    transactionRef: 'Transaction reference',
    changeDue: 'Change due',
    submitPaid: 'Dispense & take payment',
    submitAccount: 'Dispense on account',

    toast: {
      dispensed: '{{number}} dispensed',
      failed: 'Failed to dispense',
      selectPatient: 'Select a patient first',
      selectStore: 'Select the store to dispense from',
      addMedicine: 'Add at least one medicine',
      wholeQty: 'Every quantity must be a whole number of 1 or more',
      overDiscounted: 'The discount is larger than the sale'
    }
  },

  returnForm: {
    back: 'Back to returns',
    title: 'Return medicine',
    subtitle:
      'Only accept a return once the medicine is physically back — this puts it straight into sellable stock.',
    patient: 'Patient',
    dispensedMedicine: 'Dispensed medicine',
    dispensedHint: 'Everything this patient has been given that has not come back yet.',
    findPatient: 'Find a patient to see what they can return.',
    nothingOutstanding:
      'Nothing outstanding — this patient has no dispensed medicine left to return.',
    batch: 'batch {{number}}',
    canReturn: '{{left}} of {{sold}} can be returned',
    alreadyBack: '{{count}} already back',
    qtyAria: 'Return quantity for {{item}}',
    ofTotal: 'of {{amount}}',

    summary: 'Return summary',
    lines: 'Lines',
    units: '{{count}} units',
    amountBack: 'Amount back',
    overQty: 'A quantity is higher than what can be returned.',
    reason: 'Reason',
    noReasonCategory: 'No "Return Reason" category configured yet.',
    selectReason: 'Select a reason',
    refundedBy: 'Refunded by',
    transactionRef: 'Transaction reference',
    submit: 'Accept return',

    toast: {
      recorded: 'Return recorded and the medicine is back in stock',
      failed: 'Failed to record the return',
      selectPatient: 'Select a patient first',
      selectReason: 'Choose why the medicine is coming back',
      enterQty: 'Enter a quantity on at least one line',
      overQty: 'A quantity is higher than what can be returned'
    }
  },

  returns: {
    title: 'Pharmacy Returns',
    description: 'Medicine handed back at the counter and put into sellable stock',
    empty: 'No returns recorded',
    newReturn: 'New Return',
    column: {
      patient: 'Patient',
      reason: 'Reason',
      value: 'Value',
      refunded: 'Refunded',
      method: 'Method',
      returned: 'Returned'
    }
  }
} as const;
