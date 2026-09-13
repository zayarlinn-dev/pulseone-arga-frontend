import type { Translations } from '@/i18n/locales/types';
import type { nav as source } from '@/i18n/locales/en/nav';

export const nav: Translations<typeof source> = {
  section: {
    overview: 'ခြုံငုံသုံးသပ်ချက်',
    patientCare: 'လူနာ စောင့်ရှောက်မှု',
    clinical: 'ဆေးကုသမှု',
    billing: 'ငွေတောင်းခံမှု',
    inventory: 'ပစ္စည်းစာရင်း',
    hr: 'ဝန်ထမ်း',
    management: 'စီမံအုပ်ချုပ်မှု',
    administration: 'စီမံခန့်ခွဲမှု'
  },

  item: {
    dashboard: 'ဒက်ရှ်ဘုတ်',
    patients: 'လူနာများ',
    appointments: 'ချိန်းဆိုမှုများ',
    queue: 'တန်းစီစာရင်း',
    visits: 'ပြသမှုများ',
    admissions: 'ဆေးရုံတက်မှုများ',
    encounters: 'ဆေးကုသမှုမှတ်တမ်း',
    prescriptions: 'ဆေးညွှန်းများ',
    doctorSchedules: 'ဆရာဝန် အချိန်ဇယား',
    roster: 'တာဝန်ဇယား',
    attendance: 'တက်ရောက်မှု',
    leave: 'ခွင့်',
    salaryStructures: 'လစာ',
    payroll: 'လစာထုတ်ခြင်း',
    hrSettings: 'ဝန်ထမ်း ဆက်တင်',
    approvals: 'အတည်ပြုချက်များ',
    approvalWorkflows: 'အတည်ပြုလုပ်ငန်းစဉ်',
    reports: 'အစီရင်ခံစာများ',
    auditLog: 'စာရင်းစစ်မှတ်တမ်း',
    counter: 'ကောင်တာ',
    orders: 'အော်ဒါများ',
    invoices: 'ငွေတောင်းလွှာများ',
    pharmacy: 'ဆေးဆိုင်',
    refunds: 'ငွေပြန်အမ်းမှုများ',
    consultantEarnings: 'အထူးကုဆရာဝန် ဝင်ငွေ',
    returns: 'ဆေးပြန်အပ်မှုများ',
    items: 'ပစ္စည်းများ',
    stores: 'စတိုးများ',
    stockBalance: 'လက်ကျန် ပစ္စည်းစာရင်း',
    expiryReport: 'သက်တမ်းကုန် အစီရင်ခံစာ',
    stockLedger: 'ပစ္စည်း သွင်း–ထုတ် စာရင်း',
    vendors: 'ရောင်းချသူများ',
    goodsReceived: 'ပစ္စည်း လက်ခံမှုများ',
    transfers: 'လွှဲပြောင်းမှုများ',
    damages: 'ပျက်စီးဆုံးရှုံးမှုများ',
    consumption: 'သုံးစွဲမှုများ',
    stockCounts: 'ပစ္စည်း ရေတွက်မှုများ',
    openingBalances: 'အဖွင့် လက်ကျန်များ',
    inventorySettings: 'ကုန်ပစ္စည်း ဆက်တင်များ',
    employees: 'ဝန်ထမ်းများ',
    departments: 'ဌာနများ',
    serviceCenters: 'ဝန်ဆောင်မှု စင်တာများ',
    services: 'ဝန်ဆောင်မှုများ',
    consultantFees: 'အထူးကု အခကြေးငွေများ',
    rooms: 'အခန်းများ',
    lookupLists: 'အမျိုးအစား စာရင်းများ',
    users: 'အသုံးပြုသူများ',
    roles: 'ရာထူးများ',
    registrationFields: 'မှတ်ပုံတင် အချက်အလက်များ',
    profitability: 'အမြတ်အစွန်း',
    workingCapital: 'လည်ပတ်ရင်းနှီးငွေ'
  },

  soon: 'မကြာမီ',
  soonHint: 'ယခုအချိန်တွင် မရရှိနိုင်သေးပါ',

  filter: {
    placeholder: 'စာမျက်နှာ ရှာမည်…',
    label: 'မီနူး စာရင်း စစ်ထုတ်ရန်',
    clear: 'စစ်ထုတ်မှု ဖျက်မည်',
    open: 'စာမျက်နှာ ရှာမည် (Ctrl+K)',
    empty: '“{{query}}” နှင့် ကိုက်ညီသော စာမျက်နှာ မရှိပါ',
    emptyHint: 'စာလုံးပေါင်း ပြန်စစ်ပါ၊ သို့မဟုတ် မီနူးအားလုံး ပြန်ကြည့်ရန် စစ်ထုတ်မှုကို ဖျက်ပါ။',
    resultCount: 'ကိုက်ညီမှု — {{count}}'
  },

  sectionHasActive: 'သင်ရှိနေသော စာမျက်နှာ ပါဝင်သည်'
};
