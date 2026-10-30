import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { navigationGroups } from '@/config/navigation';
import { ActiveRoleProvider } from '@/features/permissions/activeRoleContext';
import { ClosingPage } from '@/pages/ClosingPage';
import { DailyAttendancePage } from '@/pages/DailyAttendancePage';
import { EmployeeProfilesPage } from '@/pages/EmployeeProfilesPage';
import { LeavePage } from '@/pages/LeavePage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { RolePermissionsPage } from '@/pages/RolePermissionsPage';
import { SystemSettingsPage } from '@/pages/SystemSettingsPage';
import { TimesheetPage } from '@/pages/TimesheetPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { WorkSchedulePage } from '@/pages/WorkSchedulePage';

const DAILY_ATTENDANCE_PATH = '/nhan-su/cham-cong-hang-ngay';
const WORK_SCHEDULE_PATH = '/nhan-su/lich-lam-viec';
const TIMESHEET_PATH = '/nhan-su/bang-cham-cong';
const CLOSING_PATH = '/nhan-su/chot-cong';
const LEAVE_PATH = '/nhan-su/so-phep';
const EMPLOYEE_PROFILES_PATH = '/nhan-su/ho-so-nhan-vien';
const SYSTEM_SETTINGS_PATH = '/nhan-su/cau-hinh';
const USER_MANAGEMENT_PATH = '/he-thong/nguoi-dung';
const ROLE_PERMISSIONS_PATH = '/he-thong/phan-quyen-vai-tro';
const firstPage = navigationGroups[0].items[0].path;

function App() {
  return (
    <ActiveRoleProvider>
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to={firstPage} replace />} />
        <Route path={DAILY_ATTENDANCE_PATH} element={<DailyAttendancePage />} />
        <Route path={WORK_SCHEDULE_PATH} element={<WorkSchedulePage />} />
        <Route path={TIMESHEET_PATH} element={<TimesheetPage />} />
        <Route path={CLOSING_PATH} element={<ClosingPage />} />
        <Route path={LEAVE_PATH} element={<LeavePage />} />
        <Route path={EMPLOYEE_PROFILES_PATH} element={<EmployeeProfilesPage />} />
        <Route path={SYSTEM_SETTINGS_PATH} element={<SystemSettingsPage />} />
        <Route path={USER_MANAGEMENT_PATH} element={<UserManagementPage />} />
        <Route path={ROLE_PERMISSIONS_PATH} element={<RolePermissionsPage />} />
        {navigationGroups.flatMap((group) =>
          group.items
            .filter((item) => ![DAILY_ATTENDANCE_PATH, WORK_SCHEDULE_PATH, TIMESHEET_PATH, CLOSING_PATH, LEAVE_PATH, EMPLOYEE_PROFILES_PATH, SYSTEM_SETTINGS_PATH, USER_MANAGEMENT_PATH, ROLE_PERMISSIONS_PATH].includes(item.path))
            .map((item) => (
              <Route key={item.path} path={item.path} element={<PlaceholderPage group={group} item={item} />} />
            ))
        )}
        <Route path="*" element={<Navigate to={firstPage} replace />} />
      </Route>
    </Routes>
    </ActiveRoleProvider>
  );
}

export default App;
