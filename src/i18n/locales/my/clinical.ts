import type { Translations } from '@/i18n/locales/types';
import type { clinical as source } from '@/i18n/locales/en/clinical';

export const clinical: Translations<typeof source> = {
  patients: {
    entity: 'လူနာ',
    title: 'လူနာများ',
    description: 'မှတ်ပုံတင်ထားသော လူနာများနှင့် ၎င်းတို့၏ လက်ရှိပြသမှု',
    searchPlaceholder: 'လူနာနံပါတ်၊ အမည်၊ ဖုန်း သို့မဟုတ် မှတ်ပုံတင်ဖြင့် ရှာရန်…',
    empty: 'လူနာ မတွေ့ရှိပါ',
    openChart: '{{name}} ၏ ဆေးမှတ်တမ်း ဖွင့်ရန်',
    deleteTitle: 'လူနာ ဖျက်မည်',
    deleteBody:
      '"{{name}}" ({{number}}) ကို ဖျက်မည်လား။ ပြန်ပြင်၍ မရပါ။ ပြသမှု၊ ငွေတောင်းလွှာ သို့မဟုတ် ဆေးရုံတက်မှု ရှိသော လူနာများကို ဖျက်၍ မရပါ။',

    column: {
      patientNo: 'လူနာနံပါတ်',
      gender: 'ကျား / မ',
      age: 'အသက်',
      phone: 'ဖုန်း',
      currentVisit: 'လက်ရှိ ပြသမှု',
      registered: 'မှတ်ပုံတင်သည့်ရက်'
    },

    category: {
      'walk-in': 'ကိုယ်တိုင်လာရောက်',
      emergency: 'အရေးပေါ်',
      'new-born': 'မွေးကင်းစ'
    },
    categoryHint: {
      'walk-in': 'အပြင်လူနာအဖြစ် ပြသရန် ဧည့်ကြိုသို့ ရောက်ရှိလာသည်။',
      emergency: 'အပြင်လူနာအစား အရေးပေါ်ဌာန ပြသမှုကို ဖွင့်ပေးသည်။',
      'new-born': 'ဤဆေးရုံတွင် မွေးဖွားပြီး မိခင်နှင့် တွဲ၍ မှတ်ပုံတင်သည်။'
    },

    identityType: {
      nrc: 'နိုင်ငံသားစိစစ်ရေးကတ်',
      passport: 'နိုင်ငံကူးလက်မှတ်',
      'driving-licence': 'ယာဉ်မောင်းလိုင်စင်'
    },

    relationship: {
      father: 'ဖခင်',
      mother: 'မိခင်',
      husband: 'ခင်ပွန်း',
      wife: 'ဇနီး',
      sister: 'အစ်မ / ညီမ',
      brother: 'အစ်ကို / ညီ',
      partner: 'အဖော်',
      relative: 'ဆွေမျိုး'
    },

    form: {
      newTitle: 'လူနာ မှတ်ပုံတင်မည်',
      editTitle: 'လူနာ ပြင်ဆင်မည်',
      newSubtitle: 'အမည်၊ ကျား/မ နှင့် အမျိုးအစားသာ မဖြစ်မနေ လိုအပ်သည် — ကျန်သည်များကို နောက်မှ ဖြည့်နိုင်သည်။',
      editSubtitle: '{{name}} ကို ပြင်ဆင်နေသည်။ လူနာနံပါတ်မှာ မပြောင်းလဲပါ။',
      thisRecord: 'ဤမှတ်တမ်း',
      discardBody: 'ဤလူနာကို မသိမ်းရသေးပါ။ ယခုထွက်ခွာပါက ရိုက်ထည့်ထားသမျှ ပျောက်ဆုံးပါမည်။',
      back: 'လူနာစာရင်းသို့ ပြန်သွားမည်',
      submitNew: 'လူနာ မှတ်ပုံတင်မည်',

      section: {
        registration: 'မှတ်ပုံတင်ခြင်း',
        registrationHint: 'ဤလူနာ ဆေးရုံသို့ မည်သို့ ရောက်ရှိလာသနည်း။',
        details: 'လူနာ အချက်အလက်',
        detailsHint: 'လူနာသည် မည်သူဖြစ်သနည်း။',
        contact: 'ဆက်သွယ်ရန်နှင့် လိပ်စာ',
        contactHint: 'လူနာကို မည်သို့ ဆက်သွယ်ရမည်နည်း။',
        identity: 'သက်သေခံ စာရွက်စာတမ်း',
        identityHint: 'မှတ်ပုံတင်၊ နိုင်ငံကူးလက်မှတ် သို့မဟုတ် ယာဉ်မောင်းလိုင်စင်။',
        emergency: 'အရေးပေါ် ဆက်သွယ်ရန်',
        emergencyHint: 'မည်သူကို ဆက်သွယ်ရမည်နည်း၊ မည်သို့ တော်စပ်သနည်း။',
        referral: 'ညွှန်းပို့မှု',
        referralHint: 'လူနာကို မည်သည့်နေရာမှ မည်သူ့ထံ ညွှန်းပို့သနည်း။'
      },

      filled: '{{count}} ခု ဖြည့်ပြီး',
      check: 'စစ်ဆေးရန်',

      vip: 'VIP လူနာ',
      vipHint: 'ဝန်ထမ်းများ ဦးစားပေးနိုင်ရန် အက်ပ်တစ်ခုလုံးတွင် အမှတ်အသား ပြသည်။',
      fullName: 'အမည် အပြည့်အစုံ',
      fatherName: 'အဖအမည်',
      dob: 'မွေးသက္ကရာဇ်',
      age: 'အသက်',
      ageFromDob: 'မွေးသက္ကရာဇ်မှ တွက်ချက်သည်',
      ageManual: 'မွေးသက္ကရာဇ် မသိပါက အသုံးပြုပါ',
      maritalStatus: 'အိမ်ထောင်ရေး အခြေအနေ',
      phoneNo: 'ဖုန်းနံပါတ်',
      secondaryPhone: 'အရံ ဖုန်းနံပါတ်',
      state: 'ပြည်နယ် / တိုင်းဒေသကြီး',
      township: 'မြို့နယ်',
      townshipHint: 'ပြည်နယ်ကို ဦးစွာ ရွေးပါ',
      documentType: 'စာရွက်စာတမ်း အမျိုးအစား',
      notRecorded: 'မှတ်တမ်း မတင်ထားပါ',
      stateNumber: 'ပြည်နယ် နံပါတ်',
      district: 'ခရိုင်',
      districtHint: 'ပြည်နယ်နံပါတ်ကို ဦးစွာ ရွေးပါ',
      nrcNumber: 'နံပါတ်',
      select: 'ရွေးပါ',
      contactName: 'အမည်',
      relationship: 'တော်စပ်ပုံ',
      refHospital: 'ညွှန်းပို့သော ဆေးရုံ',
      refDoctor: 'ညွှန်းပို့သော ဆရာဝန်',
      refHospitalPatientNo: '၎င်းတို့၏ လူနာနံပါတ်',
      refVoucher: 'ဘောက်ချာ',
      refToConsultant: 'ညွှန်းပို့သည့် အထူးကုဆရာဝန်',
      refToStaff: 'ညွှန်းပို့သည့် ဝန်ထမ်း',
      refStaff: 'ညွှန်းပို့သော ဝန်ထမ်း',
      refOther: 'အခြား ကိုးကားချက်'
    },

    summary: {
      newPatient: 'လူနာ အသစ်',
      numberOnSave: 'သိမ်းလိုက်သည်နှင့် နံပါတ် ထုတ်ပေးမည်',
      years: '{{count}} နှစ်',
      registeredOn: '{{date}} တွင် မှတ်ပုံတင်ခဲ့သည်',
      required: 'မဖြစ်မနေ လိုအပ်သည်',
      checklistCategory: 'မှတ်ပုံတင် အမျိုးအစား',
      checklistName: 'လူနာ အမည်',
      checklistGender: 'ကျား / မ',
      opensVisit: 'မှတ်ပုံတင်လိုက်သည်နှင့် လူနာ၏ ပထမဆုံး ပြသမှုကိုပါ ဖွင့်ပေးပါမည်။',
      opensErVisit: 'မှတ်ပုံတင်လိုက်သည်နှင့် လူနာ၏ ပထမဆုံး ပြသမှုကို အရေးပေါ်ဌာန ပြသမှုအဖြစ် ဖွင့်ပေးပါမည်။'
    },

    toast: {
      updated: 'လူနာ အချက်အလက်ကို ပြင်ဆင်ပြီးပါပြီ',
      registered: 'လူနာ မှတ်ပုံတင်ပြီးပါပြီ — {{number}}',
      registeredNoNumber: 'လူနာ မှတ်ပုံတင်ပြီးပါပြီ',
      saveFailed: 'လူနာ အချက်အလက်ကို သိမ်း၍ မရပါ',
      missingRequired: 'မဖြစ်မနေ လိုအပ်သော အချက်အလက် အချို့ ကျန်နေပါသည်'
    },

    validation: {
      nameRequired: 'လူနာအမည် ဖြည့်ရန် လိုအပ်သည်',
      invalidDate: 'မှန်ကန်သော ရက်စွဲ ထည့်ပါ',
      dobFuture: 'မွေးသက္ကရာဇ်သည် အနာဂတ် ဖြစ်၍ မရပါ'
    },

    field: {
      secondaryPhoneNo: 'အရံ ဖုန်းနံပါတ်',
      contactName: 'ဆက်သွယ်ရမည့်သူ အမည်',
      contactPhoneNo: 'ဆက်သွယ်ရမည့် ဖုန်းနံပါတ်',
      contactSecondaryPhoneNo: 'အရံ ဆက်သွယ်ရန် နံပါတ်',
      refHospital: 'ညွှန်းပို့သော ဆေးရုံ',
      refDoctor: 'ညွှန်းပို့သော ဆရာဝန်',
      refHospitalPatientNo: '၎င်းတို့၏ လူနာနံပါတ်',
      refVoucher: 'ဘောက်ချာ',
      refStaff: 'ညွှန်းပို့သော ဝန်ထမ်း',
      refOther: 'အခြား ကိုးကားချက်'
    },

    search: {
      placeholder: 'လူနာနံပါတ်၊ အမည်၊ ဖုန်း သို့မဟုတ် မှတ်ပုံတင်ဖြင့် ရှာရန်…',
      noResults: 'ကိုက်ညီသော လူနာ မတွေ့ရှိပါ',
      searching: 'ရှာဖွေနေသည်…',
      clear: 'ရွေးထားသော လူနာကို ဖယ်ရှားမည်'
    },

    history: {
      title: 'လူနာ မှတ်တမ်း',
      loading: 'လူနာမှတ်တမ်း ဖွင့်နေသည်…',
      loadFailed: 'လူနာမှတ်တမ်းကို မဖွင့်နိုင်ပါ',
      admitted: 'လက်ရှိ ဆေးရုံတက်နေသည်',
      firstVisit: 'ပထမဆုံး ပြသမှု',
      returning: 'ပြန်လည်လာရောက်သော လူနာ',
      owes: '{{amount}} ကျန်ရှိသည်',
      statVisits: 'ပြသမှု',
      statLastVisit: 'နောက်ဆုံး ပြသမှု',
      statRegistered: 'မှတ်ပုံတင်သည့်ရက်',
      statBilled: 'ယခုအထိ တောင်းခံငွေ',
      invoiceCount: 'ငွေတောင်းလွှာ {{count}} စောင်',
      noInvoices: 'ငွေတောင်းလွှာ မရှိသေးပါ',
      unpaidBalance: 'မပေးချေရသေးသော လက်ကျန် {{amount}}။',
      unbilled_one: 'မှာယူထားသော {{count}} ခုကို ငွေမတောင်းခံရသေးပါ။',
      unbilled_other: 'မှာယူထားသော {{count}} ခုကို ငွေမတောင်းခံရသေးပါ။',
      lastTime: 'နောက်ဆုံးအကြိမ်',
      stillOpen: 'ဖွင့်ထားဆဲ',
      nothingOrdered: 'ထိုပြသမှုတွင် မှာယူခြင်း သို့မဟုတ် ဆေးထုတ်ပေးခြင်း မရှိပါ။',
      services: 'ဝန်ဆောင်မှု',
      medicines: 'ဆေးဝါး',
      lastAdmission: 'နောက်ဆုံး ဆေးရုံတက်မှု',
      ongoing: 'ဆဲ',
      doctor: 'ဒေါက်တာ {{name}}',
      showVisits: 'နောက်ဆုံး ပြသမှု {{count}} ခု ကြည့်မည်',
      hideVisits: 'နောက်ဆုံး ပြသမှု {{count}} ခု ဖျောက်မည်',
      open: 'ဖွင့်ထားဆဲ',
      items_one: '{{count}} ခု',
      items_other: '{{count}} ခု',
      gapToday: 'ယနေ့',
      gapYesterday: 'မနေ့က',
      gapDays: 'လွန်ခဲ့သော {{count}} ရက်',
      gapMonths: 'လွန်ခဲ့သော {{count}} လ',
      gapYears: 'လွန်ခဲ့သော {{count}} နှစ်'
    }
  },

  visits: {
    entity: 'ပြသမှု',
    title: 'ပြသမှုများ',
    description: 'ကုသမှု တစ်ကြိမ်စီ။ လူနာတစ်ဦးလျှင် ဖွင့်ထားသော ပြသမှု တစ်ခုသာ ရှိနိုင်သည်။',
    searchPlaceholder: 'ပြသမှုကုဒ်ဖြင့် ရှာရန်…',
    empty: 'ပြသမှု မတွေ့ရှိပါ',
    column: {
      visitCode: 'ပြသမှုကုဒ်',
      patient: 'လူနာ',
      registration: 'မှတ်ပုံတင်',
      opened: 'ဖွင့်သည့်အချိန်'
    },
    status: {
      open: 'ဖွင့်ထား',
      closed: 'ပိတ်ပြီး'
    },
    filter: {
      label: 'ပြသမှု အခြေအနေဖြင့် စစ်ထုတ်ရန်',
      all: 'ပြသမှု အားလုံး',
      openOnly: 'ဖွင့်ထားသည်များသာ',
      closedOnly: 'ပိတ်ပြီးသည်များသာ'
    },
    modal: {
      title: 'ပြသမှု အသစ်',
      description:
        'ပြသမှုအသစ် ဖွင့်လိုက်ပါက ဤလူနာ၏ လက်ရှိဖွင့်ထားသော ပြသမှုကို ပိတ်ပါမည် — လူနာတစ်ဦးလျှင် ဖွင့်ထားသော ပြသမှု တစ်ခုသာ ရှိနိုင်သည်။',
      patient: 'လူနာ',
      selectPatient: 'လူနာကို ဦးစွာ ရွေးပါ',
      visitType: 'ပြသမှု အမျိုးအစား',
      submit: 'ပြသမှု ဖွင့်မည်'
    },
    type: {
      OP: 'အပြင်လူနာ (OP)',
      ER: 'အရေးပေါ် (ER)',
      IP: 'အတွင်းလူနာ (IP)'
    },
    typeHint: {
      OP: 'ဆေးရုံမတက်ဘဲ ပြသခြင်း။',
      ER: 'အရေးပေါ်ဌာနမှတစ်ဆင့် ရောက်ရှိလာသည်။',
      IP: 'အခန်းတွင် တက်ရောက်ကုသရန် မျှော်မှန်းထားသည်။'
    }
  },

  admissions: {
    entity: 'ဆေးရုံတက်မှု',
    title: 'ဆေးရုံတက်မှုများ',
    description: 'အတွင်းလူနာများနှင့် ၎င်းတို့ နေထိုင်သော အခန်းများ',
    searchPlaceholder: 'တက်ရောက်မှုနံပါတ် သို့မဟုတ် အကြောင်းအရင်းဖြင့် ရှာရန်…',
    empty: 'ဆေးရုံတက်မှု မတွေ့ရှိပါ',
    admitPatient: 'လူနာ တက်ရောက်စေမည်',
    discharge: 'ဆေးရုံဆင်းမည်',
    editAria: 'တက်ရောက်မှု {{number}} ကို ပြင်ဆင်မည်',
    dischargeAria: '{{name}} ကို ဆေးရုံဆင်းစေမည်',

    floorName: '{{floor}} ထပ်',
    noFloor: 'ထပ် မသတ်မှတ်ရသေး',
    corridor: 'စကြံလမ်း',
    bedsOccupied: 'ခုတင် {{beds}} ခုအနက် {{taken}} ခု',
    dayCount: '{{count}} ရက်မြောက်',
    pickRoomHint:
      'အခန်းပုံစံပေါ်တွင် အခန်းတစ်ခုကို နှိပ်ပါ — မည်သူရှိသည်ကို ကြည့်ပြီး တက်ရောက်/ဆင်းခြင်း ပြုလုပ်နိုင်သည်။',
    roomFree: 'ဤအခန်း လွတ်နေပြီး လူနာ လက်ခံရန် အသင့်ရှိသည်။',
    roomCleaning: 'သန့်ရှင်းရေး ဆောင်ရွက်နေဆဲဖြစ်သည်။ လွတ်သည်ဟု သတ်မှတ်ပြီးမှ လက်ခံနိုင်သည်။',
    roomHeld: 'ဤအခန်း မလွတ်သေးပါ။ လူနာ မလက်ခံမီ အခန်းမှတ်တမ်းတွင် ဖြေပေးပါ။',

    column: {
      admissionNo: 'တက်ရောက်မှု နံပါတ်',
      patient: 'လူနာ',
      room: 'အခန်း',
      doctor: 'တာဝန်ကျ ဆရာဝန်',
      admitted: 'တက်ရောက်သည့်အချိန်',
      discharged: 'ဆင်းသည့်အချိန်'
    },

    status: {
      admitted: 'တက်ရောက်ဆဲ',
      discharged: 'ဆင်းပြီး',
      transferred: 'ပြောင်းရွှေ့ပြီး'
    },

    filter: {
      label: 'အခြေအနေဖြင့် စစ်ထုတ်ရန်',
      all: 'အခြေအနေ အားလုံး'
    },

    modal: {
      editTitle: 'တက်ရောက်မှု ပြင်ဆင်မည်',
      newTitle: 'လူနာ တက်ရောက်စေမည်',
      editDescription:
        'ဤတက်ရောက်မှု၏ အချက်အလက်များကို ပြင်ဆင်ပါ။ လူနာနှင့် အခန်းကို ဤနေရာတွင် ပြောင်း၍ မရပါ။',
      newDescription:
        'လူနာတက်ရောက်ခြင်းသည် အခန်းကို သိမ်းယူသည်။ လွတ်နေပြီး အသုံးပြုနိုင်သော အခန်းများကိုသာ ဖော်ပြသည်။',
      submitNew: 'တက်ရောက်စေမည်',
      room: 'အခန်း',
      roomLocked: 'ပြင်၍ မရပါ — အခန်းပြောင်းရန် လူနာကို လွှဲပြောင်းပါ။',
      roomFallback: 'အခန်း #{{id}}',
      noRooms: 'လွတ်နေသော အခန်း မရှိပါ',
      selectRoom: 'အခန်း ရွေးပါ',
      roomFloor: '{{floor}} ထပ်',
      admissionType: 'တက်ရောက်မှု အမျိုးအစား',
      noTypeCategory: '"Admission Type" အုပ်စုကို မသတ်မှတ်ပါ။',
      selectType: 'အမျိုးအစား ရွေးပါ',
      doctor: 'တာဝန်ကျ ဆရာဝန်',
      notAssigned: 'မသတ်မှတ်ပါ',
      admissionDate: 'တက်ရောက်သည့် ရက်စွဲ',
      admissionReason: 'တက်ရောက်ရသည့် အကြောင်းအရင်း'
    },

    validation: {
      patient: 'လူနာ ရွေးပါ',
      room: 'အခန်း ရွေးပါ',
      type: 'တက်ရောက်မှု အမျိုးအစား ရွေးပါ',
      date: 'တက်ရောက်သည့် ရက်စွဲ ဖြည့်ရန် လိုအပ်သည်'
    },

    dischargeModal: {
      title: 'လူနာ ဆေးရုံဆင်းစေမည်',
      description:
        '{{name}} ကို {{room}} မှ ဆေးရုံဆင်းစေမည်။ အခန်းကို သန့်ရှင်းရေးအတွက် လွှဲပြောင်းပေးပါမည်။',
      thisPatient: 'ဤလူနာ',
      theirRoom: '၎င်း၏ အခန်း',
      date: 'ဆေးရုံဆင်းသည့် ရက်စွဲ',
      reason: 'ဆေးရုံဆင်းရသည့် အကြောင်းအရင်း'
    },

    toast: {
      discharged: 'လူနာကို ဆေးရုံဆင်းစေပြီးပါပြီ',
      dischargeFailed: 'လူနာကို ဆေးရုံဆင်း၍ မရပါ'
    }
  }
};
