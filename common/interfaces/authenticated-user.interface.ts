import { AccountStatus } from 'common/enums/userStatus.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { Department } from 'common/enums/department.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  department: Department;
  status: AccountStatus;
}
