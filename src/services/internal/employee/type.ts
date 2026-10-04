import { UserRole } from '@/services/roles';
import type { Organization } from '../organization/types';

export type { Organization };

export type UserStatus =
  | 'available' // ready to work
  | 'resting' // амарсан - resting/off duty
  | 'sick_leave' // өвчтэй - on sick leave
  | 'on_leave' // чөлөөтэй (vacation) - on vacation/leave
  | 'inactive'; // idled/deactivated

export type DriverShiftGroup = 'A' | 'B' | 'C' | 'D';

export const driverShiftGroupOptions = [
  { value: 'A', label: 'A ээлж' },
  { value: 'B', label: 'B ээлж' },
  { value: 'C', label: 'C ээлж' },
  { value: 'D', label: 'D ээлж' },
];

export interface GetUserInput {
  id: string;
  offset: number;
  limit: number;
}

// export type UserRole =   'superadmin' | 'admin'| 'markscheider' | 'driver'| 'dispatcher'| 'hr'| 'ita'| 'mechanic'

export const UserRoleTypeMap: Record<string, string> = {
  superadmin: 'Супер админ',
  admin: 'Админ',
  dispatcher: 'Диспатчер',
  driver: 'Оператор',
  assistant_operator: 'Туслах техник оператор',
  markscheider: 'Маркшейдэр',
  hr: 'Хүний нөөц',
  ita: 'ИТА',
  mechanic: 'Механик',
  fuel_operator: 'Түлш хариуцсан ажилтан',
  manager: 'Удирдлага',
};

export const userRoleOptions = [
  { value: 'superadmin', label: 'Супер админ' },
  { value: 'admin', label: 'Админ' },
  { value: 'dispatcher', label: 'Диспатчер' },
  { value: 'driver', label: 'Оператор' },
  { value: 'assistant_operator', label: 'Туслах техник оператор' },
  { value: 'markscheider', label: 'Маркшейдэр' },
  { value: 'hr', label: 'Хүний нөөц' },
  { value: 'ita', label: 'ИТА' },
  { value: 'mechanic', label: 'Механик' },
  { value: 'fuel_operator', label: 'Түлш хариуцсан ажилтан' },
  { value: 'manager', label: 'Удирдлага' },
];

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  status: UserStatus;
  role: UserRole;
  phoneNumber: string;
  email: string;
  imageUrl?: string;
  name?: string;
  position?: string;

  department?: string | null;
  registerNumber?: string | null;
  driverLicenseExpiryDate?: string | null;
  ettDriverLicenseExpiryDate?: string | null;
  entryPermitExpiryDate?: string | null;

  driverShiftGroup?: DriverShiftGroup | null;
  organization: Organization;
  createdAt: string;
};

export type EmployeeFilters = {
  offset: number;
  limit: number;
  name?: string;
  status?: UserStatus;
  role?: UserRole;
  driverShiftGroup?: DriverShiftGroup;
  position?: string;
  department?: string;
  registerNumber?: string;
  phoneNumber?: string;
  email?: string;
};

export type CreateEmployeeInput = {
  phone: number;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  email?: string;
  position?: string;

  department?: string | null;
  registerNumber?: string | null;
  driverLicenseExpiryDate?: string | null;
  ettDriverLicenseExpiryDate?: string | null;
  entryPermitExpiryDate?: string | null;

  driverShiftGroup?: DriverShiftGroup | null;
  imageUrl?: string;
  organizationId?: string;
};

export type UpdateEmployeeStatusInput = {
  userId: string;
  status?: UserStatus;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  email?: string;
  position?: string;

  department?: string | null;
  registerNumber?: string | null;
  driverLicenseExpiryDate?: string | null;
  ettDriverLicenseExpiryDate?: string | null;
  entryPermitExpiryDate?: string | null;

  driverShiftGroup?: DriverShiftGroup | null;
  imageUrl?: string;
  organizationId?: string;
};

export type EmployeesResponse = {
  data: Employee[];
  totalCount: number;
};

export const EmployeePositionMap = [
  { value: 'executive_director', label: 'Гүйцэтгэх захирал' },
  {
    value: 'administrative_director',
    label: 'Үйл ажиллагаа хариуцсан захирал',
  },
  // { value: "technical_manager", label: "Техникийн менежер" },
  { value: 'project_manager', label: 'Төслийн менежер' },
  { value: 'mine_director', label: 'Уурхайн дарга' },
  { value: 'operations_engineer', label: 'Ашиглалтын инженер' },
  { value: 'general_accountant', label: 'Ерөнхий нягтлан' },
  { value: 'senior_accountant', label: 'Ахлах нягтлан бодогч' },
  { value: 'accountant', label: 'Нягтлан бодогч' },
  { value: 'mine_accountant', label: 'Уурхайн нягтлан' },
  { value: 'fuel_clerk', label: 'Түлшний нярав' },
  { value: 'spare_parts_clerk', label: 'Сэлбэгийн нярав' },
  { value: 'hr_manager', label: 'Хүний нөөцийн менежер' },
  { value: 'mine_document_manager', label: 'Уурхайн бичиг хэргийн ажилтан' },
  // { value: "training_specialist", label: "Сургалт хариуцсан ажилтан" },
  { value: 'camping_manager', label: 'Кемп менежер' },
  { value: 'camping_worker', label: 'Кемп аж ахуйн ажилтан' },
  { value: 'markscheider', label: 'Маркшейдер' },
  { value: 'geologist', label: 'Геологич' },
  { value: 'mine_master', label: 'Уулын мастер' },
  { value: 'hs_manager', label: 'ХАБЭА-н сургагч' },
  { value: 'hs_officer', label: 'ХАБЭА-н ажилтан' },
  { value: 'repair_hs_officer', label: 'Засварын ХАБЭА' },
  { value: 'training_instructor', label: 'Уулын сургагч' },
  { value: 'environment_specialist', label: 'Байгаль орчны мэргэжилтэн' },
  { value: 'fire_safety_officer', label: 'Гал сөнөөгч' },
  { value: 'dispatcher', label: 'Диспетчер' },
  { value: 'excavator_operator', label: 'Экскаваторын оператор' },
  { value: 'crusher_operator', label: 'Ковшийн оператор' },
  { value: 'bulldozer_operator', label: 'Бульдозерын оператор' },
  { value: 'auto_repair_operator', label: 'Автогрейдерийн оператор' },
  { value: 'truck_driver', label: 'Түлшний машины жолооч' },
  { value: 'bus_driver', label: 'Автобусны жолооч' },
  { value: 'water_truck_driver', label: 'Усны машины жолооч' },
  { value: 'repair_engineer', label: 'Засвар төлөвлөгчийн инженер' },
  { value: 'maintainence_manager', label: 'Засварын менежер' },
  { value: 'repair_mechanic', label: 'Засварын механик' },
  { value: 'light_tech_mechanic', label: 'Гэрэлт техникийн механик' },
  { value: 'warehouse_keeper', label: 'Агуулахын нярав' },
  { value: 'mechanic', label: 'Механик' },
  { value: 'welder', label: 'Гагнуурчин' },
  { value: 'electrician', label: 'Цахилгаанчин' },
  { value: 'assistant_mechanic', label: 'Дуугийн механик' },
  { value: 'repair_assistant', label: 'Засварын туслах' },
];

export const EmployeePositionMapMn = [
  'Гүйцэтгэх захирал',
  'Үйл ажиллагаа хариуцсан захирал',
  // "Техникийн менежер",
  'Төслийн менежер',
  'Уурхайн дарга',
  'Ашиглалтын инженер',
  'Ерөнхий нягтлан',
  'Ахлах нягтлан бодогч',
  'Нягтлан бодогч',
  'Уурхайн нягтлан',
  'Түлшний нярав',
  'Сэлбэгийн нярав',
  'Хүний нөөцийн менежер',
  'Уурхайн бичиг хэргийн ажилтан',
  // "Сургалт хариуцсан ажилтан",
  'Кемп менежер',
  'Кемп аж ахуйн ажилтан',
  'Маркшейдер',
  'Геологич',
  'Уулын мастер',
  'ХАБЭА-н сургагч',
  'ХАБЭА-н ажилтан',
  'Засварын ХАБЭА',
  'Уулын сургагч',
  'Байгаль орчны мэргэжилтэн',
  'Гал сөнөөгч',
  'Диспетчер',
  'Экскаваторын оператор',
  'Ковшийн оператор',
  'Бульдозерын оператор',
  'Автогрейдерийн оператор',
  'Түлшний машины жолооч',
  'Автобусны жолооч',
  'Усны машины жолооч',
  'Засвар төлөвлөгчийн инженер',
  'Засварын менежер',
  'Засварын механик',
  'Гэрэлт техникийн механик',
  'Агуулахын нярав',
  'Механик',
  'Гагнуурчин',
  'Цахилгаанчин',
  'Дуугийн механик',
  'Засварын туслах',
];

export interface UserPublic {
  id: string;
  firstName: string;
  lastName: string;
  organizationId: string | null;
}

export interface UserPrivate extends UserPublic {
  email: string;
  role: UserRole;
  createdAt: string;
  imageUrl: string;
  isActive: boolean;

  organization: Organization | null;

  phoneNumber: string;
}

export type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
};

export type UpdateUserInput = CreateUserInput & {
  id: string;
};