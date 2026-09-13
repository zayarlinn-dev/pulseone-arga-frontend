import type { Translations } from '@/i18n/locales/types';
import type { auth as source } from '@/i18n/locales/en/auth';

export const auth: Translations<typeof source> = {
  headline: 'စာရွက်စာတမ်း ရှုပ်ထွေးမှုမရှိဘဲ\nလူနာစောင့်ရှောက်မှုကို စီမံပါ။',
  highlights: {
    records: 'လူနာ၊ ပြသမှုနှင့် ဆေးရုံတက်မှု မှတ်တမ်းများ တစ်နေရာတည်းတွင်',
    connected: 'ဆေးဆိုင်၊ ငွေတောင်းခံမှုနှင့် ဝယ်ယူရေး အစအဆုံး ချိတ်ဆက်ထားသည်',
    access: 'ရာထူးအလိုက် ခွင့်ပြုချက် — ဝန်ထမ်းများ လိုအပ်သည်ကိုသာ မြင်ရသည်'
  },

  welcome: 'ပြန်လည် ကြိုဆိုပါသည်',
  subtitle: 'ဆက်လက်အသုံးပြုရန် သင့်ဝန်ထမ်းအကောင့်ဖြင့် ဝင်ရောက်ပါ။',
  username: 'အသုံးပြုသူအမည်',
  usernamePlaceholder: 'သင့်ဝန်ထမ်း အသုံးပြုသူအမည်',
  usernameRequired: 'အသုံးပြုသူအမည် ဖြည့်ရန် လိုအပ်သည်',
  password: 'စကားဝှက်',
  passwordPlaceholder: 'သင့်စကားဝှက်',
  passwordRequired: 'စကားဝှက် ဖြည့်ရန် လိုအပ်သည်',
  showPassword: 'စကားဝှက် ပြမည်',
  hidePassword: 'စကားဝှက် ဖျောက်မည်',
  capsLockOn: 'Caps Lock ဖွင့်ထားပါသည်။',
  signIn: 'ဝင်ရောက်မည်',
  signingIn: 'ဝင်ရောက်နေသည်',
  loginFailed: 'ဝင်ရောက်၍ မရပါ',
  lockoutNotice:
    'ငါးမိနစ်အတွင်း ငါးကြိမ် မှားယွင်းပါက အကောင့်ကို ပိတ်ပင်ပါမည်။ အကောင့်ပိတ်သွားပါက စနစ်စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ။'
};
