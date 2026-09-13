/**
 * The person fields patients and employees share.
 *
 * They sit in their own slice for the same reason `constants/person.ts` exists:
 * the columns behind them are the same MySQL enums, so a label that drifts on
 * one screen would describe the other screen's data wrongly.
 */
export const person = {
  gender: {
    male: 'Male',
    female: 'Female',
    others: 'Others'
  },

  maritalStatus: {
    single: 'Single',
    married: 'Married',
    divorced: 'Divorced'
  },

  /** The citizenship marker in brackets, e.g. 12/OuKaMa(N)123456. */
  nrcType: {
    N: 'N — Naing (citizen)',
    A: 'A — Ay/Naing',
    P: 'P — Pyu',
    Y: 'Y — Yay',
    S: 'S — Sa',
    T: 'T — Thwe'
  },

  employmentStatus: {
    permanent: 'Permanent',
    temporary: 'Temporary',
    internship: 'Internship'
  },

  nrcRequired: 'Required for an NRC',
  ageRange: 'Enter an age between 0 and 150'
} as const;
