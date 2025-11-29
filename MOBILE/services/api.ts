// API Configuration and Service
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the appropriate API URL based on platform
// IMPORTANT: For Expo Go on physical devices, update YOUR_COMPUTER_IP with your actual IP address
// Find your IP: Windows (ipconfig) or Mac/Linux (ifconfig)
const YOUR_COMPUTER_IP = '192.168.10.41'; // UPDATE THIS with your computer's IP address

const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com'; // Production - Update this
  }

  // Check if running in Expo Go (physical device)
  const isExpoGo = Constants.appOwnership === 'expo';
  const isWeb = Platform.OS === 'web';
  
  // For Expo Go on physical devices, always use computer's IP address
  // Make sure your phone and computer are on the same WiFi network
  if (isExpoGo && !isWeb) {
    const url = `http://${YOUR_COMPUTER_IP}:8000`;
    console.log('🔗 Using API URL for Expo Go (Physical Device):', url);
    return url;
  }
  
  // For emulators/simulators/web
  if (Platform.OS === 'android') {
    const url = 'http://10.0.2.2:8000'; // Android emulator
    console.log('🔗 Using API URL for Android emulator:', url);
    return url;
  } else if (Platform.OS === 'ios') {
    const url = 'http://localhost:8000'; // iOS simulator
    console.log('🔗 Using API URL for iOS simulator:', url);
    return url;
  } else {
    // Web platform
    const url = 'http://localhost:8000';
    console.log('🔗 Using API URL for web:', url);
    return url;
  }
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used (helpful for debugging)
console.log('🚀 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('🔧 App Ownership:', Constants.appOwnership);

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  refresh_token: string;
  access_token: string;
  user_id: string;
  role: string;
}

export interface SessionInfoResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    user_id: string;
    email: string;
    username: string;
    role: string;
    user_name?: string; // For user role
    admin_name?: string; // For admin role
    organization_id?: string;
    admin_id?: string; // For user role
    user_type?: string;
    designation?: string;
    job_title?: string;
  };
}

export interface ApiError {
  error: string;
  detail?: string;
}

export interface AttendanceCheckResponse {
  detail: string;
}

export interface AttendanceImage {
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  image_type: string;
  captured_at: string;
  url: string;
}

export interface MultipleEntry {
  id: number;
  check_in_time: string;
  check_out_time: string | null;
  total_working_minutes: number;
  remarks: string | null;
  check_in_image: string | null;
  check_out_image: string | null;
}

export interface AttendanceHistoryItem {
  id: number;
  user_id: string;
  employee_name: string;
  employee_id: string;
  employee_email: string;
  attendance_status: string;
  last_login_status: string | null;
  check_in: string | null;
  check_out: string | null;
  break_duration: string;
  late_minutes_display: string;
  production_hours: string;
  attendance_date: string;
  shift_name: string;
  is_late: boolean;
  late_minutes: number;
  is_early_exit: boolean;
  early_exit_minutes: number;
  multiple_entries: MultipleEntry[];
  remarks: string | null;
  images?: AttendanceImage[];
}

export interface AttendanceSummary {
  total_employees: number;
  present: number;
  late_login: number;
  absent: number;
  attendance_date: string;
}

export interface AttendanceResponse {
  status: number;
  message: string;
  data: AttendanceHistoryItem[];
  summary?: AttendanceSummary;
  total_objects?: number;
  current_page_number?: number;
}

export interface CheckInOutEntry {
  time: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_late?: boolean;
  late_minutes?: number;
  is_early_exit?: boolean;
  early_exit_minutes?: number;
  total_working_minutes?: number;
}

export interface EmployeeDailyInfo {
  employee_id: string;
  user_id: string;
  employee_name: string;
  username: string;
  email: string;
  custom_employee_id: string;
  designation?: string | null;
  profile_photo_url?: string | null;
  is_active: boolean;
  last_login: string | null;
  last_login_status: string;
  current_day_attendance: {
    date: string;
    first_checkin: string | null;
    last_checkout: string | null;
    total_checkins: number;
    total_checkouts: number;
    check_ins: CheckInOutEntry[];
    check_outs: CheckInOutEntry[];
  };
}

export interface EmployeeDailyInfoResponse {
  status: number;
  message: string;
  results: EmployeeDailyInfo[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export interface AttendanceHistoryResponse {
  status: number;
  message: string;
  data: {
    results: AttendanceHistoryItem[];
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export interface MonthlyAttendanceResponse {
  status: number;
  message: string;
  data: {
    present: {
      count: number;
      dates: string[];
    };
    absent: {
      count: number;
      dates: string[];
    };
  };
  summary: {
    employee_id: string;
    employee_name: string;
    month: number;
    year: number;
    total_days: number;
    present_days: number;
    absent_days: number;
  };
}

class ApiService {
  private baseURL: string;
  private getAccessToken: (() => Promise<string | null>) | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Set access token getter for authenticated requests
  setAccessTokenGetter(getter: () => Promise<string | null>) {
    this.getAccessToken = getter;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add authorization header if required
    if (requireAuth && this.getAccessToken) {
      const token = await this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      console.log('📡 Making API request to:', url);
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        // Backend returns error in different formats:
        // { error: "message" } or { detail: "message" } or { message: "message" }
        const errorMessage = data.message || data.error || data.detail || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ API request successful');
      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Enhanced error message for network issues
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          console.error('❌ Network Error:', error.message);
          console.error('💡 Make sure:');
          console.error('   1. Backend server is running on port 8000');
          console.error('   2. Phone and computer are on same WiFi');
          console.error('   3. Firewall allows port 8000');
          console.error('   4. API URL is correct:', url);
          throw new Error(`Network error: Cannot connect to server. Please check:\n1. Backend is running\n2. Same WiFi network\n3. IP: ${YOUR_COMPUTER_IP}:8000`);
        }
        throw error;
      }
      throw new Error('Network error occurred. Please check your connection.');
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Get session info (user profile data)
  async getSessionInfo(): Promise<SessionInfoResponse> {
    return this.request<SessionInfoResponse>('/api/session-info', {
      method: 'GET',
    }, true); // Require authentication
  }

  // Attendance APIs
  async checkInOut(userId: string, base64Images?: string[]): Promise<AttendanceCheckResponse> {
    const body: any = {
      marked_by: "mobile"
    };
    if (base64Images && base64Images.length > 0) {
      body.base64_images = base64Images;
    }
    
    return this.request<AttendanceCheckResponse>(
      `/api/attendance-check/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true // Require authentication
    );
  }

  async getAttendanceHistory(
    orgId: string,
    employeeId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AttendanceHistoryResponse> {
    let url = `/api/employee-history/${orgId}/${employeeId}`;
    const params = new URLSearchParams();
    
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.request<AttendanceHistoryResponse>(
      url,
      { method: 'GET' },
      true // Require authentication
    );
  }

  async getTodayAttendance(userId: string, adminId?: string): Promise<AttendanceHistoryItem | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Use employee-attendance endpoint if adminId is available
      if (adminId) {
        const url = `/api/employee-attendance/${adminId}?date=${today}`;
        const response = await this.request<AttendanceResponse>(
          url,
          { method: 'GET' },
          true
        );
        
        if (response.data && response.data.length > 0) {
          // Find the attendance record for this user
          const userAttendance = response.data.find(item => item.user_id === userId);
          return userAttendance || null;
        }
        return null;
      }
      
      // Fallback to employee-history if orgId is available
      // This would require orgId which we might not have
      return null;
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      return null;
    }
  }

  async getAttendanceByDate(adminId: string, date: string): Promise<AttendanceResponse> {
    const url = `/api/employee-attendance/${adminId}?date=${date}`;
    return this.request<AttendanceResponse>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Get attendance for specific user by admin_id and user_id
  async getUserAttendanceByDate(adminId: string, userId: string, date: string): Promise<AttendanceResponse> {
    const url = `/api/employee-attendance/${adminId}/${userId}?date=${date}`;
    return this.request<AttendanceResponse>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Get monthly attendance status
  async getMonthlyAttendance(adminId: string, userId: string, month: number, year: number): Promise<MonthlyAttendanceResponse> {
    const url = `/api/employee-monthly-attendance/${adminId}/${userId}/${month}/${year}`;
    return this.request<MonthlyAttendanceResponse>(
      url,
      { method: 'GET' },
      true
    );
  }

  // Get employee daily info (new API)
  async getEmployeeDailyInfo(adminId: string, userId?: string): Promise<EmployeeDailyInfoResponse> {
    const url = `/api/employee-daily-info/${adminId}`;
    return this.request<EmployeeDailyInfoResponse>(
      url,
      { method: 'GET' },
      true
    );
  }
}

export const apiService = new ApiService(API_BASE_URL);

