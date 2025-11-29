import { create } from "zustand";
import { apiService } from "@/services/api";
import { storageService } from "@/services/storage";
import type { AttendanceHistoryItem } from "@/services/api";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employeeId: string;
  address: string;
  emergencyContact: string;
  bankAccount: string;
  ifscCode: string;
  avatar: string | null;
  organizationId?: string; // Organization ID for API calls
  adminId?: string; // Admin ID for attendance API calls
}

export interface MultipleCheckEntry {
  id: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalWorkingMinutes: number;
  remarks: string | null;
  checkInImage: string | null;
  checkOutImage: string | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "half-day" | "late";
  totalHours: number;
  location?: string;
  lastLoginStatus?: string | null; // "checkin" or "checkout"
  shiftName?: string | null; // Shift name from API
  multipleEntries?: MultipleCheckEntry[]; // Multiple check-in/check-out entries
}

export interface LeaveRequest {
  id: string;
  type: "casual" | "sick" | "privilege" | "wfh";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedDate: string;
}

export interface LeaveBalance {
  casual: number;
  sick: number;
  privilege: number;
  wfh: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignedBy: string;
  attachments: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface PaySlip {
  id: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  da: number;
  ta: number;
  otherAllowances: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  netSalary: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "public" | "company" | "optional";
  isFavorite: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "announcement" | "notice" | "policy";
  date: string;
  isRead: boolean;
}

interface HRMSState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  employee: Employee;
  todayAttendance: AttendanceRecord | null;
  attendanceHistory: AttendanceRecord[];
  leaveBalance: LeaveBalance;
  leaveRequests: LeaveRequest[];
  tasks: Task[];
  paySlips: PaySlip[];
  holidays: Holiday[];
  announcements: Announcement[];
  notificationsEnabled: boolean;

  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  completeOnboarding: () => void;
  checkIn: (base64Images?: string[]) => Promise<{ success: boolean; error?: string }>;
  checkOut: (base64Images?: string[]) => Promise<{ success: boolean; error?: string }>;
  fetchAttendanceHistory: (orgId?: string, fromDate?: string, toDate?: string) => Promise<void>;
  fetchTodayAttendance: () => Promise<void>;
  fetchAttendanceAfterPunch: () => Promise<void>;
  fetchAttendanceByDate: (date: string) => Promise<AttendanceRecord | null>;
  applyLeave: (leave: Omit<LeaveRequest, "id" | "status" | "appliedDate">) => void;
  updateTaskStatus: (taskId: string, status: Task["status"]) => void;
  addTaskComment: (taskId: string, text: string) => void;
  toggleHolidayFavorite: (holidayId: string) => void;
  markAnnouncementRead: (announcementId: string) => void;
  toggleNotifications: () => void;
  updateProfile: (updates: Partial<Employee>) => void;
}

const mockEmployee: Employee = {
  id: "EMP001",
  name: "John Anderson",
  email: "john.anderson@company.com",
  phone: "+1 234 567 8900",
  role: "Senior Software Engineer",
  department: "Engineering",
  employeeId: "EMP001",
  address: "123 Tech Street, San Francisco, CA 94102",
  emergencyContact: "+1 234 567 8901",
  bankAccount: "XXXX XXXX XXXX 4589",
  ifscCode: "BANK0001234",
  avatar: null,
};

const generateAttendanceHistory = (): AttendanceRecord[] => {
  const history: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 20; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const isLate = Math.random() > 0.8;
    const isAbsent = Math.random() > 0.9;
    
    history.push({
      id: `att-${i}`,
      date: date.toISOString().split("T")[0],
      checkIn: isAbsent ? null : isLate ? "10:15 AM" : "09:00 AM",
      checkOut: isAbsent ? null : "06:00 PM",
      status: isAbsent ? "absent" : isLate ? "late" : "present",
      totalHours: isAbsent ? 0 : isLate ? 7.75 : 9,
      location: "Office - Main Building",
    });
  }
  
  return history;
};

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "leave-1",
    type: "casual",
    startDate: "2025-12-01",
    endDate: "2025-12-02",
    reason: "Personal work",
    status: "approved",
    appliedDate: "2025-11-25",
  },
  {
    id: "leave-2",
    type: "sick",
    startDate: "2025-11-15",
    endDate: "2025-11-15",
    reason: "Not feeling well",
    status: "approved",
    appliedDate: "2025-11-15",
  },
  {
    id: "leave-3",
    type: "wfh",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    reason: "Expecting delivery at home",
    status: "pending",
    appliedDate: "2025-11-26",
  },
];

const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Complete API Integration",
    description: "Integrate the new payment gateway API with the mobile app. Ensure all edge cases are handled and proper error handling is in place.",
    status: "in-progress",
    priority: "high",
    dueDate: "2025-11-30",
    assignedBy: "Sarah Manager",
    attachments: 2,
    comments: [
      { id: "c1", author: "Sarah Manager", text: "Please prioritize this task", timestamp: "2025-11-24 10:00 AM" },
    ],
  },
  {
    id: "task-2",
    title: "Code Review - Auth Module",
    description: "Review the authentication module code changes submitted by the team.",
    status: "pending",
    priority: "medium",
    dueDate: "2025-12-01",
    assignedBy: "Tech Lead",
    attachments: 1,
    comments: [],
  },
  {
    id: "task-3",
    title: "Update Documentation",
    description: "Update the API documentation with the new endpoints and request/response formats.",
    status: "completed",
    priority: "low",
    dueDate: "2025-11-25",
    assignedBy: "Product Manager",
    attachments: 0,
    comments: [
      { id: "c2", author: "Product Manager", text: "Great work!", timestamp: "2025-11-25 04:00 PM" },
    ],
  },
  {
    id: "task-4",
    title: "Bug Fix - Login Screen",
    description: "Fix the keyboard overlap issue on the login screen for smaller devices.",
    status: "pending",
    priority: "high",
    dueDate: "2025-11-28",
    assignedBy: "QA Team",
    attachments: 3,
    comments: [],
  },
];

const mockPaySlips: PaySlip[] = [
  {
    id: "pay-1",
    month: "November",
    year: 2025,
    basicSalary: 50000,
    hra: 20000,
    da: 5000,
    ta: 3000,
    otherAllowances: 2000,
    pf: 6000,
    esi: 750,
    professionalTax: 200,
    tds: 8000,
    otherDeductions: 500,
    netSalary: 64550,
  },
  {
    id: "pay-2",
    month: "October",
    year: 2025,
    basicSalary: 50000,
    hra: 20000,
    da: 5000,
    ta: 3000,
    otherAllowances: 2000,
    pf: 6000,
    esi: 750,
    professionalTax: 200,
    tds: 8000,
    otherDeductions: 500,
    netSalary: 64550,
  },
  {
    id: "pay-3",
    month: "September",
    year: 2025,
    basicSalary: 50000,
    hra: 20000,
    da: 5000,
    ta: 3000,
    otherAllowances: 2000,
    pf: 6000,
    esi: 750,
    professionalTax: 200,
    tds: 8000,
    otherDeductions: 500,
    netSalary: 64550,
  },
];

const mockHolidays: Holiday[] = [
  { id: "h1", name: "New Year's Day", date: "2025-01-01", type: "public", isFavorite: false },
  { id: "h2", name: "Republic Day", date: "2025-01-26", type: "public", isFavorite: true },
  { id: "h3", name: "Good Friday", date: "2025-04-18", type: "public", isFavorite: false },
  { id: "h4", name: "Company Foundation Day", date: "2025-03-15", type: "company", isFavorite: true },
  { id: "h5", name: "Independence Day", date: "2025-08-15", type: "public", isFavorite: true },
  { id: "h6", name: "Diwali", date: "2025-10-20", type: "public", isFavorite: true },
  { id: "h7", name: "Christmas", date: "2025-12-25", type: "public", isFavorite: false },
  { id: "h8", name: "Team Building Day", date: "2025-06-20", type: "optional", isFavorite: false },
];

const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Year-End Performance Reviews",
    content: "Annual performance reviews will begin from December 1st. Please prepare your self-assessment documents by November 30th.",
    type: "announcement",
    date: "2025-11-26",
    isRead: false,
  },
  {
    id: "ann-2",
    title: "Updated Leave Policy",
    content: "Please note the updated leave policy effective from January 2026. Work from home days have been increased to 3 per week.",
    type: "policy",
    date: "2025-11-24",
    isRead: false,
  },
  {
    id: "ann-3",
    title: "Office Closure Notice",
    content: "The office will remain closed on December 24th and 25th for Christmas holidays. Emergency contact numbers will be shared via email.",
    type: "notice",
    date: "2025-11-22",
    isRead: true,
  },
  {
    id: "ann-4",
    title: "Health Insurance Renewal",
    content: "Health insurance policies are up for renewal. Please submit your updated documents by December 15th.",
    type: "notice",
    date: "2025-11-20",
    isRead: true,
  },
];

// Initialize API service with access token getter
apiService.setAccessTokenGetter(() => storageService.getAccessToken());

export const useHRMSStore = create<HRMSState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  hasSeenOnboarding: false,
  employee: mockEmployee,
  todayAttendance: null,
  attendanceHistory: [],
  leaveBalance: { casual: 8, sick: 10, privilege: 15, wfh: 12 },
  leaveRequests: mockLeaveRequests,
  tasks: mockTasks,
  paySlips: mockPaySlips,
  holidays: mockHolidays,
  announcements: mockAnnouncements,
  notificationsEnabled: true,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiService.login({ username, password });
      
      // Save tokens and user info to storage
      await storageService.saveAuthData({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        user_id: response.user_id,
        role: response.role,
      });

      // Fetch user profile/session info to get employee name and other details
      try {
        const sessionInfo = await apiService.getSessionInfo();
        if (sessionInfo.success && sessionInfo.data) {
          const userData = sessionInfo.data;
          
          set({ 
            isAuthenticated: true, 
            isLoading: false,
            employee: {
              ...get().employee,
              id: userData.user_id,
              name: userData.user_name || userData.username || get().employee.name,
              email: userData.email || get().employee.email,
              role: userData.role,
              organizationId: userData.organization_id,
              adminId: userData.admin_id,
            }
          });
        } else {
          // Fallback if session info fails
          set({ 
            isAuthenticated: true, 
            isLoading: false,
            employee: {
              ...get().employee,
              id: response.user_id,
              role: response.role,
            }
          });
        }
      } catch (sessionError) {
        console.error('Error fetching session info:', sessionError);
        // Still set authenticated even if session info fails
        set({ 
          isAuthenticated: true, 
          isLoading: false,
          employee: {
            ...get().employee,
            id: response.user_id,
            role: response.role,
          }
        });
      }

      // Fetch today's attendance after login
      await get().fetchTodayAttendance();

      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      await storageService.clearAuthData();
      set({ 
        isAuthenticated: false, 
        todayAttendance: null 
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear the state even if storage fails
      set({ 
        isAuthenticated: false, 
        todayAttendance: null 
      });
    }
  },

  checkAuth: async () => {
    try {
      const isAuth = await storageService.isAuthenticated();
      if (isAuth) {
        const userId = await storageService.getUserId();
        const userRole = await storageService.getUserRole();
        
        // Fetch session info to get employee name and details
        try {
          const sessionInfo = await apiService.getSessionInfo();
          if (sessionInfo.success && sessionInfo.data) {
            const userData = sessionInfo.data;
            
            set({ 
              isAuthenticated: true,
              employee: {
                ...get().employee,
                id: userData.user_id,
                name: userData.user_name || userData.username || get().employee.name,
                email: userData.email || get().employee.email,
                role: userData.role,
                organizationId: userData.organization_id,
                adminId: userData.admin_id,
              }
            });
          } else {
            // Fallback
            set({ 
              isAuthenticated: true,
              employee: {
                ...get().employee,
                id: userId || get().employee.id,
                role: userRole || get().employee.role,
              }
            });
          }
        } catch (sessionError) {
          console.error('Error fetching session info:', sessionError);
          // Fallback if session info fails
          set({ 
            isAuthenticated: true,
            employee: {
              ...get().employee,
              id: userId || get().employee.id,
              role: userRole || get().employee.role,
            }
          });
        }

        // Fetch today's attendance after auth check
        await get().fetchTodayAttendance();
        // Fetch attendance history
        await get().fetchAttendanceHistory();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      set({ isAuthenticated: false });
    }
  },

  completeOnboarding: () => {
    set({ hasSeenOnboarding: true });
  },

  checkIn: async (base64Images?: string[]) => {
    const state = get();
    const userId = state.employee.id;
    
    if (!userId) {
      return { success: false, error: "User ID not found. Please login again." };
    }

    try {
      const response = await apiService.checkInOut(userId, base64Images);
      // Don't fetch here - let the caller handle it
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check-in failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  },

  checkOut: async (base64Images?: string[]) => {
    const state = get();
    const userId = state.employee.id;
    
    if (!userId) {
      return { success: false, error: "User ID not found. Please login again." };
    }

    try {
      const response = await apiService.checkInOut(userId, base64Images);
      // Don't fetch here - let the caller handle it
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check-out failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  },

  fetchTodayAttendance: async () => {
    const state = get();
    const userId = state.employee.id;
    const adminId = state.employee.adminId;
    
    if (!userId || !adminId) return;

    try {
      // Get today's date in local timezone (YYYY-MM-DD format)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
      // Use employee-attendance API with admin_id and user_id to get today's attendance
      const response = await apiService.getUserAttendanceByDate(adminId, userId, today);
      
      if (response.data && response.data.length > 0) {
        // Get the first (and should be only) attendance record for this user
        const attendance = response.data[0];
        
        if (attendance) {
          const now = new Date();
          const dateStr = attendance.attendance_date || now.toISOString().split("T")[0];
          
          // Convert backend format to app format (hours and minutes only)
          const formatTime = (timeStr: string | null): string | null => {
            if (!timeStr) return null;
            try {
              const date = new Date(timeStr);
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? "PM" : "AM";
              const displayHours = hours % 12 || 12;
              return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
            } catch {
              return timeStr;
            }
          };

          // Parse production hours (format: "1h 8m" or "1h 20m")
          let totalHours = 0;
          if (attendance.production_hours) {
            const hoursMatch = attendance.production_hours.match(/(\d+)h/);
            const minutesMatch = attendance.production_hours.match(/(\d+)m/);
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            totalHours = hours + (minutes / 60);
          }

          // Determine status - check if late
          let status: AttendanceRecord["status"] = attendance.attendance_status.toLowerCase() as AttendanceRecord["status"];
          if (attendance.is_late && status === "present") {
            status = "late";
          }

          // Parse multiple entries - handle different response formats
          let multipleEntries: MultipleCheckEntry[] = [];
          if (attendance.multiple_entries && Array.isArray(attendance.multiple_entries)) {
            try {
              multipleEntries = attendance.multiple_entries.map((entry: any) => ({
                id: entry.id || 0,
                checkInTime: formatTime(entry.check_in_time || entry.check_in || null),
                checkOutTime: formatTime(entry.check_out_time || entry.check_out || null),
                totalWorkingMinutes: entry.total_working_minutes || entry.total_working_hours * 60 || 0,
                remarks: entry.remarks || entry.remark || null,
                checkInImage: entry.check_in_image || entry.checkInImage || null,
                checkOutImage: entry.check_out_image || entry.checkOutImage || null,
              }));
            } catch (error) {
              console.error('Error parsing multiple entries in fetchTodayAttendance:', error, attendance.multiple_entries);
            }
          }

          const attendanceRecord: AttendanceRecord = {
            id: attendance.id.toString(),
            date: dateStr,
            checkIn: formatTime(attendance.check_in),
            checkOut: formatTime(attendance.check_out),
            status: status,
            totalHours: totalHours,
            location: "Office", // Can be enhanced with location data
            lastLoginStatus: attendance.last_login_status || null,
            shiftName: attendance.shift_name || null,
            multipleEntries: multipleEntries.length > 0 ? multipleEntries : undefined,
          };

          set({ todayAttendance: attendanceRecord });
        } else {
          // No attendance record found for today
          set({ todayAttendance: null });
        }
      } else {
        // No attendance data for today
        set({ todayAttendance: null });
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      // Don't set error state, just log it
    }
  },

  // Fetch attendance after punch - uses employee-attendance API with user_id
  fetchAttendanceAfterPunch: async () => {
    const state = get();
    const userId = state.employee.id;
    const adminId = state.employee.adminId;
    
    if (!userId || !adminId) {
      console.log('Cannot fetch attendance: missing userId or adminId', { userId, adminId });
      return;
    }

    try {
      // Get today's date in local timezone (YYYY-MM-DD format)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      console.log('Fetching attendance for user:', { adminId, userId, today });
      
      // Call employee-attendance API with admin_id and user_id
      const response = await apiService.getUserAttendanceByDate(adminId, userId, today);
      console.log('Attendance API response (fetchAttendanceAfterPunch):', JSON.stringify(response, null, 2));
      
      if (response.data && response.data.length > 0) {
        // Get the first (and should be only) attendance record for this user
        const attendance = response.data[0];
        
        if (attendance) {
          const now = new Date();
          const dateStr = attendance.attendance_date || now.toISOString().split("T")[0];
          
          // Convert backend format to app format (hours and minutes only)
          const formatTime = (timeStr: string | null): string | null => {
            if (!timeStr) return null;
            try {
              const date = new Date(timeStr);
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? "PM" : "AM";
              const displayHours = hours % 12 || 12;
              return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
            } catch {
              return timeStr;
            }
          };

          // Parse production hours (format: "1h 8m" or "1h 20m")
          let totalHours = 0;
          if (attendance.production_hours) {
            const hoursMatch = attendance.production_hours.match(/(\d+)h/);
            const minutesMatch = attendance.production_hours.match(/(\d+)m/);
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            totalHours = hours + (minutes / 60);
          }

          // Determine status - check if late
          let status: AttendanceRecord["status"] = attendance.attendance_status.toLowerCase() as AttendanceRecord["status"];
          if (attendance.is_late && status === "present") {
            status = "late";
          }

          // Parse multiple entries - handle different response formats
          let multipleEntries: MultipleCheckEntry[] = [];
          if (attendance.multiple_entries && Array.isArray(attendance.multiple_entries)) {
            try {
              multipleEntries = attendance.multiple_entries.map((entry: any) => ({
                id: entry.id || 0,
                checkInTime: formatTime(entry.check_in_time || entry.check_in || null),
                checkOutTime: formatTime(entry.check_out_time || entry.check_out || null),
                totalWorkingMinutes: entry.total_working_minutes || entry.total_working_hours * 60 || 0,
                remarks: entry.remarks || entry.remark || null,
                checkInImage: entry.check_in_image || entry.checkInImage || null,
                checkOutImage: entry.check_out_image || entry.checkOutImage || null,
              }));
            } catch (error) {
              console.error('Error parsing multiple entries in fetchAttendanceAfterPunch:', error, attendance.multiple_entries);
            }
          }

          const attendanceRecord: AttendanceRecord = {
            id: attendance.id.toString(),
            date: dateStr,
            checkIn: formatTime(attendance.check_in),
            checkOut: formatTime(attendance.check_out),
            status: status,
            totalHours: totalHours,
            location: "Office",
            lastLoginStatus: attendance.last_login_status || null,
            shiftName: attendance.shift_name || null,
            multipleEntries: multipleEntries.length > 0 ? multipleEntries : undefined,
          };

          set({ todayAttendance: attendanceRecord });
        } else {
          set({ todayAttendance: null });
        }
      } else {
        // No attendance data for today
        set({ todayAttendance: null });
      }
    } catch (error) {
      console.error('Error fetching attendance after punch:', error);
    }
  },

  fetchAttendanceHistory: async (orgId?: string, fromDate?: string, toDate?: string) => {
    const state = get();
    const userId = state.employee.id;
    const employeeOrgId = orgId || state.employee.organizationId;
    
    if (!userId || !employeeOrgId) {
      console.warn('Cannot fetch attendance history: missing userId or orgId');
      return;
    }

    try {
      const response = await apiService.getAttendanceHistory(
        employeeOrgId,
        userId,
        fromDate,
        toDate
      );

      // Convert backend format to app format
      const formatTime = (timeStr: string | null): string | null => {
        if (!timeStr) return null;
        try {
          const date = new Date(timeStr);
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const ampm = hours >= 12 ? "PM" : "AM";
          const displayHours = hours % 12 || 12;
          return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
        } catch {
          return timeStr;
        }
      };

      const history: AttendanceRecord[] = response.data.results.map((item) => {
        // Parse production hours (format: "1h 8m" or "1h 20m")
        let totalHours = 0;
        if (item.production_hours) {
          const hoursMatch = item.production_hours.match(/(\d+)h/);
          const minutesMatch = item.production_hours.match(/(\d+)m/);
          const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
          const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
          totalHours = hours + (minutes / 60);
        }

        // Parse multiple entries - handle different response formats
        let multipleEntries: MultipleCheckEntry[] = [];
        if (item.multiple_entries && Array.isArray(item.multiple_entries)) {
          try {
            multipleEntries = item.multiple_entries.map((entry: any) => ({
              id: entry.id || 0,
              checkInTime: formatTime(entry.check_in_time || entry.check_in || null),
              checkOutTime: formatTime(entry.check_out_time || entry.check_out || null),
              totalWorkingMinutes: entry.total_working_minutes || entry.total_working_hours * 60 || 0,
              remarks: entry.remarks || entry.remark || null,
              checkInImage: entry.check_in_image || entry.checkInImage || null,
              checkOutImage: entry.check_out_image || entry.checkOutImage || null,
            }));
          } catch (error) {
            console.error('Error parsing multiple entries in history:', error, item.multiple_entries);
          }
        }

        return {
          id: item.id.toString(),
          date: item.attendance_date,
          checkIn: formatTime(item.check_in),
          checkOut: formatTime(item.check_out),
          status: item.attendance_status.toLowerCase() as AttendanceRecord["status"],
          totalHours: totalHours,
          location: "Office",
          shiftName: item.shift_name || null,
          multipleEntries: multipleEntries.length > 0 ? multipleEntries : undefined,
        };
      });

      set({ attendanceHistory: history });
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      // Keep existing history on error
    }
  },

  // Fetch attendance for a specific date
  fetchAttendanceByDate: async (date: string) => {
    const state = get();
    const userId = state.employee.id;
    const adminId = state.employee.adminId;
    
    if (!userId || !adminId) {
      console.log('Cannot fetch attendance by date: missing userId or adminId', { userId, adminId });
      return null;
    }

    try {
      console.log('Fetching attendance for date:', { adminId, userId, date });
      
      // Call employee-attendance API with admin_id and user_id for specific date
      const response = await apiService.getUserAttendanceByDate(adminId, userId, date);
      console.log('Attendance API response for date:', date, response);
      
      if (response.data && response.data.length > 0) {
        // Get the first (and should be only) attendance record for this user
        const attendance = response.data[0];
        
        if (attendance) {
          const dateStr = attendance.attendance_date || date;
          
          // Convert backend format to app format (hours and minutes only)
          const formatTime = (timeStr: string | null): string | null => {
            if (!timeStr) return null;
            try {
              const date = new Date(timeStr);
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? "PM" : "AM";
              const displayHours = hours % 12 || 12;
              return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
            } catch {
              return timeStr;
            }
          };

          // Parse production hours (format: "1h 8m" or "1h 20m")
          let totalHours = 0;
          if (attendance.production_hours) {
            const hoursMatch = attendance.production_hours.match(/(\d+)h/);
            const minutesMatch = attendance.production_hours.match(/(\d+)m/);
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            totalHours = hours + (minutes / 60);
          }

          // Determine status - check if late
          let status: AttendanceRecord["status"] = attendance.attendance_status.toLowerCase() as AttendanceRecord["status"];
          if (attendance.is_late && status === "present") {
            status = "late";
          }

          // Parse multiple entries - handle different response formats
          let multipleEntries: MultipleCheckEntry[] = [];
          if (attendance.multiple_entries && Array.isArray(attendance.multiple_entries)) {
            try {
              multipleEntries = attendance.multiple_entries.map((entry: any) => ({
                id: entry.id || 0,
                checkInTime: formatTime(entry.check_in_time || entry.check_in || null),
                checkOutTime: formatTime(entry.check_out_time || entry.check_out || null),
                totalWorkingMinutes: entry.total_working_minutes || entry.total_working_hours * 60 || 0,
                remarks: entry.remarks || entry.remark || null,
                checkInImage: entry.check_in_image || entry.checkInImage || null,
                checkOutImage: entry.check_out_image || entry.checkOutImage || null,
              }));
            } catch (error) {
              console.error('Error parsing multiple entries in fetchAttendanceByDate:', error, attendance.multiple_entries);
            }
          }

          const attendanceRecord: AttendanceRecord = {
            id: attendance.id.toString(),
            date: dateStr,
            checkIn: formatTime(attendance.check_in),
            checkOut: formatTime(attendance.check_out),
            status: status,
            totalHours: totalHours,
            location: "Office",
            lastLoginStatus: attendance.last_login_status || null,
            shiftName: attendance.shift_name || null,
            multipleEntries: multipleEntries.length > 0 ? multipleEntries : undefined,
          };

          return attendanceRecord;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching attendance by date:', error);
      return null;
    }
  },

  applyLeave: (leave) => {
    const newLeave: LeaveRequest = {
      ...leave,
      id: `leave-${Date.now()}`,
      status: "pending",
      appliedDate: new Date().toISOString().split("T")[0],
    };
    
    set((state) => ({
      leaveRequests: [newLeave, ...state.leaveRequests],
    }));
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status } : task
      ),
    }));
  },

  addTaskComment: (taskId, text) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: get().employee.name,
      text,
      timestamp: new Date().toLocaleString(),
    };
    
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, comments: [...task.comments, newComment] }
          : task
      ),
    }));
  },

  toggleHolidayFavorite: (holidayId) => {
    set((state) => ({
      holidays: state.holidays.map((holiday) =>
        holiday.id === holidayId
          ? { ...holiday, isFavorite: !holiday.isFavorite }
          : holiday
      ),
    }));
  },

  markAnnouncementRead: (announcementId) => {
    set((state) => ({
      announcements: state.announcements.map((ann) =>
        ann.id === announcementId ? { ...ann, isRead: true } : ann
      ),
    }));
  },

  toggleNotifications: () => {
    set((state) => ({ notificationsEnabled: !state.notificationsEnabled }));
  },

  updateProfile: (updates) => {
    set((state) => ({
      employee: { ...state.employee, ...updates },
    }));
  },
}));
