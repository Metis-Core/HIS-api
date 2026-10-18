import { UserRole } from 'common/enums/userRoles.enum';
import type { LabOrderItem } from '../entities/lab-order-item.entity';
import type { LabOrder } from '../entities/lab-order.entity';
import { LabOrderItemStatus } from '../enums/lab-order-item-status.enum';

/** H-10: a result leaves the lab only once it is verified. */
export const isReleased = (item: Pick<LabOrderItem, 'status'>) =>
  item.status === LabOrderItemStatus.VERIFIED;

const LAB_SIDE_ROLES: readonly UserRole[] = [
  UserRole.LAB_TECH,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

/** Clears values that are entered but not yet verified, so clinicians never act on them. */
export function withholdUnreleased(item: LabOrderItem): LabOrderItem {
  if (isReleased(item)) return item;
  item.resultData = null;
  item.resultFlags = null;
  item.resultNotes = null;
  item.isAbnormal = false;
  return item;
}

/** Lab staff see work in progress; everyone else sees only verified results. */
export function releaseFor<T extends LabOrder | LabOrder[]>(
  role: UserRole,
  orders: T,
): T {
  if (LAB_SIDE_ROLES.includes(role)) return orders;
  const list: LabOrder[] = Array.isArray(orders) ? orders : [orders];
  list.forEach((order) => order.items?.forEach(withholdUnreleased));
  return orders;
}
