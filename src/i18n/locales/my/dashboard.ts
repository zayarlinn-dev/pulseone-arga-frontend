import type { Translations } from '@/i18n/locales/types';
import type { dashboard as source } from '@/i18n/locales/en/dashboard';

export const dashboard: Translations<typeof source> = {
  title: 'ဒက်ရှ်ဘုတ်',
  description: 'ယနေ့ အခြေအနေ အကျဉ်းချုပ်',
  loadFailed: 'ဒက်ရှ်ဘုတ်ကို မဖွင့်နိုင်ပါ',

  tile: {
    totalPatients: 'လူနာ စုစုပေါင်း',
    registeredToday: 'ယနေ့ မှတ်ပုံတင်သူ',
    activeVisits: 'ဖွင့်ထားသော ပြသမှု',
    admitted: 'လက်ရှိ တက်ရောက်နေသူ',
    invoicesToday: 'ယနေ့ ငွေတောင်းလွှာ',
    revenueToday: 'ယနေ့ ဝင်ငွေ',
    stockValue: 'လက်ကျန် အရင်းတန်ဖိုး',
    belowReorder: 'ပြန်ဖြည့်ရန် လိုအပ်',
    expiringBatches: '၉၀ ရက်အတွင်း သက်တမ်းကုန်မည့် ဘက်ခ်ျများ'
  },

  trends: 'ပြောင်းလဲမှုများ',
  inventory: 'ပစ္စည်းစာရင်း',
  dateRange: 'ကာလ ရွေးရန်',
  range: {
    days7: '၇ ရက်',
    days30: '၃၀ ရက်',
    days90: '၉၀ ရက်'
  },

  chart: {
    showChart: 'ဂရပ်',
    showTable: 'ဇယား',
    empty: 'ဤကာလအတွင်း မှတ်တမ်း မရှိပါ'
  },

  registrations: {
    title: 'မှတ်ပုံတင် အသစ်များ',
    subtitle_one: 'လူနာ {{count}} ဦး မှတ်ပုံတင်ခဲ့သည်',
    subtitle_other: 'လူနာ {{count}} ဦး မှတ်ပုံတင်ခဲ့သည်',
    empty: 'ဤကာလအတွင်း မှတ်ပုံတင်မှု မရှိပါ',
    headerGender: 'ကျား / မ',
    headerPatients: 'လူနာ',
    headerShare: 'အချိုး'
  },

  takings: {
    title: 'ငွေဝင်မှု',
    subtitle: 'ငွေတောင်းလွှာ {{invoiced}} · ဆေးရောင်းချမှု {{dispensed}}',
    empty: 'ဤကာလအတွင်း ငွေဝင်မှု မရှိပါ',
    invoices: 'ငွေတောင်းလွှာ',
    pharmacy: 'ဆေးဆိုင်',
    headerDate: 'ရက်စွဲ'
  }
};
