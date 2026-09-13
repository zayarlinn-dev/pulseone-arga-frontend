/**
 * Patient care: registration, visits and admissions. Spread into the catalogue
 * root, so screens read `t('patients.title')`.
 */
export const clinical = {
  patients: {
    entity: 'Patient',
    title: 'Patients',
    description: 'Registered patients and their current visit',
    searchPlaceholder: 'Search by patient no, name, phone or NRC...',
    empty: 'No patients found',
    openChart: 'Open {{name}}’s chart',
    deleteTitle: 'Delete patient',
    deleteBody:
      'Delete "{{name}}" ({{number}})? This cannot be undone. Patients with visits, invoices or admissions cannot be deleted.',

    column: {
      patientNo: 'Patient No',
      gender: 'Gender',
      age: 'Age',
      phone: 'Phone',
      currentVisit: 'Current visit',
      registered: 'Registered'
    },

    category: {
      'walk-in': 'Walk-in',
      emergency: 'Emergency',
      'new-born': 'New-born'
    },
    categoryHint: {
      'walk-in': 'Arrived at reception for an outpatient visit.',
      emergency: 'Opens an ER visit instead of an outpatient one.',
      'new-born': 'Delivered here; registered against the mother.'
    },

    identityType: {
      nrc: 'NRC',
      passport: 'Passport',
      'driving-licence': 'Driving licence'
    },

    relationship: {
      father: 'Father',
      mother: 'Mother',
      husband: 'Husband',
      wife: 'Wife',
      sister: 'Sister',
      brother: 'Brother',
      partner: 'Partner',
      relative: 'Relative'
    },

    form: {
      newTitle: 'Register patient',
      editTitle: 'Edit patient',
      newSubtitle:
        'Name, gender and category are all that is required — the rest can follow later.',
      editSubtitle: 'Updating {{name}}. The patient number never changes.',
      thisRecord: 'this record',
      discardBody: 'This patient has not been saved. Leaving now loses what you have typed.',
      back: 'Back to patients',
      submitNew: 'Register patient',

      section: {
        registration: 'Registration',
        registrationHint: 'How this patient reached the hospital.',
        details: 'Patient details',
        detailsHint: 'Who the patient is.',
        contact: 'Contact & address',
        contactHint: 'How to reach the patient.',
        identity: 'Identity document',
        identityHint: 'NRC, passport or driving licence.',
        emergency: 'Emergency contact',
        emergencyHint: 'Who to call, and how they are related.',
        referral: 'Referral',
        referralHint: 'Where the patient was sent from, and to whom.'
      },

      filled: '{{count}} filled',
      check: 'check',

      vip: 'VIP patient',
      vipHint: 'Flagged across the app so staff can prioritise them.',
      fullName: 'Full name',
      fatherName: "Father's name",
      dob: 'Date of birth',
      age: 'Age',
      ageFromDob: 'From date of birth',
      ageManual: 'Use when the date is unknown',
      maritalStatus: 'Marital status',
      phoneNo: 'Phone number',
      secondaryPhone: 'Secondary phone',
      state: 'State / Region',
      township: 'Township',
      townshipHint: 'Choose a state first',
      documentType: 'Document type',
      notRecorded: 'Not recorded',
      stateNumber: 'State number',
      district: 'District',
      districtHint: 'Choose a state number first',
      nrcNumber: 'Number',
      select: 'Select',
      contactName: 'Name',
      relationship: 'Relationship',
      refHospital: 'Referring hospital',
      refDoctor: 'Referring doctor',
      refHospitalPatientNo: 'Their patient number',
      refVoucher: 'Voucher',
      refToConsultant: 'Referred to consultant',
      refToStaff: 'Referred to staff',
      refStaff: 'Referring staff',
      refOther: 'Other reference'
    },

    summary: {
      newPatient: 'New patient',
      numberOnSave: 'Number assigned on save',
      years: '{{count}} yrs',
      registeredOn: 'Registered {{date}}',
      required: 'Required',
      checklistCategory: 'Registration category',
      checklistName: 'Patient name',
      checklistGender: 'Gender',
      opensVisit: "Registering also opens the patient's first visit.",
      opensErVisit: "Registering also opens the patient's first visit as an ER visit."
    },

    toast: {
      updated: 'Patient updated',
      registered: 'Patient registered — {{number}}',
      registeredNoNumber: 'Patient registered',
      saveFailed: 'Failed to save patient',
      missingRequired: 'Some required details are missing'
    },

    validation: {
      nameRequired: 'Patient name is required',
      invalidDate: 'Enter a valid date',
      dobFuture: 'Date of birth cannot be in the future'
    },

    field: {
      secondaryPhoneNo: 'Secondary phone number',
      contactName: 'Contact name',
      contactPhoneNo: 'Contact phone number',
      contactSecondaryPhoneNo: 'Secondary contact number',
      refHospital: 'Referring hospital',
      refDoctor: 'Referring doctor',
      refHospitalPatientNo: 'Their patient number',
      refVoucher: 'Voucher',
      refStaff: 'Referring staff',
      refOther: 'Other reference'
    },

    /** The picker both the counter and the visit form use. */
    search: {
      placeholder: 'Search by patient no, name, phone or NRC...',
      noResults: 'No matching patients',
      searching: 'Searching...',
      clear: 'Clear selected patient'
    },

    /** The history panel shown beside a chosen patient. */
    history: {
      title: 'Patient history',
      loading: 'Loading patient history...',
      loadFailed: 'Failed to load patient history',
      admitted: 'Currently admitted',
      firstVisit: 'First visit',
      returning: 'Returning patient',
      owes: 'Owes {{amount}}',
      statVisits: 'Visits',
      statLastVisit: 'Last visit',
      statRegistered: 'Registered',
      statBilled: 'Billed to date',
      invoiceCount: '{{count}} invoices',
      noInvoices: 'No invoices yet',
      unpaidBalance: 'Unpaid balance {{amount}}.',
      unbilled_one: '{{count}} ordered item is not billed yet.',
      unbilled_other: '{{count}} ordered items are not billed yet.',
      lastTime: 'Last time',
      stillOpen: 'still open',
      nothingOrdered: 'Nothing was ordered or dispensed on that visit.',
      services: 'Services',
      medicines: 'Medicines',
      lastAdmission: 'Last admission',
      ongoing: 'ongoing',
      doctor: 'Dr {{name}}',
      showVisits: 'Show last {{count}} visits',
      hideVisits: 'Hide last {{count}} visits',
      open: 'open',
      items_one: '{{count}} item',
      items_other: '{{count}} items',
      gapToday: 'Today',
      gapYesterday: 'Yesterday',
      gapDays: '{{count}} days ago',
      gapMonths: '{{count}} months ago',
      gapYears: '{{count}} years ago'
    }
  },

  visits: {
    entity: 'Visit',
    title: 'Visits',
    description: 'Episodes of care. Each patient has at most one open visit.',
    searchPlaceholder: 'Search by visit code...',
    empty: 'No visits found',
    column: {
      visitCode: 'Visit Code',
      patient: 'Patient',
      registration: 'Registration',
      opened: 'Opened'
    },
    status: {
      open: 'Open',
      closed: 'Closed'
    },
    filter: {
      label: 'Filter by visit status',
      all: 'All visits',
      openOnly: 'Open only',
      closedOnly: 'Closed only'
    },
    modal: {
      title: 'New visit',
      description:
        'Opening a visit closes whichever visit this patient currently has open — a patient has at most one active visit.',
      patient: 'Patient',
      selectPatient: 'Select a patient first',
      visitType: 'Visit type',
      submit: 'Open visit'
    },
    type: {
      OP: 'Outpatient (OP)',
      ER: 'Emergency (ER)',
      IP: 'Inpatient (IP)'
    },
    typeHint: {
      OP: 'Consultation without admission.',
      ER: 'Arrived through the emergency department.',
      IP: 'Expected to be admitted to a room.'
    }
  },

  admissions: {
    entity: 'Admission',
    title: 'Admissions',
    description: 'Inpatients and the rooms they occupy',
    searchPlaceholder: 'Search by admission no or reason...',
    empty: 'No admissions found',
    admitPatient: 'Admit Patient',
    discharge: 'Discharge',
    editAria: 'Edit admission {{number}}',
    dischargeAria: 'Discharge {{name}}',

    /*
     * The ward board — the floor plan the desk works from. Its wording is the
     * ward's own: rooms are on floors off a corridor, and a stay is counted in
     * days rather than in hours since check-in.
     *
     * Nine keys, flat, and reusing `common` and `rooms` for every word that
     * already exists somewhere — the ward board's own view labels are
     * `rooms.title` and `admissions.title`, its "all floors" is
     * `common.label.all`.
     *
     * That frugality is not style. The catalogue is at the size where i18next's
     * typed key union stops fitting in TypeScript: past it, keys are silently
     * dropped from the union and the screens that use them stop compiling —
     * other modules' screens, not this one, which is what makes it confusing.
     * Fifteen keys here was over the line; nine is under it. Anything added
     * later should be weighed against that, and the catalogue eventually split
     * into real i18next namespaces so the union is per-module.
     */
    floorName: 'Floor {{floor}}',
    noFloor: 'No floor recorded',
    corridor: 'Corridor',
    bedsOccupied: '{{taken}} of {{beds}} beds',
    dayCount: 'Day {{count}}',
    pickRoomHint: 'Pick a room on the plan to see who is in it and admit or discharge.',
    roomFree: 'This room is free and ready for a patient.',
    roomCleaning: 'Housekeeping is turning this room over. It can be filled once it is free.',
    roomHeld: 'This room is not free. Release it on the room record before admitting anyone.',

    column: {
      admissionNo: 'Admission No',
      patient: 'Patient',
      room: 'Room',
      doctor: 'Attending doctor',
      admitted: 'Admitted',
      discharged: 'Discharged'
    },

    status: {
      admitted: 'Admitted',
      discharged: 'Discharged',
      transferred: 'Transferred'
    },

    filter: {
      label: 'Filter by admission status',
      all: 'All statuses'
    },

    modal: {
      editTitle: 'Edit admission',
      newTitle: 'Admit patient',
      editDescription:
        'Correct the details of this admission. Patient and room cannot be changed here.',
      newDescription: 'Admitting a patient claims the room; only free, active rooms are listed.',
      submitNew: 'Admit',
      room: 'Room',
      roomLocked: 'Locked — transfer the patient to change rooms.',
      roomFallback: 'Room #{{id}}',
      noRooms: 'No rooms available',
      selectRoom: 'Select a room',
      roomFloor: 'floor {{floor}}',
      admissionType: 'Admission type',
      noTypeCategory: 'No "Admission Type" category configured yet.',
      selectType: 'Select a type',
      doctor: 'Attending doctor',
      notAssigned: 'Not assigned',
      admissionDate: 'Admission date',
      admissionReason: 'Admission reason'
    },

    validation: {
      patient: 'Select a patient',
      room: 'Select a room',
      type: 'Select an admission type',
      date: 'Admission date is required'
    },

    dischargeModal: {
      title: 'Discharge patient',
      description:
        'Discharge {{name}} from {{room}}. The room is handed to housekeeping for cleaning.',
      thisPatient: 'this patient',
      theirRoom: 'their room',
      date: 'Discharge date',
      reason: 'Discharge reason'
    },

    toast: {
      discharged: 'Patient discharged',
      dischargeFailed: 'Failed to discharge patient'
    }
  }
} as const;
