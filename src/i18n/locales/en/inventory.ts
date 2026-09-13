/**
 * Stock: the balance report, the five stock documents, the lot trace and the
 * forms that post movements.
 */
export const inventory = {
  balance: {
    title: 'Stock Balance',
    description: 'Quantity on hand and its value, per item and store',
    searchPlaceholder: 'Search by item code or name...',
    empty: 'No stock records found',
    filterStore: 'Filter by store',
    allStores: 'All stores',
    belowReorder: 'Below reorder level',

    column: {
      itemCode: 'Item Code',
      item: 'Item',
      store: 'Store',
      onHand: 'On hand',
      reorderAt: 'Reorder at',
      salePrice: 'Sale price',
      stockCost: 'Stock cost',
      stockValue: 'Stock value'
    },

    low: 'low',
    unvalued: 'unvalued',
    partial: 'partial',
    unvaluedHint: '{{qty}} have no cost recorded',

    showBatches: 'Show batches',
    hideBatches: 'Hide batches'
  },

  /** The batch drill-down under a stock balance row. */
  batches: {
    loading: 'Loading batches...',
    failed: 'Those batches could not be loaded',
    empty: 'No batches with stock left',
    policyLabel: 'Issue order:',
    policyHint: 'Listed in the order the next sale would draw from them.',
    nextOut: 'next out',
    noExpiry: 'no expiry',
    expired: 'expired',
    unvalued: 'unvalued',
    inDays: 'in {{days}}d',
    total: '{{count}} batch(es)',
    drift:
      'The recorded balance is {{recorded}} but the batches add up to {{batches}}. Something wrote stock without going through the stock service — run a stock count to correct it.',

    column: {
      order: '#',
      batchNo: 'Batch',
      received: 'Received',
      expiry: 'Expiry',
      onHand: 'On hand',
      costPrice: 'Unit cost',
      stockCost: 'Value'
    }
  },

  /** Names for the three issue policies, used on several screens. */
  policy: {
    fefo: {
      label: 'FEFO — first expired',
      short: 'FEFO',
      description: 'The batch expiring soonest goes first. The right choice for medicine.'
    },
    fifo: {
      label: 'FIFO — first in',
      short: 'FIFO',
      description: 'The oldest receipt goes first. The usual warehouse convention.'
    },
    lifo: {
      label: 'LIFO — last in',
      short: 'LIFO',
      description: 'The newest receipt goes first.'
    }
  },

  expiry: {
    title: 'Expiry Report',
    description: 'Batches that are about to expire, and those that already have',
    searchPlaceholder: 'Search by item, code or batch number...',
    empty: 'Nothing is expiring in this window',
    filterStore: 'Filter by store',
    filterStatus: 'Filter by status',
    filterWindow: 'Expiry window',
    allStatuses: 'All statuses',
    defaultWindow: 'Default window',
    window: 'Next {{days}} days',
    expiredDays: '{{days}}d ago',

    status: {
      expired: 'Already expired',
      critical: 'Critical',
      warning: 'Upcoming'
    },

    column: {
      expiry: 'Expires',
      itemCode: 'Item Code',
      item: 'Item',
      batchNo: 'Batch',
      store: 'Store',
      qty: 'On hand',
      atRisk: 'At risk'
    }
  },

  /** The stock card: one item's movements, in order, with the balance after each. */
  ledger: {
    title: 'Stock Ledger',
    description: 'Every movement of one item, in order, with the balance after each',

    pickItem: 'Choose an item to open its ledger',
    pickItemHint:
      'The ledger runs one item at a time — it is that item’s balance that has to add up.',
    searchPlaceholder: 'Search by item code or name...',
    searching: 'Searching...',
    noItems: 'No item matches that',
    changeItem: 'Change item',
    failed: 'That ledger could not be loaded',

    allStores: 'All stores',
    allStoresNote:
      'Across every store, so a transfer between two of them appears twice and nets to nothing.',

    openingBalance: 'Opening balance',
    received: 'Received in',
    issued: 'Issued out',
    closingBalance: 'Closing balance',
    /** Only rendered when the period ends before today, so the two differ. */
    onHandNote: 'On hand now: {{qty}}',
    broughtForward: 'Brought forward',
    carriedForward: 'Carried forward',
    period: '{{from}} to {{to}}',

    reconciled: 'Ledger agrees with the stock balance',
    reconciledHint:
      'Every movement ever posted adds up to exactly what the stock record says is on the shelf.',
    driftTitle: 'The ledger and the stock balance disagree',
    driftBody:
      'The stock record says {{recorded}} but every movement ever posted adds up to {{ledger}} — a difference of {{drift}}. Something wrote stock without going through the stock service. Run a stock count to correct it.',

    usageTitle: 'Where it came from, and where it went',
    usageHint: '— choose one to narrow the lines below',
    /** The two directions behind a net figure, for a document type that moves both ways. */
    usageSplit: '+{{in}} in · −{{out}} out',
    usageEmpty: 'Nothing moved in this period.',
    movements_one: '{{count}} movement',
    movements_other: '{{count}} movements',

    filtered: 'Showing {{type}} only',
    filteredBalanceNote:
      'The running balance is put away while a filter is on: these lines are a selection, not a continuous history, and a balance down them would be a figure the item never stood at.',
    showAll: 'Show every movement',

    linesTitle: 'Movements',
    empty: 'Nothing moved in this period',
    traceLot: 'Trace this lot',

    column: {
      date: 'Date',
      document: 'Document',
      reference: 'Reference',
      store: 'Store',
      batch: 'Batch',
      in: 'In',
      out: 'Out',
      balance: 'Balance'
    },

    direction: {
      in: 'Received',
      out: 'Issued'
    },

    /** The ten documents that can move stock, as item_transition records them. */
    referenceType: {
      open: 'Opening stock',
      grn: 'Goods received',
      return_grn: 'Returned to vendor',
      transfer: 'Transfer',
      invoice: 'Invoice',
      refund_invoice: 'Invoice refund',
      pharmacy: 'Pharmacy sale',
      damage: 'Damage',
      adjustment: 'Stock count',
      consumption: 'Internal use'
    }
  },

  settings: {
    title: 'Inventory Settings',
    description: 'Which batch leaves the shelf first, and when expiry is reported',
    failed: 'Those settings could not be loaded',
    saved: 'Inventory settings updated',
    storeSaved: 'Store issue policy updated',

    guard: {
      title: 'Expiry always wins',
      body:
        'A batch with an expiry date is always issued soonest-expiry first, whatever the policy says. FIFO and LIFO order only the batches with no expiry date — so the setting is fully in force in a general store and has little effect in a pharmacy, which is deliberate.'
    },

    default: {
      title: 'System default',
      description: 'Applies to every store that does not set its own.'
    },

    expiry: {
      title: 'Expiry reporting',
      description: 'How far ahead the expiry report and the alert badge look.',
      alertDays: 'Alert window (days)',
      alertHint: 'Batches expiring within this many days appear on the report.',
      criticalDays: 'Critical window (days)',
      criticalHint: 'Batches this close to expiry are flagged as critical.',
      criticalTooWide: 'The critical window cannot be wider than the alert window'
    },

    stores: {
      title: 'Per-store policy',
      description:
        'Every store is listed, including the ones following the default — a list of exceptions could not be read as a full picture.',
      inherit: 'System default ({{policy}})',
      expiryStillWins: 'expiry still decides dated batches',

      type: {
        medical: 'Medical',
        general: 'General'
      },

      column: {
        store: 'Store',
        type: 'Type',
        policy: 'Policy',
        effective: 'In effect'
      }
    }
  },

  /** One list serves all five documents; only these words differ. */
  document: {
    'stock-opens': {
      title: 'Opening Balances',
      description: 'Stock booked in when a store first started tracking it',
      numberHeader: 'Opening No',
      dateHeader: 'Opening date',
      createLabel: '',
      empty: 'No opening balances recorded'
    },
    'stock-transfers': {
      title: 'Stock Transfers',
      description: 'Stock moved between stores',
      numberHeader: 'Transfer No',
      dateHeader: 'Transfer date',
      createLabel: 'New Transfer',
      empty: 'No stock transfers recorded'
    },
    'stock-damages': {
      title: 'Damaged Stock',
      description: 'Stock written off as broken, spoiled or expired',
      numberHeader: 'Damage No',
      dateHeader: 'Damage date',
      createLabel: 'Write Off',
      empty: 'No damaged stock recorded'
    },
    'stock-consumptions': {
      title: 'Internal Consumption',
      description: 'Stock used by wards and departments rather than sold',
      numberHeader: 'Consumption No',
      dateHeader: 'Used on',
      createLabel: 'Record Use',
      empty: 'No internal consumption recorded'
    },
    'stock-adjustments': {
      title: 'Stock Counts',
      description: 'Corrections after counting what is actually on the shelf',
      numberHeader: 'Adjustment No',
      dateHeader: 'Count date',
      createLabel: 'New Count',
      empty: 'No stock counts recorded'
    }
  },

  lot: {
    tracing: 'Tracing the lot...',
    goBack: 'Go back',
    notFound: 'That lot could not be traced',
    title: 'Lot {{number}}',
    subtitle: '{{code}} — {{name}}',
    tracedByBatchWarning:
      'This lot has no receiving document recorded, so it was traced by batch number alone. If another delivery of {{item}} reused the number {{number}}, it will appear here too — check each line before acting on it.',

    stillOnHand: 'Still on hand',
    dispensedToPatients: 'Dispensed to patients',
    expires: 'Expires',
    receivedOn: 'Received on',

    whereItIs: 'Where it is now',
    storeCount_one: '({{count}} store)',
    storeCount_other: '({{count}} stores)',
    noStores: 'This lot is not held in any store.',

    whoReceived: 'Who received it',
    patientCount_one: '({{count}} patient)',
    patientCount_other: '({{count}} patients)',
    recipientsNote:
      'Cancelled and fully returned lines are left out — that medicine came back. A line returned in part is listed, because the rest of it is still with the patient.',
    noRecipients: 'None of this lot has been dispensed to a patient.',

    column: {
      store: 'Store',
      received: 'Received',
      onHand: 'On hand',
      patient: 'Patient',
      contact: 'Contact',
      dispensed: 'Dispensed',
      document: 'Document',
      qty: 'Qty'
    }
  },

  picker: {
    chooseStoreFirst: 'Choose a store first.',
    placeholder: "Search this store's stock by item code or name...",
    searching: 'Searching...',
    noResults: 'Nothing matching in this store'
  },

  move: {
    linesCleared: 'Lines cleared — they belonged to the previous store',
    stockToMove: 'Stock to move',
    addStock: 'Add stock',
    nothingAdded: 'Nothing added yet.',
    onHand: '{{qty}} on hand',
    onlyOnHand: 'Only {{qty}} on hand.',
    removeLine: 'Remove line',
    lineRemarks: 'Line remarks',
    summary: 'Summary',
    lines: 'Lines',
    units: '{{count}} units',
    overDrawn: 'A quantity is higher than what is on hand.',
    remarks: 'Remarks',
    selectStore: 'Select a store',
    date: 'Date'
  },

  transfer: {
    back: 'Back to transfers',
    title: 'Transfer stock',
    subtitle: 'Moves stock between stores, batch for batch, so expiry dates travel with it.',
    from: 'From',
    to: 'To',
    differentStore: 'Pick a different store',
    movePlaceholder: 'Move',
    qtyAria: 'Transfer quantity for {{item}}',
    qtyAriaWithUnit: 'Transfer quantity for {{item}} in {{unit}}',
    lineNote: 'Note for this line',
    submit: 'Post transfer',

    toast: {
      posted: 'Transfer posted',
      failed: 'Failed to post the transfer',
      selectFrom: 'Choose the store the stock is leaving',
      selectTo: 'Choose the store the stock is going to',
      sameStore: 'The two stores must be different',
      addLine: 'Add at least one line with a quantity',
      overDrawn: 'A quantity is higher than what is on hand'
    }
  },

  issue: {
    back: 'Back',
    store: 'Store',
    valueAtSalePrice: 'Value at sale price',
    lineReason: 'Reason for this line',
    qtyAria: '{{label}} quantity for {{item}}',
    qtyAriaWithUnit: '{{label}} quantity for {{item}} in {{unit}}',
    noEditNote: 'Posted documents cannot be edited — correct a mistake with another document.',

    kind: {
      damage: {
        title: 'Write off damaged stock',
        lede: 'Stock leaves the shelf and is gone. Use this for breakages, spoilage and expiry.',
        qtyLabel: 'Damaged',
        action: 'Write off'
      },
      consumption: {
        title: 'Record internal consumption',
        lede: 'Stock used by a ward or department rather than sold to a patient.',
        qtyLabel: 'Used',
        action: 'Record use'
      }
    },

    toast: {
      recorded: '{{action}} recorded',
      failed: 'Failed to post the document',
      selectStore: 'Choose a store',
      addLine: 'Add at least one line with a quantity',
      overDrawn: 'A quantity is higher than what is on hand'
    }
  },

  count: {
    back: 'Back to adjustments',
    title: 'Stock count',
    subtitle:
      'Enter what is actually on the shelf. The difference against the system is worked out for you.',
    draftDescription: 'an unfinished count',
    countDate: 'Count date',
    countedStock: 'Counted stock',
    loadingBatches: 'Loading batches...',
    nothingAdded: 'Nothing added yet. Picking an item adds a row for each of its batches.',
    batch: 'batch',
    expiry: 'exp {{date}}',
    systemSays: 'system says {{qty}}',
    expired: 'expired — write off',
    countedPlaceholder: 'Counted',
    qtyAria: 'Counted quantity for {{item}} batch {{batch}}',
    qtyAriaWithUnit: 'Counted quantity for {{item}} batch {{batch}} in {{unit}}',
    notCounted: 'not counted',
    matches: 'matches',
    lineNote: 'Why the count differs',

    summary: 'Count summary',
    counted: 'Counted',
    countedOf: '{{counted}} of {{total}}',
    shortages: 'Shortages',
    surpluses: 'Surpluses',
    linesChanging: 'Lines changing',
    allMatch: 'Everything counted matches the system.',
    submit: 'Post adjustment',
    draftSaved: 'Draft saved — this count survives a refresh',

    toast: {
      posted: 'Adjustment posted',
      failed: 'Failed to post the adjustment',
      selectStore: 'Choose a store',
      enterCount: 'Enter a counted quantity on at least one line',
      noBatches: '{{item}} has no batch with stock left to count'
    }
  },

  documentColumn: {
    lines: 'Lines',
    remarks: 'Remarks',
    posted: 'Posted'
  }
} as const;
