import type { Gender, MaritalStatus, NrcStateNumber, NrcType } from '@/types/models';

/**
 * Option lists for the person fields that patients and employees share.
 *
 * They live here rather than in either module because both forms have to offer
 * exactly the same choices: the columns behind them are the same MySQL enums,
 * so a list that drifts on one screen starts producing rows the other rejects.
 */

export const GENDERS: Gender[] = ['male', 'female', 'others'];

export const MARITAL_STATUSES: MaritalStatus[] = ['single', 'married', 'divorced'];

export const NRC_STATE_NUMBERS: NrcStateNumber[] = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'
];

/** The citizenship marker in brackets, e.g. 12/OuKaMa(N)123456. */
export const NRC_TYPES: NrcType[] = ['N', 'A', 'P', 'Y', 'S', 'T'];
