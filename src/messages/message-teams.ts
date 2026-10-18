import { UserRole } from 'common/enums/userRoles.enum';

/** A role-based mailbox: a message to a team reaches everyone on duty in it. */
export const MESSAGE_TEAMS = {
  reception: { label: 'Reception', roles: [UserRole.RECEPTIONIST] },
  nurses: { label: 'Nurses', roles: [UserRole.NURSE] },
  doctors: { label: 'Doctors', roles: [UserRole.DOCTOR] },
  laboratory: { label: 'Laboratory', roles: [UserRole.LAB_TECH] },
  pharmacy: { label: 'Pharmacy', roles: [UserRole.PHARMACIST] },
  accounts: { label: 'Accounts', roles: [UserRole.ACCOUNTANT] },
  administration: {
    label: 'Administration',
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
} as const;

export type MessageTeam = keyof typeof MESSAGE_TEAMS;

export const MESSAGE_TEAM_KEYS = Object.keys(MESSAGE_TEAMS) as MessageTeam[];
