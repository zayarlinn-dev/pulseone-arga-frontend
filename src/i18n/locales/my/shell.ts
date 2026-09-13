import type { Translations } from '@/i18n/locales/types';
import type { shell as source } from '@/i18n/locales/en/shell';

export const shell: Translations<typeof source> = {
  mainNavigation: 'ပင်မ မီနူး',
  openNavigation: 'မီနူး ဖွင့်မည်',
  closeNavigation: 'မီနူး ပိတ်မည်',
  expandSidebar: 'ဘေးတန်း ချဲ့မည်',
  collapseSidebar: 'ဘေးတန်း ခေါက်မည်',
  expandSidebarTitle: 'ဘေးတန်း ချဲ့မည် (Ctrl+B)',
  collapseSidebarTitle: 'ဘေးတန်း ခေါက်မည် (Ctrl+B)',
  breadcrumb: 'လမ်းကြောင်းပြ',
  userMenu: 'အကောင့် မီနူး',
  superUser: 'စူပါယူဇာ',
  logout: 'ထွက်မည်',

  settings: {
    title: 'ဆက်တင်များ',
    appearance: 'အသွင်အပြင်',
    appearanceHint: 'စက်အတိုင်း ရွေးထားပါက သင့်စက်၏ အပြင်အဆင်ကို လိုက်ပါသည်။',
    themeSystem: 'စက်အတိုင်း',
    themeLight: 'အလင်း',
    themeDark: 'အမှောင်',
    counterLayout: 'ကောင်တာ အပြင်အဆင်',
    counterHint: 'အလိုအလျောက် — တက်ဘလက်တွင် အထိအတွေ့၊ အခြားစက်များတွင် မောက်စ်ကို ရွေးပေးသည်။',
    counterAuto: 'အော်တို',
    counterTouch: 'တို့ထိ',
    counterDesktop: 'မောက်စ်',
    language: 'ဘာသာစကား',
    languageHint: 'ဤစက်အတွက်သာ သက်ရောက်သည်။'
  }
};
