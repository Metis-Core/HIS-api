// Stable machine codes for services the system looks up itself; names stay free for staff to edit.
export const ServiceCode = {
  CONSULTATION: 'CONSULTATION',
} as const;

export type ServiceCodeValue = (typeof ServiceCode)[keyof typeof ServiceCode];

export const SERVICE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,31}$/;
