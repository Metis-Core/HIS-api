export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',   
  PENDING_RESET = 'PENDING_RESET', // My plan here is the manadatory resetsof passwords for a given set of time. This will help with security
}