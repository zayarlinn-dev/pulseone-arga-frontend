import type { Translations } from '@/i18n/locales/types';
import type { common as source } from '@/i18n/locales/en/common';

export const common: Translations<typeof source> = {
  appName: 'PulseOne',
  appTagline: 'ဆေးရုံ စီမံခန့်ခွဲမှုစနစ်',

  action: {
    save: 'သိမ်းမည်',
    saving: 'သိမ်းနေသည်',
    saveChanges: 'ပြင်ဆင်ချက်များ သိမ်းမည်',
    cancel: 'မလုပ်တော့ပါ',
    close: 'ပိတ်မည်',
    create: 'ထည့်သွင်းမည်',
    creating: 'ထည့်သွင်းနေသည်',
    add: 'ထည့်မည်',
    edit: 'ပြင်ဆင်မည်',
    update: 'ပြင်ဆင်မည်',
    updating: 'ပြင်ဆင်နေသည်',
    delete: 'ဖျက်မည်',
    deleting: 'ဖျက်နေသည်',
    remove: 'ဖယ်ရှားမည်',
    confirm: 'အတည်ပြုမည်',
    search: 'ရှာဖွေမည်',
    searchPlaceholder: 'ရှာဖွေရန်…',
    clear: 'ရှင်းလင်းမည်',
    clearFilters: 'စစ်ထုတ်မှု ဖြုတ်မည်',
    reset: 'ပြန်လည်သတ်မှတ်မည်',
    refresh: 'ပြန်လည် ရယူမည်',
    retry: 'ထပ်မံကြိုးစားမည်',
    back: 'နောက်သို့',
    next: 'ရှေ့သို့',
    previous: 'ယခင်',
    print: 'ပရင့်ထုတ်မည်',
    export: 'ထုတ်ယူမည်',
    view: 'ကြည့်ရှုမည်',
    viewAll: 'အားလုံး ကြည့်ရှုမည်',
    details: 'အသေးစိတ်',
    select: 'ရွေးချယ်မည်',
    apply: 'သက်ရောက်စေမည်',
    submit: 'တင်သွင်းမည်',
    submitting: 'တင်သွင်းနေသည်',
    done: 'ပြီးပါပြီ',
    continue: 'ဆက်လက်လုပ်ဆောင်မည်',
    discard: 'ပယ်ဖျက်မည်',
    newItem: '{{item}} အသစ်',
    editItem: '{{item}} ပြင်ဆင်မည်',
    deleteItem: '{{item}} ဖျက်မည်',
    enable: 'ဖွင့်မည်',
    disable: 'ပိတ်မည်'
  },

  print: {
    format: 'စာရွက်အရွယ်အစား',
    a4: 'A4 စာရွက်',
    thermal: '80mm ဘောက်ချာစက်'
  },

  label: {
    actions: 'လုပ်ဆောင်ချက်များ',
    status: 'အခြေအနေ',
    name: 'အမည်',
    code: 'ကုဒ်',
    description: 'ဖော်ပြချက်',
    remark: 'မှတ်ချက်',
    remarks: 'မှတ်ချက်များ',
    notes: 'မှတ်စုများ',
    date: 'ရက်စွဲ',
    time: 'အချိန်',
    createdAt: 'ထည့်သွင်းသည့်ရက်',
    updatedAt: 'နောက်ဆုံး ပြင်ဆင်သည့်ရက်',
    createdBy: 'ပြုလုပ်သူ',
    from: 'မှ',
    to: 'သို့',
    dateFrom: 'စတင်ရက်',
    dateTo: 'ပြီးဆုံးရက်',
    phone: 'ဖုန်းနံပါတ်',
    email: 'အီးမေးလ်',
    address: 'နေရပ်လိပ်စာ',
    total: 'စုစုပေါင်း',
    subtotal: 'ပေါင်းလဒ်',
    grandTotal: 'စုစုပေါင်း ကျသင့်ငွေ',
    quantity: 'အရေအတွက်',
    qty: 'အရေအတွက်',
    unit: 'ယူနစ်',
    price: 'စျေးနှုန်း',
    unitPrice: 'တစ်ခုချင်း စျေးနှုန်း',
    amount: 'ပမာဏ',
    discount: 'လျှော့စျေး',
    tax: 'အခွန်',
    paid: 'ပေးချေပြီး',
    balance: 'လက်ကျန်',
    type: 'အမျိုးအစား',
    category: 'အုပ်စု',
    reference: 'ကိုးကားနံပါတ်',
    reason: 'အကြောင်းအရင်း',
    optional: 'ဖြည့်စွက်နိုင်သည်',
    required: 'မဖြစ်မနေ ဖြည့်ရန်',
    all: 'အားလုံး',
    none: 'မရှိပါ',
    yes: 'ဟုတ်ကဲ့',
    no: 'မဟုတ်ပါ',
    unknown: 'မသိရပါ',
    notSet: 'မသတ်မှတ်ပါ',
    loading: 'ဖွင့်နေသည်…'
  },

  paymentMethod: {
    cash: 'ငွေသား',
    banking: 'ဘဏ်လွှဲ',
    'e-wallet': 'အီးဝေါလက်'
  },

  returnPaymentMethod: {
    Cash: 'ငွေသား',
    Banking: 'ဘဏ်လွှဲ',
    'E-Wallet': 'အီးဝေါလက်'
  },

  status: {
    active: 'အသုံးပြုဆဲ',
    inactive: 'ရပ်ဆိုင်းထား',
    disabled: 'ပိတ်ထားသည်',
    pending: 'စောင့်ဆိုင်းဆဲ',
    completed: 'ပြီးဆုံးပြီး',
    cancelled: 'ပယ်ဖျက်ပြီး',
    draft: 'မူကြမ်း',
    paid: 'ပေးချေပြီး',
    unpaid: 'မပေးချေရသေး',
    partiallyPaid: 'တစ်စိတ်တစ်ပိုင်း ပေးချေပြီး',
    refunded: 'ငွေပြန်အမ်းပြီး',
    open: 'ဖွင့်ထား',
    closed: 'ပိတ်ထား',
    approved: 'အတည်ပြုပြီး',
    rejected: 'ငြင်းပယ်ပြီး'
  },

  table: {
    noResults: 'မှတ်တမ်း မတွေ့ရှိပါ',
    noResultsHint: 'ရှာဖွေမှု သို့မဟုတ် စစ်ထုတ်မှုကို ပြင်ဆင်ကြည့်ပါ။',
    empty: 'မှတ်တမ်း မရှိသေးပါ',
    loading: 'ဖွင့်နေသည်…',
    error: 'စာရင်းကို မဖွင့်နိုင်ပါ',
    emptyOf: '{{items}} မတွေ့ရှိပါ',
    rowsSelected_one: '{{count}} ခု ရွေးထားသည်',
    rowsSelected_other: '{{count}} ခု ရွေးထားသည်'
  },

  pagination: {
    noRecords: 'မှတ်တမ်း မရှိပါ',
    rows: 'တစ်မျက်နှာလျှင်',
    showing: 'စုစုပေါင်း {{total}} ခုအနက် {{from}}–{{to}} ကို ပြသနေသည်',
    page: 'စာမျက်နှာ {{page}} / {{pages}}',
    rowsPerPage: 'တစ်မျက်နှာလျှင် ပြသမည့် အရေအတွက်',
    first: 'ပထမစာမျက်နှာ',
    last: 'နောက်ဆုံးစာမျက်နှာ',
    previous: 'ယခင်စာမျက်နှာ',
    next: 'နောက်စာမျက်နှာ'
  },

  confirm: {
    discardTitle: 'ပြင်ဆင်ချက်များ ပယ်ဖျက်မည်လား။',
    keepEditing: 'ဆက်ပြင်မည်',
    deleteTitle: '{{item}} ကို ဖျက်မည်လား။',
    deleteBody: 'ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍ မရပါ။',
    unsavedTitle: 'မသိမ်းရသေးသော ပြင်ဆင်ချက်များကို ပယ်ဖျက်မည်လား။',
    unsavedBody: 'ဤဖောင်တွင် ရိုက်ထည့်ထားသမျှ ပျောက်ဆုံးသွားပါမည်။'
  },

  toast: {
    created: '{{item}} ကို ထည့်သွင်းပြီးပါပြီ',
    updated: '{{item}} ကို ပြင်ဆင်ပြီးပါပြီ',
    deleted: '{{item}} ကို ဖျက်ပြီးပါပြီ',
    saved: 'ပြင်ဆင်ချက်များကို သိမ်းပြီးပါပြီ',
    createFailed: '{{item}} ကို ထည့်သွင်း၍ မရပါ',
    updateFailed: '{{item}} ကို ပြင်ဆင်၍ မရပါ',
    deleteFailed: '{{item}} ကို ဖျက်၍ မရပါ',
    error: 'တစ်ခုခု မှားယွင်းသွားပါသည်',
    networkError: 'ဆာဗာနှင့် ချိတ်ဆက်၍ မရပါ။ အင်တာနက်ကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။'
  },

  validation: {
    required: 'ဤအကွက်ကို ဖြည့်ရန် လိုအပ်သည်',
    invalid: 'ဤတန်ဖိုးကို ပြန်လည်စစ်ဆေးပါ',
    maxLength: '{{field}} သည် စာလုံး {{max}} လုံးထက် မပိုရပါ',
    requiredField: '{{field}} ဖြည့်ရန် လိုအပ်သည်',
    email: 'မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်ပါ',
    phone: 'မှန်ကန်သော ဖုန်းနံပါတ် ထည့်ပါ',
    min: 'အနည်းဆုံး {{min}} ဖြစ်ရမည်',
    max: 'အများဆုံး {{max}} ဖြစ်ရမည်',
    positive: 'သုညထက် များရမည်',
    integer: 'ကိန်းပြည့် ဖြစ်ရမည်',
    selectOne: 'တစ်ခုခု ရွေးချယ်ပါ'
  },

  calendar: {
    open: 'ပြက္ခဒိန် ဖွင့်မည်',
    hour: 'နာရီ',
    minute: 'မိနစ်',
    meridiem: 'နံနက် သို့မဟုတ် ညနေ',
    am: 'နံနက်',
    pm: 'ညနေ',
    today: 'ယနေ့',
    clear: 'ရက်စွဲ ဖျက်မည်'
  },

  draft: {
    notice: '{{when}} က {{item}} ကို ဤနေရာတွင် ချန်ထားခဲ့သည်။',
    restore: 'ပြန်လည် ရယူမည်',
    startFresh: 'အသစ် စတင်မည်'
  },

  error: {
    title: 'တစ်ခုခု မှားယွင်းသွားပါသည်',
    body: 'ဤစာမျက်နှာကို မဖော်ပြနိုင်ပါ။ ကျန်အပိုင်းများကို ဆက်လက်အသုံးပြုနိုင်ပါသည်။',
    unknown: 'မသိရသော အမှားတစ်ခု',
    timeout: 'တောင်းဆိုမှု အချိန်ကုန်သွားပါသည်။ ထပ်မံကြိုးစားပါ။',
    unreachable: 'ဆာဗာနှင့် ချိတ်ဆက်၍ မရပါ။ အင်တာနက်ကို စစ်ဆေးပါ။',
    reference: '(ကိုးကားနံပါတ် — {{id}})',
    backToDashboard: 'ဒက်ရှ်ဘုတ်သို့ ပြန်သွားမည်',
    notFoundTitle: 'စာမျက်နှာ မတွေ့ရှိပါ',
    notFoundBody: 'ဤလိပ်စာအတွက် စာမျက်နှာ မတွေ့ရှိပါ။',
    goBack: 'နောက်သို့ ပြန်သွားမည်',
    goHome: 'ဒက်ရှ်ဘုတ်',
    forbiddenTitle: 'ဝင်ရောက်ခွင့် မရှိပါ',
    forbiddenBody: 'ဤစာမျက်နှာ လိုအပ်ပါက စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ။'
  }
};
