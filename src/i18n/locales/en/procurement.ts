/** Goods received notes: the list, the receiving form and the printed note. */
export const procurement = {
  grn: {
    title: 'Goods Received',
    description: 'Deliveries booked in against a vendor invoice',
    searchPlaceholder: 'Search by GRN no or vendor invoice no...',
    empty: 'No deliveries received',
    receive: 'Receive Goods',
    back: 'Back to deliveries',

    column: {
      grnNo: 'GRN No',
      vendor: 'Vendor',
      theirInvoice: 'Their invoice',
      net: 'Net',
      invoiceDate: 'Invoice date',
      received: 'Received'
    },

    detail: {
      notFound: 'This delivery could not be loaded.',
      subtitle: '{{vendor}} · their invoice {{invoice}} · {{date}}',
      unnamedVendor: 'Vendor',
      receivedBy: 'received by {{user}}',
      noteTitle: 'Goods received note',
      vendor: 'Vendor',
      noLines: 'This delivery has no lines.',
      untrackedLot: 'untracked lot',
      traceLot: 'Trace this lot',
      batchLeft: '{{count}} left',
      expiry: 'exp {{date}}',
      cancelled: 'cancelled',
      returned: 'returned',
      returnAria: 'Return to vendor',
      cancelAria: 'Cancel line',

      header: {
        item: 'Item',
        store: 'Store',
        batches: 'Batches',
        cost: 'Cost',
        qty: 'Qty',
        amount: 'Amount'
      },

      subtotal: 'Subtotal',
      discount: 'Discount',
      tax: 'Tax {{rate}}%',
      netAmount: 'Net amount',

      returnModal: {
        title: 'Return to vendor',
        description:
          'This takes the quantity back out of stock. It is refused if the stock has already been sold, transferred or consumed.',
        quantity: 'Quantity',
        batch: 'Batch',
        batchHint: 'Leave unset to take it from the batches automatically.',
        auto: 'Choose automatically',
        batchOption: '{{batch}} — {{count}} left',
        submit: 'Return'
      },

      cancelModal: {
        title: 'Cancel this line',
        confirm: 'Cancel line',
        body: 'Void the {{qty}} × {{item}} on this delivery? Its stock is removed. This is refused if any of it has already moved.',
        unnamedItem: 'item'
      },

      toast: {
        returned: 'Returned to the vendor and taken out of stock',
        returnFailed: 'Failed to return the line',
        cancelled: 'Line cancelled and its stock removed',
        cancelFailed: 'Failed to cancel the line'
      }
    },

    form: {
      title: 'Receive goods',
      subtitle: 'Stock goes onto the shelf as soon as this is saved, in the batches entered here.',
      draftDescription: 'an unfinished delivery',

      vendor: 'Vendor',
      selectVendor: 'Select a vendor',
      noCategory: 'No "GRN Category" list configured yet.',
      selectCategory: 'Select a category',
      invoiceNo: 'Vendor invoice no',
      invoiceNoHint: 'Theirs, not ours.',
      invoiceDate: 'Invoice date',
      receiveInto: 'Receive into',
      receiveIntoHint: 'Seeds every new line.',

      receivedLines: 'Received lines',
      addLine: 'Add line',
      item: 'Item',
      selectItem: 'Select an item',
      store: 'Store',
      removeLine: 'Remove line',
      qty: 'Qty',
      quantityIn: 'Quantity in {{unit}}',
      quantity: 'Quantity',
      costPer: 'Cost / {{unit}}',
      costPrice: 'Cost price',
      lineDiscount: 'Line discount',
      addsToStock: 'adds {{qty}} to stock',

      batches: 'Batches',
      batchesAccounted: '{{sum}} of {{total}} accounted for',
      addBatch: 'Batch',
      noBatches: 'None — received as one untracked lot with no expiry.',
      batchNo: 'Batch no',
      batchNumber: 'Batch number',
      batchQty: 'Batch quantity',
      expiryDate: 'Expiry date',
      removeBatch: 'Remove batch',

      summary: 'Delivery summary',
      overDiscounted: 'The discount is larger than the delivery.',
      mismatchOne: 'A line’s batch quantities do not add up to the line quantity.',
      mismatchMany: 'Some lines’ batch quantities do not add up to the line quantity.',
      discount: 'Discount',
      taxPercent: 'Tax %',
      submit: 'Receive delivery',
      draftSaved: 'Draft saved — this delivery survives a refresh',

      toast: {
        received: '{{number}} received',
        failed: 'Failed to receive the delivery',
        selectVendor: 'Select the vendor',
        selectCategory: 'Select the GRN category',
        enterInvoiceNo: "Enter the vendor's invoice number",
        addLine: 'Add at least one line',
        needStore: 'Every line needs a store',
        batchMismatch: 'A line’s batch quantities do not add up to the line quantity',
        overDiscounted: 'The discount is larger than the delivery'
      }
    }
  }
} as const;
