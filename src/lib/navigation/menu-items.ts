import {
  Bell,
  CalendarDays,
  Building,
  CircleUserRound,
  Clock,
  FileChartColumn,
  Mountain,
  Truck,
  UserRound,
  Wrench,
  FileText,
  ClipboardCheck,
  Fuel,
} from 'lucide-react';

import {
  dailyPlanReadRoles,
  employeeReadRoles,
  inspectionReadRoles,
  markscheiderReportReadRoles,
  miningBlockReadRoles,
  miningReportRoles,
  miningRouteReadRoles,
  stockpileReadRoles,
} from '@/services/roles';

import { fuelControlRoles, fuelViewRoles } from '@/lib/fuel/roles';
import { MenuSection } from './menu-config';

export const menuSections: MenuSection[] = [
  // =========================================================
  // REPORT
  // =========================================================
  {
    title: 'Тайлан',
    key: 'report',
    items: [
      {
        icon: Mountain,
        name: 'Уулын ажлын нэгдсэн тайлан',
        path: '/mining-report',
        type: 'report',
        roles: miningReportRoles,
      },
      {
        icon: CalendarDays,
        name: 'Ээлжийн хуваарь',
        path: '/crew-schedule',
        type: 'report',
        roles: miningReportRoles,
      },
      {
        icon: FileChartColumn,
        name: 'Уулын ажлын тайлан',
        path: '/shift-report',
        type: 'report',
        roles: ['admin', 'dispatcher', 'ita'],
      },
      {
        icon: FileText,
        name: 'Маркшейдерийн хэмжилт',
        path: '/markshader-report',
        type: 'report',
        roles: markscheiderReportReadRoles,
      },
      {
        icon: ClipboardCheck,
        name: 'Үзлэгийн тайлан',
        path: '/inspection-report',
        type: 'report',
        roles: [
          'admin',
          'dispatcher',
          'ita',
          'mechanic',
        ],
      },
      {
        icon: CircleUserRound,
        name: 'Хүний нөөц',
        path: '/employees',
        type: 'register',
        roles: employeeReadRoles,
      },
    ],
  },

  // =========================================================
  // FUEL
  // =========================================================
  {
    title: 'Түлш',
    key: 'fuel',
    items: [
      {
        icon: Fuel,
        name: 'Түлшний хяналт',
        type: 'fuel',
        roles: fuelViewRoles,
        subItems: [
          { name: 'Тойм', path: '/fuel', roles: fuelViewRoles },
          { name: 'Олголт', path: '/fuel/refuelings', roles: fuelViewRoles },
          { name: 'Орлого', path: '/fuel/receipts', roles: fuelViewRoles },
          { name: 'Зарлага', path: '/fuel/issues', roles: fuelViewRoles },
          { name: 'Зарцуулалт', path: '/fuel/consumption', roles: fuelViewRoles },
          { name: 'Тайлан', path: '/fuel/reports', roles: fuelViewRoles },
          { name: 'Аудит', path: '/fuel/audit', roles: fuelControlRoles },
          { name: 'Тохиргоо', path: '/fuel/settings', roles: fuelControlRoles },
        ],
      },
    ],
  },

  {
    title: 'Цаг ашиглалт',

    key: 'other',

    items: [
      {
        icon: Clock,
        name: 'Цаг ашиглалт',
        type: 'other',

        subItems: [
          {
            name: 'Цаг бүртгэл',
            path: '/time-management',
            roles: ['admin', 'dispatcher', 'mechanic'],
          },
          {
            name: 'Засварын хэлтэс',
            path: '/time-management/repair',
            roles: ['admin', 'dispatcher', 'mechanic'],
          },
        ],

        roles: [
          'admin',
          'dispatcher',
          'mechanic',
        ],
      },
    ],
  },

  // =========================================================
  // REGISTER
  // =========================================================
  {
    title: 'Бүртгэл',
    key: 'register',
    items: [
      // =====================================================
      // ORGANIZATION
      // =====================================================
      {
        icon: Building,
        name: 'Байгууллага',
        path: '/organizations',
        type: 'register',
        roles: ['superadmin'],
      },

      {
        icon: UserRound,
        name: 'Админ хэрэглэгч',
        path: '/organization-admins',
        type: 'register',
        roles: ['superadmin'],
      },

      // =====================================================
      // MINING DEPARTMENT
      // =====================================================
      {
        icon: Mountain,
        name: 'Уулын хэлтэс',
        type: 'register',

        subItems: [
          {
            name: 'Блок ашиглалт',
            path: '/mining-block',
            roles: miningBlockReadRoles,
          },
          {
            name: 'Маршрут',
            path: '/routes',
            roles: miningRouteReadRoles,
          },
          {
            name: 'Техник бүртгэл',
            path: '/vehicles',
            roles: dailyPlanReadRoles,
          },
          {
            name: 'Сарын төлөвлөлт',
            path: '/monthly-plan',
            roles: dailyPlanReadRoles,
            badge: 'new',
          },
          {
            name: 'Өдрийн төлөвлөлт',
            path: '/daily-plan',
            roles: dailyPlanReadRoles,
            badge: 'new',
          },
          {
            name: 'Овоолго',
            path: '/stockpiles',
            roles: stockpileReadRoles,
          },
        ],

        roles: inspectionReadRoles,
      },

      // =====================================================
      // INSPECTION
      // =====================================================
      {
        icon: Truck,
        name: 'Засварын хэлтэс',
        type: 'register',

        subItems: [
          {
            name: 'Тойрох үзлэгийн хуудас',
            path: '/inspections',
            roles: inspectionReadRoles,
          },
        ],

        roles: inspectionReadRoles,
      },

      // =====================================================
      // SHIFT
      // =====================================================
      {
        icon: Wrench,
        name: 'Ээлжийн ажил',
        path: '/shift',
        type: 'register',
        roles: [
          'driver',
          'assistant_operator',
          'admin',
        ],
      },

      // =====================================================
      // NOTIFICATION
      // =====================================================
      {
        icon: Bell,
        name: 'Мэдэгдэл илгээх',
        path: '/notifications',
        type: 'register',
        roles: [
          'admin',
          'dispatcher',
          'superadmin',
        ],
      },
    ],
  },
];
