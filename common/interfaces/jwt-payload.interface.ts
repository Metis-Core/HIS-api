import { AccountStatus } from 'common/enums/userStatus.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { Department } from 'common/enums/department.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  department: Department;
  status: AccountStatus;
  type: 'access' | 'refresh';
}
