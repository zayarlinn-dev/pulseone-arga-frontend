/**
 * The ERP modules' strings, in a namespace of their own.
 *
 * Not for loading reasons — the app is one bundle. Typing `t()` against a
 * catalogue turns it into a union of every key, and `translation` is already at
 * the size where adding to it starts breaking deeply-nested keys in files
 * nobody touched. A second namespace is a second, smaller union. The settings
 * and management catalogues went the same way, and anything added from here on
 * should too.
 */
export const erp = {
  // -------------------------------------------------------------------------
  // Audit trail
  // -------------------------------------------------------------------------
  audit: {
    title: 'Audit Trail',
    description: 'Who changed what, when, and what it was before',
    searchPlaceholder: 'Search by summary, user or record id...',
    empty: 'Nothing recorded for this period',
    loadFailed: 'Failed to load the audit trail',

    filter: {
      heading: 'Filters',
      entityType: 'Record type',
      action: 'Action',
      user: 'User',
      allTypes: 'All record types',
      allActions: 'All actions',
      from: 'From',
      to: 'To',
      clear: 'Clear filters'
    },

    summary: {
      total: 'Entries',
      byAction: 'By action',
      byUser: 'By user',
      byEntity: 'By record type',
      system: 'system'
    },

    column: {
      when: 'When',
      user: 'User',
      action: 'Action',
      record: 'Record',
      summary: 'What happened',
      changes: 'Changes'
    },

    action: {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      login: 'Signed in',
      logout: 'Signed out',
      approve: 'Approved',
      reject: 'Rejected',
      cancel: 'Cancelled',
      export: 'Exported',
      view: 'Viewed'
    },

    detail: {
      title: 'Audit entry',
      field: 'Field',
      before: 'Before',
      after: 'After',
      noChanges: 'No field-level changes were recorded for this entry',
      notSet: 'not set',
      context: 'Request',
      ipAddress: 'IP address',
      requestId: 'Request id',
      method: 'Method',
      path: 'Path',
      userAgent: 'Browser'
    },

    history: {
      title: 'History',
      empty: 'Nothing has been recorded against this record yet',
      loadFailed: 'Failed to load the history'
    }
  },

  // -------------------------------------------------------------------------
  // Approvals
  // -------------------------------------------------------------------------
  approvals: {
    entity: 'Approval request',
    title: 'Approvals',
    description: 'Requests raised across the hospital and where each one stands',
    inboxTitle: 'My Approvals',
    inboxDescription: 'Waiting on you to decide',
    searchPlaceholder: 'Search by request or document number...',
    empty: 'No approval requests',
    inboxEmpty: 'Nothing is waiting on you',
    loadFailed: 'Failed to load the approvals',

    column: {
      requestNo: 'Request',
      document: 'Document',
      documentNo: 'Document No',
      amount: 'Amount',
      requestedBy: 'Raised by',
      requestedAt: 'Raised',
      step: 'Step',
      status: 'Status',
      resolvedAt: 'Decided'
    },

    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Withdrawn'
    },

    documentType: {
      'invoice-discount': 'Invoice discount',
      'invoice-cancel': 'Invoice cancellation',
      'refund-invoice': 'Refund',
      'stock-adjustment': 'Stock adjustment',
      'stock-damage': 'Stock write-off',
      grn: 'Goods received',
      'leave-request': 'Leave request',
      'payroll-run': 'Payroll run'
    },

    action: {
      approve: 'Approve',
      reject: 'Reject',
      cancel: 'Withdraw',
      comment: 'Comment',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Withdrawn',
      commented: 'Commented',
      submitted: 'Submitted'
    },

    detail: {
      title: 'Request {{no}}',
      reason: 'Reason',
      payload: 'Details',
      chain: 'Approval chain',
      history: 'History',
      stepOf: 'Step {{current}} of {{total}}',
      remarks: 'Remarks',
      remarksPlaceholder: 'Why?',
      remarksRequired: 'A reason is required',
      awaiting: 'Waiting on {{step}}',
      byRole: 'anyone with the {{role}} role',
      byUser: '{{name}}'
    },

    toast: {
      approved: 'Request approved',
      rejected: 'Request rejected',
      cancelled: 'Request withdrawn',
      commented: 'Comment added',
      failed: 'Failed to act on the request'
    },

    workflow: {
      entity: 'Workflow',
      title: 'Approval Workflows',
      description: 'Which documents need signing off, and by whom',
      searchPlaceholder: 'Search by code or name...',
      empty: 'No workflows configured',
      deleteTitle: 'Delete workflow',
      deleteBody:
        'Delete "{{name}}"? Requests already waiting on it must be cleared first — deactivate it instead if any are in flight.',

      column: {
        code: 'Code',
        name: 'Name',
        documentType: 'Applies to',
        minAmount: 'From amount',
        steps: 'Steps',
        active: 'Active'
      },

      form: {
        code: 'Code',
        name: 'Name',
        documentType: 'Applies to',
        description: 'Description',
        minAmount: 'Applies from amount',
        minAmountHelp:
          'The chain takes over at this amount. Leave it at zero for the catch-all, and add a second workflow with a higher threshold for the ones that need more signatures.',
        active: 'Active',
        steps: 'Steps',
        addStep: 'Add step',
        stepName: 'Step name',
        approverType: 'Approved by',
        byRole: 'A role',
        byUser: 'One person',
        role: 'Role',
        user: 'User',
        allowRequester: 'The requester may clear this step',
        allowRequesterHelp:
          'Off by default: the point of most chains is that the person asking is not the person answering.',
        needsApprover: 'Every step needs a role or a named approver',
        needsStep: 'A workflow needs at least one step'
      }
    }
  },

  // -------------------------------------------------------------------------
  // Appointments and the queue
  // -------------------------------------------------------------------------
  appointments: {
    entity: 'Appointment',
    title: 'Appointments',
    description: 'Booked clinic slots',
    searchPlaceholder: 'Search by appointment number or patient...',
    empty: 'No appointments for this period',
    loadFailed: 'Failed to load the appointments',

    column: {
      appointmentNo: 'No',
      date: 'Date',
      time: 'Time',
      patient: 'Patient',
      doctor: 'Doctor',
      clinic: 'Clinic',
      status: 'Status',
      source: 'Booked'
    },

    status: {
      booked: 'Booked',
      confirmed: 'Confirmed',
      arrived: 'Arrived',
      completed: 'Seen',
      cancelled: 'Cancelled',
      'no-show': 'No show'
    },

    source: {
      counter: 'At the desk',
      phone: 'By phone',
      'walk-in': 'Walk-in',
      online: 'Online'
    },

    book: {
      title: 'Book an Appointment',
      description: 'Pick a doctor, a day, and a free slot',
      patient: 'Patient',
      doctor: 'Doctor',
      date: 'Date',
      clinic: 'Clinic',
      service: 'Service',
      reason: 'Reason for the visit',
      remarks: 'Remarks',
      slots: 'Available slots',
      chooseDoctor: 'Choose a doctor and a date to see what is free',
      noSlots: 'No slots on this day',
      slotFull: 'Full',
      slotsLeft: '{{count}} left',
      submit: 'Book',
      booked: 'Appointment booked',
      bookFailed: 'Failed to book the appointment'
    },

    action: {
      confirm: 'Confirm',
      arrive: 'Check in',
      complete: 'Mark seen',
      cancel: 'Cancel',
      noShow: 'No show',
      reschedule: 'Reschedule'
    },

    cancel: {
      title: 'Cancel appointment',
      body: 'Cancel {{no}}? The slot goes back on the doctor’s list.',
      reason: 'Reason',
      reasonRequired: 'A reason is required'
    },

    reschedule: {
      title: 'Reschedule {{no}}',
      body: 'The original booking is kept and marked as moved, so the desk can still see where this came from.',
      submit: 'Move it'
    },

    arrive: {
      title: 'Check in {{name}}',
      openVisit: 'Open a new visit',
      openVisitHelp:
        'Leave this off when the patient is already in an open episode of care — a follow-up within the same visit.',
      priority: 'Call ahead of the queue',
      tokenIssued: 'Checked in — token {{token}}'
    },

    toast: {
      updated: 'Appointment updated',
      rescheduled: 'Appointment moved',
      failed: 'Failed to update the appointment'
    }
  },

  queue: {
    title: 'OPD Queue',
    description: 'Who is waiting, who is being seen',
    loadFailed: 'Failed to load the queue',
    chooseClinic: 'Choose a clinic to see its queue',

    clinic: 'Clinic',
    date: 'Date',
    refresh: 'Refresh',

    nowServing: 'Now serving',
    waiting: 'Waiting',
    nobodyServing: 'Nobody is being seen',
    nobodyWaiting: 'Nobody is waiting',

    stat: {
      waiting: 'Waiting',
      serving: 'Being seen',
      completed: 'Seen today',
      issued: 'Tokens issued',
      averageWait: 'Average wait'
    },

    status: {
      waiting: 'Waiting',
      called: 'Called',
      serving: 'Being seen',
      completed: 'Done',
      skipped: 'Skipped',
      cancelled: 'Cancelled'
    },

    action: {
      callNext: 'Call next',
      start: 'Start',
      complete: 'Done',
      skip: 'Skip',
      cancel: 'Remove',
      walkIn: 'Walk-in'
    },

    walkIn: {
      title: 'Issue a walk-in token',
      patient: 'Patient',
      doctor: 'Doctor (optional)',
      remarks: 'Remarks',
      priority: 'Call ahead of the queue',
      openVisit: 'Open a new visit',
      submit: 'Issue token',
      issued: 'Token {{token}} issued'
    },

    toast: {
      called: 'Called {{token}}',
      updated: 'Token updated',
      nobodyWaiting: 'Nobody is waiting',
      failed: 'Failed to update the queue'
    },

    minutes: '{{count}} min'
  },

  schedules: {
    entity: 'Clinic schedule',
    title: 'Doctor Schedules',
    description: 'When each doctor holds a clinic, and how long a patient gets',
    empty: 'No schedules set',
    searchPlaceholder: 'Search by doctor...',
    deleteTitle: 'Delete schedule',
    deleteBody: 'Delete this clinic template? Appointments already booked are unaffected.',

    column: {
      doctor: 'Doctor',
      weekday: 'Day',
      hours: 'Hours',
      slot: 'Slot',
      capacity: 'Per slot',
      clinic: 'Clinic',
      validFrom: 'From',
      validTo: 'Until',
      active: 'Active'
    },

    form: {
      doctor: 'Doctor',
      weekday: 'Day of the week',
      startTime: 'Starts',
      endTime: 'Ends',
      slotMinutes: 'Minutes per patient',
      capacityPerSlot: 'Patients per slot',
      capacityHelp:
        'More than one where a clinic runs two chairs off one doctor’s list, or where overbooking is deliberate.',
      clinic: 'Clinic',
      room: 'Room',
      validFrom: 'In force from',
      validTo: 'Until (optional)',
      validToHelp: 'Leave it empty for "until further notice", which most of them are.',
      active: 'Active',
      endBeforeStart: 'The clinic must end after it starts'
    },

    // Keyed by name rather than by number: a numeric object key is not a
    // usable `t()` path, and the weekday arrives as `time.Weekday` anyway, so
    // the caller maps the index once.
    weekday: {
      sun: 'Sunday',
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday'
    }
  },

  // -------------------------------------------------------------------------
  // Clinical record
  // -------------------------------------------------------------------------
  encounters: {
    entity: 'Consultation',
    title: 'Consultations',
    description: 'The clinical record: what was found and what was decided',
    searchPlaceholder: 'Search by number or complaint...',
    empty: 'No consultations',
    loadFailed: 'Failed to load the consultations',

    column: {
      encounterNo: 'No',
      date: 'Date',
      patient: 'Patient',
      doctor: 'Doctor',
      type: 'Type',
      complaint: 'Complaint',
      diagnoses: 'Diagnoses',
      status: 'Status'
    },

    status: {
      draft: 'Draft',
      finalised: 'Finalised',
      amended: 'Amended'
    },

    type: {
      opd: 'Outpatient',
      ipd: 'Inpatient',
      emergency: 'Emergency',
      'follow-up': 'Follow-up'
    },

    form: {
      title: 'Consultation',
      newTitle: 'New consultation',
      patient: 'Patient',
      doctor: 'Doctor',
      type: 'Type',
      clinic: 'Clinic',
      chiefComplaint: 'Chief complaint',
      historyOfIllness: 'History of the present illness',
      examination: 'Examination',
      assessment: 'Assessment',
      treatmentPlan: 'Plan',
      advice: 'Advice',
      followUpDate: 'Follow up on',
      save: 'Save draft',
      saved: 'Consultation saved',
      saveFailed: 'Failed to save the consultation'
    },

    finalise: {
      action: 'Finalise',
      title: 'Finalise this consultation',
      body:
        'Once finalised the note cannot be edited. Correcting it afterwards means writing an amendment, which stays visible alongside the original.',
      confirm: 'Finalise',
      done: 'Consultation finalised',
      failed: 'Failed to finalise the consultation',
      empty: 'Write something before finalising'
    },

    amend: {
      action: 'Amend',
      title: 'Amend this consultation',
      body:
        'A new draft opens as a copy of this one. The original stays exactly as it is and is marked amended, so a reader sees both.',
      reason: 'What is being corrected?',
      reasonRequired: 'A reason is required',
      confirm: 'Open the amendment',
      done: 'Amendment opened',
      failed: 'Failed to amend the consultation'
    },

    finalisedNotice: {
      title: 'This consultation is finalised',
      body: 'It cannot be edited. Use Amend to record a correction.'
    },

    amendedNotice: {
      title: 'This consultation has been amended',
      body: 'A later note supersedes it. It is kept here as it was written.'
    },

    diagnoses: {
      title: 'Diagnoses',
      add: 'Add diagnosis',
      empty: 'No diagnoses recorded',
      code: 'ICD code',
      description: 'Diagnosis',
      type: 'Type',
      notes: 'Notes',
      searchCode: 'Search the ICD list...',
      type_: {
        primary: 'Primary',
        secondary: 'Secondary',
        provisional: 'Provisional',
        final: 'Final',
        differential: 'Differential'
      }
    },

    prescriptions: {
      title: 'Prescription',
      add: 'Write a prescription',
      empty: 'Nothing prescribed'
    }
  },

  chart: {
    title: 'Patient Chart',
    loadFailed: 'Failed to load the chart',

    allergies: {
      title: 'Allergies',
      empty: 'No allergies recorded',
      add: 'Record an allergy',
      allergen: 'Allergen',
      type: 'Type',
      reaction: 'Reaction',
      severity: 'Severity',
      notedOn: 'Noted',
      remarks: 'Remarks',
      status: 'Status',
      deleteTitle: 'Remove allergy',
      deleteBody:
        'Remove "{{name}}"? The dispensing counter will stop being warned about it.',
      type_: {
        drug: 'Drug',
        food: 'Food',
        environment: 'Environmental',
        other: 'Other'
      },
      severity_: {
        mild: 'Mild',
        moderate: 'Moderate',
        severe: 'Severe'
      },
      status_: {
        active: 'Active',
        inactive: 'Inactive'
      }
    },

    history: {
      title: 'History',
      empty: 'No background recorded',
      add: 'Add to the history',
      category: 'Category',
      description: 'Detail',
      notedOn: 'Noted',
      deleteTitle: 'Remove history entry',
      deleteBody: 'Remove this entry from the patient’s background?',
      category_: {
        'past-medical': 'Past medical',
        surgical: 'Surgical',
        family: 'Family',
        social: 'Social',
        medication: 'Medication',
        obstetric: 'Obstetric',
        immunisation: 'Immunisation'
      }
    },

    problems: {
      title: 'Problem list',
      empty: 'No confirmed diagnoses',
      note: 'Confirmed diagnoses only. Provisional findings are left out, so a working hypothesis is never read as a standing condition.'
    },

    vitals: {
      title: 'Vital signs',
      latest: 'Latest readings',
      empty: 'No readings recorded',
      record: 'Record readings',
      recordedAt: 'Taken',
      recordedBy: 'By',
      temperature: 'Temperature',
      pulse: 'Pulse',
      respiratoryRate: 'Respiratory rate',
      bloodPressure: 'Blood pressure',
      spo2: 'SpO₂',
      weight: 'Weight',
      height: 'Height',
      bmi: 'BMI',
      bloodGlucose: 'Blood glucose',
      painScore: 'Pain score',
      remarks: 'Remarks',
      saved: 'Readings recorded',
      saveFailed: 'Failed to record the readings',
      nothingEntered: 'Enter at least one reading',
      unit: {
        temperature: '°C',
        pulse: 'bpm',
        respiratoryRate: '/min',
        bloodPressure: 'mmHg',
        spo2: '%',
        weight: 'kg',
        height: 'cm',
        bloodGlucose: 'mg/dL'
      }
    },

    encounters: {
      title: 'Recent consultations',
      empty: 'No consultations yet',
      open: 'Open'
    },

    billing: {
      title: 'Bills',
      empty: 'Nothing billed yet',
      emptyForVisit: 'Nothing billed on this visit',
      noVisit: 'No visit',
      open: 'Open',
      settled: 'Settled',
      outstanding: 'Outstanding',
      showingOf: 'Latest {{shown}} of {{total}} — see all',
      filter: {
        label: 'Filter the bills by visit',
        all: 'All visits'
      }
    }
  },

  prescriptions: {
    entity: 'Prescription',
    title: 'Prescriptions',
    description: 'What has been prescribed, and what still needs dispensing',
    searchPlaceholder: 'Search by prescription number...',
    empty: 'No prescriptions',
    loadFailed: 'Failed to load the prescriptions',

    column: {
      prescriptionNo: 'No',
      date: 'Written',
      patient: 'Patient',
      doctor: 'Doctor',
      items: 'Items',
      status: 'Status'
    },

    status: {
      draft: 'Draft',
      active: 'To dispense',
      dispensed: 'Dispensed',
      cancelled: 'Cancelled'
    },

    form: {
      title: 'Write a prescription',
      patient: 'Patient',
      doctor: 'Prescriber',
      notes: 'Notes',
      items: 'Medicines',
      addItem: 'Add a medicine',
      item: 'Medicine',
      itemName: 'Name',
      itemNameHelp:
        'A medicine the hospital does not stock can still be written here — the pharmacy sources it or tells the patient where to.',
      dose: 'Dose',
      doseUnit: 'Unit',
      frequency: 'Frequency',
      route: 'Route',
      durationDays: 'Days',
      quantity: 'Quantity',
      instructions: 'Instructions',
      substitution: 'Substitution allowed',
      needsItem: 'Add at least one medicine',
      submit: 'Write the prescription',
      saved: 'Prescription written',
      saveFailed: 'Failed to write the prescription'
    },

    warning: {
      title: 'Allergy warning',
      body: 'This patient is recorded as reacting to {{allergen}} ({{severity}}).',
      note: 'The prescription has been saved. Check it before the patient takes it.'
    },

    action: {
      dispense: 'Mark dispensed',
      cancel: 'Cancel',
      print: 'Print'
    },

    toast: {
      dispensed: 'Prescription marked dispensed',
      cancelled: 'Prescription cancelled',
      failed: 'Failed to update the prescription'
    }
  },

  icdCodes: {
    entity: 'ICD code',
    title: 'ICD Codes',
    description: 'The diagnosis vocabulary the coding screen picks from',
    searchPlaceholder: 'Search by code or description...',
    empty: 'No codes',
    deleteTitle: 'Delete ICD code',
    deleteBody: 'Delete "{{name}}"? Diagnoses already coded with it keep their text.',
    column: {
      code: 'Code',
      description: 'Description',
      category: 'Chapter',
      active: 'Active'
    }
  },

  // -------------------------------------------------------------------------
  // HR
  // -------------------------------------------------------------------------
  shifts: {
    entity: 'Shift',
    title: 'Shifts',
    description: 'The named blocks of the clock the roster is built from',
    searchPlaceholder: 'Search by code or name...',
    empty: 'No shifts defined',
    deleteTitle: 'Delete shift',
    deleteBody: 'Delete "{{name}}"? Rosters already using it must be changed first.',

    column: {
      code: 'Code',
      name: 'Name',
      hours: 'Hours',
      duration: 'Paid hours',
      break: 'Break',
      grace: 'Grace',
      night: 'Night',
      active: 'Active'
    },

    form: {
      code: 'Code',
      name: 'Name',
      startTime: 'Starts',
      endTime: 'Ends',
      endHelp: 'A shift ending before it starts runs past midnight, which is normal here.',
      breakMinutes: 'Break (minutes)',
      graceMinutes: 'Grace period (minutes)',
      graceHelp:
        'How late is still on time. A handover has a few minutes of slack in it, and marking a nurse late for arriving at 07:02 produces a record nobody believes.',
      isNight: 'Night shift',
      active: 'Active'
    }
  },

  holidays: {
    entity: 'Holiday',
    title: 'Holidays',
    description: 'Days the hospital pays for but does not roster normally',
    searchPlaceholder: 'Search by name...',
    empty: 'No holidays set',
    deleteTitle: 'Delete holiday',
    deleteBody: 'Delete "{{name}}"?',
    column: {
      date: 'Date',
      name: 'Name',
      paid: 'Paid'
    },
    form: {
      date: 'Date',
      name: 'Name',
      isPaid: 'Paid'
    }
  },

  roster: {
    title: 'Duty Roster',
    description: 'Who is on which shift',
    loadFailed: 'Failed to load the roster',
    empty: 'Nobody is rostered for this period',

    week: 'Week',
    department: 'Department',
    allDepartments: 'All departments',
    previous: 'Previous',
    next: 'Next',
    today: 'This week',
    employee: 'Employee',
    off: 'Off',

    action: {
      assign: 'Assign a shift',
      publish: 'Publish',
      clear: 'Clear'
    },

    assign: {
      title: 'Assign a shift',
      employee: 'Employee',
      date: 'Date',
      shift: 'Shift',
      department: 'Department',
      room: 'Room',
      remarks: 'Remarks',
      submit: 'Assign',
      saved: 'Roster saved',
      saveFailed: 'Failed to save the roster'
    },

    publish: {
      title: 'Publish this roster',
      body:
        'Publishing makes this the version the ward works to. Drafted days between {{from}} and {{to}} are published; days already published are unaffected.',
      confirm: 'Publish',
      done: '{{count}} days published',
      failed: 'Failed to publish the roster'
    },

    status: {
      planned: 'Draft',
      published: 'Published',
      cancelled: 'Cancelled'
    },

    remove: {
      title: 'Remove from the roster',
      body: 'Take {{name}} off {{date}}?',
      done: 'Removed from the roster'
    }
  },

  attendance: {
    title: 'Attendance',
    description: 'What actually happened, against what was rostered',
    empty: 'Nothing recorded for this period',
    loadFailed: 'Failed to load the attendance',

    tab: {
      daily: 'Daily',
      summary: 'Monthly summary'
    },

    column: {
      date: 'Date',
      employee: 'Employee',
      shift: 'Shift',
      checkIn: 'In',
      checkOut: 'Out',
      status: 'Status',
      worked: 'Worked',
      overtime: 'Overtime',
      late: 'Late',
      locked: 'Locked'
    },

    summaryColumn: {
      employee: 'Employee',
      present: 'Present',
      absent: 'Absent',
      leave: 'Leave',
      late: 'Late',
      halfDay: 'Half days',
      holiday: 'Holidays',
      workedHours: 'Hours',
      overtimeHours: 'Overtime',
      lateMinutes: 'Late (min)'
    },

    status: {
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      'half-day': 'Half day',
      leave: 'Leave',
      holiday: 'Holiday',
      'off-day': 'Off'
    },

    lockedNotice: 'Locked by a payroll run and no longer editable',

    action: {
      record: 'Record a day',
      clockIn: 'Clock in',
      clockOut: 'Clock out'
    },

    form: {
      title: 'Record attendance',
      employee: 'Employee',
      date: 'Date',
      status: 'Status',
      checkIn: 'Clocked in',
      checkOut: 'Clocked out',
      workedMinutes: 'Minutes worked',
      overtimeMinutes: 'Overtime minutes',
      remarks: 'Remarks',
      saved: 'Attendance saved',
      saveFailed: 'Failed to save the attendance'
    },

    clock: {
      clockedIn: 'Clocked in',
      clockedOut: 'Clocked out',
      failed: 'Failed to record the clocking'
    },

    hours: '{{count}} h'
  },

  leaveTypes: {
    entity: 'Leave type',
    title: 'Leave Types',
    description: 'The categories of leave and what each is worth',
    searchPlaceholder: 'Search by code or name...',
    empty: 'No leave types',
    deleteTitle: 'Delete leave type',
    deleteBody: 'Delete "{{name}}"? Requests already made against it are unaffected.',

    column: {
      code: 'Code',
      name: 'Name',
      daysPerYear: 'Days a year',
      paid: 'Paid',
      approval: 'Needs approval',
      carryForward: 'Carries forward',
      active: 'Active'
    },

    form: {
      code: 'Code',
      name: 'Name',
      daysPerYear: 'Days a year',
      isPaid: 'Paid leave',
      isPaidHelp: 'Unpaid days reduce the salary in the payroll run.',
      requiresApproval: 'Needs approval',
      requiresApprovalHelp:
        'Turn this off and the leave is granted on application, which is right for the categories nobody signs off.',
      carryForward: 'Unused days carry forward',
      maxCarryDays: 'Maximum days carried',
      active: 'Active'
    }
  },

  leave: {
    entity: 'Leave request',
    title: 'Leave',
    description: 'Applications for time off',
    searchPlaceholder: 'Search by request number...',
    empty: 'No leave requests',
    loadFailed: 'Failed to load the leave requests',

    column: {
      requestNo: 'No',
      employee: 'Employee',
      type: 'Type',
      from: 'From',
      to: 'To',
      days: 'Days',
      status: 'Status',
      decidedBy: 'Decided by'
    },

    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Refused',
      cancelled: 'Withdrawn'
    },

    apply: {
      title: 'Apply for leave',
      employee: 'Employee',
      leaveType: 'Leave type',
      fromDate: 'From',
      toDate: 'To',
      isHalfDay: 'Half day',
      isHalfDayHelp: 'Only over a single date.',
      reason: 'Reason',
      handover: 'Handover',
      handoverHelp: 'Who is covering, and what they need to know.',
      balance: 'Balance',
      available: '{{count}} days left',
      submit: 'Apply',
      applied: 'Leave applied for',
      failed: 'Failed to apply for leave',
      endBeforeStart: 'Leave cannot end before it starts'
    },

    balances: {
      title: 'Leave balances',
      year: 'Year',
      type: 'Type',
      entitled: 'Entitled',
      carriedOver: 'Carried over',
      used: 'Used',
      available: 'Left',
      empty: 'No entitlements set',
      loadFailed: 'Failed to load the balances'
    },

    action: {
      approve: 'Approve',
      reject: 'Refuse',
      cancel: 'Withdraw',
      balances: 'Balances'
    },

    decide: {
      approveTitle: 'Approve this leave',
      approveBody:
        'The days are marked as leave on the attendance sheet, so the payroll run reads them without being told separately.',
      rejectTitle: 'Refuse this leave',
      rejectBody: 'The reserved days go back to the balance.',
      cancelTitle: 'Withdraw this application',
      cancelBody:
        'The days go back to the balance. Days already locked by a payroll run stay as they were paid.',
      remarks: 'Remarks',
      reasonRequired: 'A reason is required to refuse leave'
    },

    inChain:
      'This request is in an approval chain. Decide it from the Approvals screen so both records agree.',

    toast: {
      approved: 'Leave approved',
      rejected: 'Leave refused',
      cancelled: 'Leave withdrawn',
      failed: 'Failed to decide the leave request'
    }
  },

  salary: {
    title: 'Salary Structures',
    description: 'What each person is paid, and from when',
    empty: 'No salary structures',
    loadFailed: 'Failed to load the salary structures',

    column: {
      employee: 'Employee',
      effectiveFrom: 'From',
      effectiveTo: 'Until',
      basic: 'Basic',
      workingDays: 'Working days',
      overtimeRate: 'Overtime rate',
      active: 'Current'
    },

    form: {
      title: 'Set a salary',
      employee: 'Employee',
      effectiveFrom: 'In force from',
      effectiveFromHelp:
        'A change of salary is a new structure, not an edit — a payroll run for March reads March’s figures even when it is processed in May.',
      basicSalary: 'Basic salary',
      currency: 'Currency',
      workingDaysPerMonth: 'Working days a month',
      overtimeRate: 'Overtime multiplier',
      remarks: 'Remarks',
      components: 'Allowances and deductions',
      addComponent: 'Add one',
      componentType: 'Type',
      componentName: 'Name',
      calcType: 'Calculated as',
      value: 'Value',
      percentHelp: 'A percentage is of basic pay, never of the running total.',
      submit: 'Save',
      saved: 'Salary structure saved',
      saveFailed: 'Failed to save the salary structure',
      basicRequired: 'A basic salary above zero is required'
    },

    componentType: {
      earning: 'Allowance',
      deduction: 'Deduction'
    },

    calcType: {
      fixed: 'A fixed amount',
      percent: 'A percentage of basic'
    }
  },

  payroll: {
    title: 'Payroll',
    description: 'A month of attendance turned into payslips',
    empty: 'No payroll runs',
    loadFailed: 'Failed to load the payroll runs',

    column: {
      runNo: 'Run',
      period: 'Period',
      employees: 'Employees',
      gross: 'Gross',
      deductions: 'Deductions',
      net: 'Net',
      status: 'Status'
    },

    status: {
      draft: 'Draft',
      processed: 'Processed',
      approved: 'Approved',
      paid: 'Paid',
      cancelled: 'Cancelled'
    },

    action: {
      newRun: 'New run',
      process: 'Process',
      reprocess: 'Process again',
      submit: 'Send for approval',
      markPaid: 'Mark paid',
      payslips: 'Payslips'
    },

    create: {
      title: 'Open a payroll run',
      year: 'Year',
      month: 'Month',
      remarks: 'Remarks',
      submit: 'Open',
      created: 'Payroll run opened',
      failed: 'Failed to open the payroll run'
    },

    process: {
      title: 'Process this run',
      body:
        'Payslips are generated from the salary structures and the attendance for the period, and the attendance is then locked so a payslip cannot change underneath itself.',
      reprocessBody:
        'The existing payslips are discarded and rebuilt from the current attendance. Only a draft or processed run can be reprocessed.',
      confirm: 'Process',
      done: 'Payroll processed',
      failed: 'Failed to process the payroll'
    },

    submit: {
      title: 'Send for approval',
      body: 'With no approval chain configured the run is approved outright, so a month’s pay is never stranded.',
      confirm: 'Send',
      done: 'Sent for approval',
      failed: 'Failed to send the run for approval'
    },

    markPaid: {
      title: 'Mark this run paid',
      body: 'Record that the money has gone out. This closes the run.',
      confirm: 'Mark paid',
      done: 'Payroll marked paid',
      failed: 'Failed to mark the payroll paid'
    },

    payslips: {
      title: 'Payslips',
      empty: 'No payslips in this run',
      column: {
        employee: 'Employee',
        present: 'Present days',
        basic: 'Earned basic',
        overtime: 'Overtime',
        gross: 'Gross',
        deductions: 'Deductions',
        net: 'Net pay'
      }
    },

    payslip: {
      title: 'Payslip',
      employee: 'Employee',
      period: 'Period',
      runNo: 'Run',
      attendance: 'Attendance',
      workingDays: 'Working days',
      presentDays: 'Present',
      leaveDays: 'Leave',
      absentDays: 'Absent',
      overtimeHours: 'Overtime hours',
      earnings: 'Earnings',
      deductions: 'Deductions',
      gross: 'Gross pay',
      totalDeductions: 'Total deductions',
      netPay: 'Net pay',
      loadFailed: 'Failed to load the payslip'
    },

    month: {
      jan: 'January',
      feb: 'February',
      mar: 'March',
      apr: 'April',
      may: 'May',
      jun: 'June',
      jul: 'July',
      aug: 'August',
      sep: 'September',
      oct: 'October',
      nov: 'November',
      dec: 'December'
    }
  },

  // -------------------------------------------------------------------------
  // Reporting
  // -------------------------------------------------------------------------
  reports: {
    entity: 'Report',
    title: 'Reports',
    description: 'Saved reports, and a builder for the questions the screens do not answer',
    searchPlaceholder: 'Search by code or name...',
    empty: 'No saved reports',
    loadFailed: 'Failed to load the reports',

    column: {
      code: 'Code',
      name: 'Name',
      category: 'Category',
      source: 'Data',
      system: 'Built-in',
      active: 'Active'
    },

    systemBadge: 'Built-in',
    systemNote: 'Built-in reports can be run and copied but not edited.',

    action: {
      run: 'Run',
      build: 'New report',
      duplicate: 'Duplicate',
      save: 'Save this report',
      export: 'Export'
    },

    builder: {
      title: 'Report Builder',
      description: 'Choose what to read, what to show, and how to narrow it',
      source: 'Data',
      chooseSource: 'Choose what to report on',
      noSources: 'You do not have permission to read any report source',
      columns: 'Columns',
      chooseColumns: 'Pick at least one column',
      filters: 'Filters',
      addFilter: 'Add a filter',
      field: 'Field',
      operator: 'Is',
      value: 'Value',
      grouping: 'Group by',
      addGrouping: 'Add a grouping',
      aggregates: 'Summarise',
      addAggregate: 'Add a figure',
      function: 'Function',
      period: 'Period',
      from: 'From',
      to: 'To',
      sortBy: 'Sort by',
      sortOrder: 'Order',
      rowLimit: 'Row limit',
      run: 'Run',
      running: 'Running...',
      results: 'Results',
      noResults: 'No rows matched',
      runFirst: 'Run the report to see the results',
      rowCount: '{{count}} rows',
      truncated:
        'Showing the first {{count}} rows only. Narrow the period or the filters to see the rest — a total taken from this is not the whole answer.',
      duration: '{{ms}} ms'
    },

    operator: {
      eq: 'is',
      ne: 'is not',
      gt: 'is more than',
      gte: 'is at least',
      lt: 'is less than',
      lte: 'is at most',
      contains: 'contains',
      in: 'is one of',
      isNull: 'is empty',
      notNull: 'is not empty'
    },

    aggregate: {
      sum: 'Total',
      avg: 'Average',
      min: 'Lowest',
      max: 'Highest',
      count: 'Count'
    },

    sortOrder: {
      asc: 'Ascending',
      desc: 'Descending'
    },

    save: {
      title: 'Save this report',
      code: 'Code',
      name: 'Name',
      description: 'Description',
      category: 'Category',
      submit: 'Save',
      saved: 'Report saved',
      failed: 'Failed to save the report'
    },

    deleteTitle: 'Delete report',
    deleteBody: 'Delete "{{name}}"? Anyone using it will lose it.',

    export: {
      excel: 'Excel',
      csv: 'CSV',
      pdf: 'PDF',
      exporting: 'Preparing the file...',
      done: 'Export downloaded',
      failed: 'Failed to export the report',
      pdfFontNote:
        'PDF export renders Latin text only unless a Unicode font is configured on the server. Excel and CSV are exact either way.'
    },

    runs: {
      title: 'Export history',
      description: 'What has been taken out of the building, and by whom',
      empty: 'Nothing exported yet',
      column: {
        when: 'When',
        report: 'Report',
        source: 'Data',
        format: 'Format',
        rows: 'Rows',
        user: 'By'
      }
    }
  }
} as const;
