import type { Translations } from '@/i18n/locales/types';
import type { pharmacy as source } from '@/i18n/locales/en/pharmacy';

export const pharmacy: Translations<typeof source> = {
  sales: {
    title: 'ဆေးဆိုင် ရောင်းချမှုများ',
    description: 'ထုတ်ပေးခဲ့သော ဆေးဝါးများနှင့် ၎င်းတို့ ထုတ်ယူခဲ့သည့် လက်ကျန်',
    searchPlaceholder: 'ရောင်းချမှုနံပါတ် သို့မဟုတ် ငွေလွှဲကိုးကားနံပါတ်ဖြင့် ရှာရန်…',
    empty: 'ဆေးဆိုင် ရောင်းချမှု မတွေ့ရှိပါ',
    dispense: 'ဆေးထုတ်ပေးမည်',
    back: 'ဆေးဆိုင်ရောင်းချမှုစာရင်းသို့ ပြန်သွားမည်',

    column: {
      saleNo: 'ရောင်းချမှု နံပါတ်',
      patient: 'လူနာ',
      prescribedBy: 'ညွှန်းသူ ဆရာဝန်',
      net: 'အသားတင် ပမာဏ',
      paid: 'ပေးချေပြီး',
      method: 'ပေးချေနည်း',
      dispensed: 'ထုတ်ပေးသည့်အချိန်'
    },

    owing: '{{amount}} ကျန်ရှိ',

    status: {
      paid: 'ပေးချေပြီး',
      unpaid: 'မပေးချေရသေး',
      cancelled: 'ပယ်ဖျက်ပြီး',
      refunded: 'ငွေပြန်အမ်းပြီး'
    },

    filter: {
      label: 'အခြေအနေဖြင့် စစ်ထုတ်ရန်',
      all: 'အခြေအနေ အားလုံး'
    }
  },

  saleDetail: {
    notFound: 'ဤရောင်းချမှုကို မဖွင့်နိုင်ပါ။',
    back: 'ရောင်းချမှုစာရင်းသို့ ပြန်သွားမည်',
    dispensedOn: '{{date}} တွင် ထုတ်ပေးခဲ့သည်',
    dispensedBy: '{{user}} မှ',
    takePayment: 'ငွေလက်ခံမည်',
    cancel: 'ပယ်ဖျက်မည်',
    receiptTitle: 'ဆေးဆိုင် ငွေလက်ခံဖြတ်ပိုင်း',
    phone: 'ဖုန်း {{number}}',
    patient: 'လူနာ',
    prescribedBy: 'ညွှန်းသူ ဆရာဝန်',
    overTheCounter: 'ကောင်တာမှ တိုက်ရိုက်',
    visit: 'ပြသမှု',

    meta: {
      saleNo: 'ရောင်းချမှုအမှတ်',
      date: 'ရက်စွဲ',
      patientNo: 'လူနာအမှတ်',
      patientPhone: 'ဖုန်းနံပါတ်',
      dispensedBy: 'ထုတ်ပေးသူ',
      transactionNo: 'ငွေလွှဲအမှတ်'
    },

    header: {
      no: 'စဉ်',
      item: 'အမျိုးအမည်',
      price: 'နှုန်း',
      qty: 'အရေအတွက်',
      amount: 'ပမာဏ'
    },
    unnamedItem: 'ပစ္စည်း #{{id}}',
    batch: 'ဘက်ခ်ျ {{number}}',
    expiry: 'သက်တမ်း {{date}}',
    noLines: 'ဤရောင်းချမှုတွင် စာကြောင်း မရှိပါ။',
    subtotal: 'ပေါင်းလဒ်',
    subtotalIn: 'ပေါင်းလဒ် ({{currency}})',
    discount: 'လျှော့စျေး',
    discountPercent: 'လျှော့စျေး {{rate}}%',
    tax: 'အခွန် {{rate}}%',
    netAmount: 'အသားတင် ပမာဏ',
    paidBy: 'ပေးချေပြီး ({{method}})',
    change: 'ပြန်အမ်းငွေ',
    balanceOwing: 'ကျန်ရှိငွေ',
    voided: 'ဤရောင်းချမှုသည် {{status}} ဖြစ်ပါသည်။',
    thanks: 'လာရောက်ပြသသည့်အတွက် ကျေးဇူးတင်ပါသည်။',
    printedAt: 'ထုတ်ယူချိန် {{date}}',
    signature: {
      pharmacist: 'ဆေးဝါးကျွမ်းကျင်သူ',
      received: 'လက်ခံသူ'
    },

    payModal: {
      title: 'ငွေလက်ခံမည်',
      description: '{{number}} တွင် {{amount}} ကျန်ရှိနေပါသည်။ အပြည့်ပေးချေမှသာ ပြီးပြတ်ပါမည်။',
      amount: 'လက်ခံရရှိငွေ',
      paidBy: 'ပေးချေနည်း',
      reference: 'ငွေလွှဲ ကိုးကားနံပါတ်',
      submit: 'ငွေပေးချေမှု မှတ်တမ်းတင်မည်'
    },

    cancelModal: {
      title: 'ရောင်းချမှု ပယ်ဖျက်မည်',
      description:
        '{{number}} ကို ပယ်ဖျက်ပြီး ဆေးအားလုံးကို မူလဘက်ခ်ျသို့ ပြန်ထည့်ပါမည်။ ဆေးများ စင်ပေါ်သို့ အမှန်တကယ် ပြန်ရောက်မှသာ လုပ်ဆောင်ပါ။',
      keep: 'ဆက်ထားမည်',
      confirm: 'ရောင်းချမှု ပယ်ဖျက်မည်'
    },

    toast: {
      paid: 'ငွေပေးချေမှုကို မှတ်တမ်းတင်ပြီးပါပြီ',
      payFailed: 'ငွေပေးချေမှုကို မှတ်တမ်းတင်၍ မရပါ',
      cancelled: 'ရောင်းချမှုကို ပယ်ဖျက်ပြီး — ဆေးများ လက်ကျန်သို့ ပြန်ရောက်ပါပြီ',
      cancelFailed: 'ရောင်းချမှုကို ပယ်ဖျက်၍ မရပါ'
    }
  },

  dispense: {
    title: 'ဆေးဝါး ထုတ်ပေးမည်',
    subtitle: 'ဤစာမျက်နှာကို သိမ်းလိုက်သည်နှင့် သက်တမ်းအနီးဆုံး ဘက်ခ်ျမှ စတင်၍ လက်ကျန်မှ နုတ်ပါမည်။',
    patient: 'လူနာ',
    dispenseFrom: 'ထုတ်ပေးမည့် စတိုး',
    selectStore: 'စတိုး ရွေးပါ',
    prescribedBy: 'ညွှန်းသူ ဆရာဝန်',
    prescribedByHint: 'ဖြည့်စွက်နိုင်သည် — ကောင်တာမှ တိုက်ရိုက်ရောင်းပါက အလွတ်ထားပါ။',
    notRecorded: 'မှတ်တမ်း မတင်ထားပါ',

    medicines: 'ဆေးဝါးများ',
    addLine: 'စာကြောင်း ထည့်မည်',
    medicine: 'ဆေးဝါး',
    chooseStoreFirst: 'စတိုးကို ဦးစွာ ရွေးပါ',
    loadingItems: 'ပစ္စည်းများ ဖွင့်နေသည်…',
    selectMedicine: 'ဆေးဝါး ရွေးပါ',
    quantityIn: '{{unit}} ဖြင့် အရေအတွက်',
    quantity: 'အရေအတွက်',
    qty: 'အရေအတွက်',
    discountPercent: 'လျှော့ %',
    discountAria: 'စာကြောင်းအလိုက် လျှော့ရာခိုင်နှုန်း',
    removeLine: 'စာကြောင်း ဖယ်ရှားမည်',
    remarksPlaceholder: 'သောက်သုံးပုံ / မှတ်ချက်',
    lineTotal: 'စာကြောင်း ပေါင်း',
    onHand: 'လက်ကျန် {{qty}}',
    notEnough: ' — ဤစာကြောင်းအတွက် မလုံလောက်ပါ',
    dispenses: 'ထုတ်ပေးမည် — {{note}}',

    summary: 'ရောင်းချမှု အနှစ်ချုပ်',
    subtotal: 'ပေါင်းလဒ်',
    discountRate: 'လျှော့စျေး {{rate}}%',
    discount: 'လျှော့စျေး',
    tax: 'အခွန် {{rate}}%',
    netAmount: 'အသားတင် ပမာဏ',
    overDiscounted: 'လျှော့စျေးသည် ရောင်းချမှုပမာဏထက် ပိုနေပါသည်။',
    discountPercentLabel: 'လျှော့စျေး %',
    discountAmountLabel: 'လျှော့စျေး ပမာဏ',
    taxPercentLabel: 'အခွန် %',
    paidBy: 'ပေးချေနည်း',
    amountReceived: 'လက်ခံရရှိငွေ',
    amountReceivedHint: 'အကြွေးအဖြစ် ထုတ်ပေးလိုပါက သုည ထားပါ။',
    transactionRef: 'ငွေလွှဲ ကိုးကားနံပါတ်',
    changeDue: 'ပြန်အမ်းရမည့်ငွေ',
    submitPaid: 'ဆေးထုတ်ပြီး ငွေလက်ခံမည်',
    submitAccount: 'အကြွေးဖြင့် ဆေးထုတ်ပေးမည်',

    toast: {
      dispensed: '{{number}} ကို ထုတ်ပေးပြီးပါပြီ',
      failed: 'ဆေးထုတ်ပေး၍ မရပါ',
      selectPatient: 'လူနာကို ဦးစွာ ရွေးပါ',
      selectStore: 'ထုတ်ပေးမည့် စတိုး ရွေးပါ',
      addMedicine: 'ဆေးဝါး အနည်းဆုံး တစ်ခု ထည့်ပါ',
      wholeQty: 'အရေအတွက်တိုင်း ၁ သို့မဟုတ် ထို့ထက်ကြီးသော ကိန်းပြည့် ဖြစ်ရမည်',
      overDiscounted: 'လျှော့စျေးသည် ရောင်းချမှုပမာဏထက် ပိုနေပါသည်'
    }
  },

  returnForm: {
    back: 'ပြန်အပ်မှုစာရင်းသို့ ပြန်သွားမည်',
    title: 'ဆေးဝါး ပြန်အပ်မှု',
    subtitle:
      'ဆေးဝါးများ အမှန်တကယ် ပြန်ရောက်မှသာ လက်ခံပါ — ဤလုပ်ဆောင်ချက်သည် ရောင်းချနိုင်သော လက်ကျန်သို့ တိုက်ရိုက် ပြန်ထည့်ပါမည်။',
    patient: 'လူနာ',
    dispensedMedicine: 'ထုတ်ပေးထားသော ဆေးဝါးများ',
    dispensedHint: 'ဤလူနာထံ ထုတ်ပေးထားပြီး ပြန်မရောက်သေးသည်များ အားလုံး။',
    findPatient: 'ပြန်အပ်နိုင်သည်များ ကြည့်ရန် လူနာတစ်ဦး ရှာပါ။',
    nothingOutstanding: 'ကျန်ရှိမှု မရှိပါ — ဤလူနာတွင် ပြန်အပ်စရာ ဆေးဝါး မကျန်တော့ပါ။',
    batch: 'ဘက်ခ်ျ {{number}}',
    canReturn: 'စုစုပေါင်း {{sold}} အနက် {{left}} ကို ပြန်အပ်နိုင်သည်',
    alreadyBack: '{{count}} ပြန်ရောက်ပြီး',
    qtyAria: '{{item}} အတွက် ပြန်အပ်မည့် အရေအတွက်',
    ofTotal: 'စုစုပေါင်း {{amount}} အနက်',

    summary: 'ပြန်အပ်မှု အနှစ်ချုပ်',
    lines: 'စာကြောင်း',
    units: '{{count}} ခု',
    amountBack: 'ပြန်အမ်းမည့် ပမာဏ',
    overQty: 'အရေအတွက်သည် ပြန်အပ်နိုင်သည့် ပမာဏထက် ပိုနေပါသည်။',
    reason: 'အကြောင်းအရင်း',
    noReasonCategory: '"Return Reason" အုပ်စုကို မသတ်မှတ်ပါ။',
    selectReason: 'အကြောင်းအရင်း ရွေးပါ',
    refundedBy: 'ပြန်အမ်းသည့် နည်းလမ်း',
    transactionRef: 'ငွေလွှဲ ကိုးကားနံပါတ်',
    submit: 'ပြန်အပ်မှု လက်ခံမည်',

    toast: {
      recorded: 'ပြန်အပ်မှုကို မှတ်တမ်းတင်ပြီး ဆေးများ လက်ကျန်သို့ ပြန်ရောက်ပါပြီ',
      failed: 'ပြန်အပ်မှုကို မှတ်တမ်းတင်၍ မရပါ',
      selectPatient: 'လူနာကို ဦးစွာ ရွေးပါ',
      selectReason: 'ဆေးပြန်အပ်ရသည့် အကြောင်းအရင်း ရွေးပါ',
      enterQty: 'အနည်းဆုံး စာကြောင်းတစ်ခုတွင် အရေအတွက် ထည့်ပါ',
      overQty: 'အရေအတွက်သည် ပြန်အပ်နိုင်သည့် ပမာဏထက် ပိုနေပါသည်'
    }
  },

  returns: {
    title: 'ဆေးဝါး ပြန်အပ်မှုများ',
    description: 'ကောင်တာတွင် ပြန်အပ်ပြီး ရောင်းချနိုင်သော လက်ကျန်သို့ ပြန်ထည့်ထားသော ဆေးဝါးများ',
    empty: 'ပြန်အပ်မှု မှတ်တမ်း မရှိပါ',
    newReturn: 'ပြန်အပ်မှု အသစ်',
    column: {
      patient: 'လူနာ',
      reason: 'အကြောင်းအရင်း',
      value: 'တန်ဖိုး',
      refunded: 'ပြန်အမ်းငွေ',
      method: 'ပေးချေနည်း',
      returned: 'ပြန်အပ်သည့်အချိန်'
    }
  }
};
