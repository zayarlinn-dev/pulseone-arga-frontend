/**
 * The owner's screen: what the hospital earned, what it cost, what was left.
 *
 * The wording here is deliberately careful about one thing — this is *gross*
 * profit. Salaries, rent, utilities and tax are not in this database, so the
 * screen never says "profit" unqualified and never implies the figure is what
 * the owner takes home.
 */
export const management = {
  profitability: {
    title: 'Profitability',
    description: 'What the hospital earned, what it cost, and what was left',

    loadFailed: 'Failed to load the profitability figures',

    filter: {
      heading: 'Period',
      grouping: 'Show by',
      day: 'Day',
      week: 'Week',
      month: 'Month'
    },

    range: {
      label: 'Quick range',
      days7: '7 days',
      days30: '30 days',
      days90: '90 days',
      months12: '12 months'
    },

    /** The four figures at the top. */
    tile: {
      netRevenue: 'Net revenue',
      grossProfit: 'Gross profit',
      margin: 'Gross margin',
      receivables: 'Still owed',
      receivablesHint: 'Billed in this period and not yet collected',
      marginHint: 'Gross profit as a share of net revenue',
      vsPrevious: 'vs {{from}} – {{to}}',
      noPrevious: 'No comparable activity in the previous period'
    },

    /**
     * The caveat under the headline figures. It is not a footnote: a number
     * called "profit" that quietly excludes payroll is the single way this
     * screen could mislead the person it is built for.
     */
    grossOnly: {
      title: 'This is gross profit, not net',
      body:
        'It covers what was billed less what the medicine cost and what the consultants earned. Salaries, rent, utilities, equipment and tax are not recorded in this system, so they are not deducted here.'
    },

    uncosted: {
      title_one: '{{count}} dispensed line has no batch cost',
      title_other: '{{count}} dispensed lines have no batch cost',
      body:
        'Their sale is counted and their cost is not, so gross profit is overstated by whatever they cost. This clears itself as older stock sells through.'
    },

    /** The statement itself, read top to bottom. */
    statement: {
      title: 'Profit statement',
      subtitle: '{{from}} – {{to}}',
      serviceRevenue: 'Service revenue',
      medicineRevenue: 'Medicine revenue',
      grossRevenue: 'Gross revenue',
      discounts: 'Discounts given',
      refunds: 'Refunds',
      returns: 'Medicine returns',
      netRevenue: 'Net revenue',
      medicineCost: 'Cost of medicine sold',
      consultantFees: "Consultants' share",
      grossProfit: 'Gross profit',
      margin: 'Gross margin',
      /** Column heads. */
      line: 'Line',
      amount: 'Amount',
      previous: 'Previous period',
      change: 'Change',
      accrualNote:
        'Revenue is what was billed in the period, whether or not the money has arrived. The dashboard shows cash taken, so the two figures differ while invoices are part-paid.'
    },

    activity: {
      title: 'Activity',
      invoices: 'Invoices',
      patients: 'Patients billed',
      averageInvoice: 'Average invoice'
    },

    trend: {
      title: 'Revenue and cost',
      subtitle: '{{revenue}} earned · {{cost}} of direct cost',
      empty: 'Nothing billed in this period',
      revenue: 'Revenue',
      cost: 'Direct cost',
      headerPeriod: 'Period',
      headerProfit: 'Gross profit'
    },

    profitTrend: {
      title: 'Gross profit',
      subtitle: '{{total}} over the period',
      empty: 'Nothing to show for this period',
      headerPeriod: 'Period',
      headerProfit: 'Gross profit',
      headerMargin: 'Margin'
    },

    sources: {
      title: 'Where the money came from',
      subtitle: 'Revenue by service centre, with the pharmacy as one line',
      empty: 'Nothing billed in this period',
      pharmacy: 'Pharmacy',
      unassigned: 'No service centre set',
      other: 'Other sources',
      headerSource: 'Source',
      headerRevenue: 'Revenue',
      headerCost: 'Direct cost',
      headerProfit: 'Gross profit',
      headerShare: 'Share'
    },

    topItems: {
      title: 'Medicines earning the most',
      subtitle: 'Ranked by gross profit over the period',
      empty: 'No medicine dispensed in this period',
      headerItem: 'Medicine',
      headerQty: 'Dispensed',
      headerRevenue: 'Revenue',
      headerCost: 'Cost',
      headerProfit: 'Gross profit',
      headerMargin: 'Margin'
    },

    payments: {
      title: 'How the money arrived',
      subtitle: 'Cash actually collected, net of change given',
      empty: 'Nothing collected in this period',
      headerMethod: 'Method',
      headerDocuments: 'Documents',
      headerAmount: 'Collected',
      headerShare: 'Share',
      cash: 'Cash',
      banking: 'Banking',
      'e-wallet': 'E-wallet'
    }
  },

  /**
   * The stock screen. Everything here is valued at COST, from the batch — what
   * the hospital paid, not what it hopes to sell for. Retail appears once, as
   * the margin still sitting unsold, and is labelled as such.
   */
  inventory: {
    title: 'Working Capital',
    description: 'What the hospital owns on the shelf, and what it is doing there',

    loadFailed: 'Failed to load the stock figures',

    /** The distinction the whole screen rests on. */
    asOfNow: 'On the shelf now',
    overPeriod: 'Moved in this period',

    tile: {
      stockAtCost: 'Stock at cost',
      stockAtCostHint: 'What the stock on hand was bought for',
      deadStock: 'Not moving',
      deadStockHint: 'No issue in {{days}} days, valued at cost',
      expiring: 'Expiring soon',
      expiringHint: 'At cost, within {{days}} days',
      expired: 'Already expired',
      expiredHint: 'At cost, still on the shelf',
      potentialMargin: 'Unsold margin',
      potentialMarginHint: 'Retail less cost, if all of it sells',
      belowReorder: 'Below reorder level'
    },

    counts: {
      items: 'Items in stock',
      batches: 'Batches',
      received: 'Received',
      issued: 'Sold or dispensed',
      damaged: 'Damaged',
      consumed: 'Consumed'
    },

    costBasis: {
      title: 'Everything here is valued at cost',
      body:
        'Stock is priced from the batch it was bought on, not from its selling price, so these figures are the money tied up rather than the money hoped for. Retail appears only as the unsold margin.'
    },

    unvalued: {
      title_one: '{{count}} batch on the shelf has no cost recorded',
      title_other: '{{count}} batches on the shelf have no cost recorded',
      body:
        'They hold {{qty}} units between them and are counted in none of the values above, so the capital figure is understated by whatever they cost. Stock opened before costs were recorded reads this way.',
      movements_one: '{{count}} movement in this period named no batch, so it could not be costed.',
      movements_other:
        '{{count}} movements in this period named no batch, so they could not be costed.'
    },

    stores: {
      title: 'Where it is standing',
      subtitle: 'Stock at cost, by store',
      empty: 'No store is holding stock',
      headerStore: 'Store',
      headerItems: 'Items',
      headerAtCost: 'At cost',
      headerAtRetail: 'At retail',
      headerShare: 'Share'
    },

    movement: {
      title: 'Stock in and out',
      subtitle: '{{in}} received · {{out}} issued, at cost',
      empty: 'Nothing moved in this period',
      in: 'In',
      out: 'Out',
      headerPeriod: 'Period'
    },

    expiry: {
      title: 'Shelf life',
      subtitle: 'Stock at cost, by how long it has left',
      empty: 'Nothing on the shelf carries an expiry date',
      headerBand: 'Shelf life',
      headerBatches: 'Batches',
      headerQty: 'Quantity',
      headerValue: 'At cost',
      band: {
        expired: 'Already expired',
        days30: 'Within 30 days',
        days90: '31–90 days',
        days180: '91–180 days',
        beyond: 'Over 180 days',
        none: 'No expiry date'
      },
      noneNote:
        '{{value}} of stock carries no expiry date and is not shown on the chart.'
    },

    deadStock: {
      title: 'Money that has stopped moving',
      subtitle: 'Nothing issued in {{days}} days, largest first',
      empty: 'Everything on the shelf has moved recently',
      headerItem: 'Item',
      headerStore: 'Store',
      headerQty: 'On hand',
      headerValue: 'At cost',
      headerIdle: 'Last issued',
      idleDays_one: '{{count}} day ago',
      idleDays_other: '{{count}} days ago',
      neverIssued: 'Never issued'
    },

    vendors: {
      title: 'Where the money went',
      subtitle: 'Received from each vendor over the period',
      empty: 'Nothing received in this period',
      headerVendor: 'Vendor',
      headerNotes: 'Deliveries',
      headerAmount: 'Received',
      headerShare: 'Share'
    }
  }
} as const;
