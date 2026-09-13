/**
 * System settings that are not part of one module's screens.
 *
 * The inventory settings live under `inventory` because that is the section
 * they belong to; these are the ones that govern the registration forms, which
 * belong to no single module — the same rules apply to the patient page and the
 * employee dialog.
 */
export const settings = {
  requiredFields: {
    title: 'Registration Fields',
    description: 'Which details the desk must collect when registering a patient or a member of staff',

    guard: {
      title: 'Some fields cannot be made optional',
      body:
        'A patient needs a name, a gender and a registration category before a record can exist at all, ' +
        'and a staff record needs an employee number, a name, a department, a category and a gender. ' +
        'Those are shown here so the list is complete, but their switches are locked.'
    },

    form: {
      patient: 'Patient registration',
      employee: 'Staff records'
    },

    formHint: {
      patient: 'The registration desk fills this in, often while the patient is standing at the counter.',
      employee: 'Filled in by administration when someone joins, and edited rarely afterwards.'
    },

    chosen: '{{chosen}} of {{total}} required',
    always: 'Always required',
    alwaysHint: 'The record cannot be saved without it.',

    implication: {
      identityType:
        'Choosing NRC also requires all four of its parts — a half-written NRC identifies nobody.',
      nrcNo: 'The state number, district and type are required alongside it.'
    },

    saved: 'Registration fields updated',
    failed: 'Failed to load the registration field settings'
  }
} as const;
