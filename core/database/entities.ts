import { AuthToken } from 'src/auth/entities/auth-token.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Triage } from 'src/traige/entities/traige.entity';
import { User } from 'src/users/entities/user.entity';

export const entities = [User, AuthToken, Patient, Triage];
