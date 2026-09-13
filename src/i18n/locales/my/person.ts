import type { Translations } from '@/i18n/locales/types';
import type { person as source } from '@/i18n/locales/en/person';

export const person: Translations<typeof source> = {
  gender: {
    male: 'ကျား',
    female: 'မ',
    others: 'အခြား'
  },

  maritalStatus: {
    single: 'အိမ်ထောင်မရှိ',
    married: 'အိမ်ထောင်ရှိ',
    divorced: 'ကွာရှင်းပြီး'
  },

  // The Latin letter stays: it is what is printed on the card and what staff
  // key in, so translating it away would leave nothing to match against.
  nrcType: {
    N: 'N — နိုင် (နိုင်ငံသား)',
    A: 'A — ဧည့် (ဧည့်နိုင်ငံသား)',
    P: 'P — ပြု (နိုင်ငံသားပြုခွင့်ရ)',
    Y: 'Y — ယာယီ',
    S: 'S — စ',
    T: 'T — သ'
  },

  employmentStatus: {
    permanent: 'အမြဲတမ်း',
    temporary: 'ယာယီ',
    internship: 'အလုပ်သင်'
  },

  nrcRequired: 'မှတ်ပုံတင်အတွက် ဖြည့်ရန် လိုအပ်သည်',
  ageRange: 'အသက် ၀ မှ ၁၅၀ အတွင်း ထည့်ပါ'
};
