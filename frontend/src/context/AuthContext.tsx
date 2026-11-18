import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterData, RoleType, ProfileUpdatePayload, AuthTokenResponse } from '../types/auth';
import {
  apiClient,
  getAccessToken,
  setAccessToken,
  setUnauthorizedHandler,
  getApiErrorMessage
} from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  allRegisteredUsers: User[];
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  logout: () => void;
  quickLoginAs: (role: RoleType) => Promise<void>;
  switchRole: () => Promise<void>;
  isAuthPageOpen: boolean;
  openAuthPage: () => void;
  closeAuthPage: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  refreshUsers: () => Promise<void>;
}

// Tài khoản demo (đã seed sẵn trong backend). Vẫn phải đăng nhập thật qua API để nhận JWT.
const DEMO_ACCOUNTS: Record<RoleType, LoginCredentials> = {
  admin: { email: 'admin@omni-dss.vn', password: 'admin123' },
  business_user: { email: 'business@retail.vn', password: 'user123' }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'omni_dss_auth_user_v2';
const LEGACY_ALL_USERS_KEY = 'omni_dss_all_registered_users_v2';

const loadCachedUser = (): User | null => {
  // Chỉ khôi phục phiên nếu còn access token
  if (!getAccessToken()) return null;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.email) return parsed;
    }
  } catch (e) {
    console.warn('Lỗi parse currentUser từ localStorage:', e);
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(loadCachedUser);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
  const [isAuthPageOpen, setIsAuthPageOpen] = useState<boolean>(() => !getAccessToken());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Lưu phiên hiện tại; xóa cache danh sách user cũ (từng chứa thông tin cá nhân)
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_ALL_USERS_KEY);
      if (currentUser) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Không thể lưu currentUser vào localStorage (có thể vượt quota):', e);
    }
  }, [currentUser]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setCurrentUser(null);
    setAllRegisteredUsers([]);
    setIsProfileModalOpen(false);
    setIsAuthPageOpen(true);
  }, []);

  // Interceptor 401 -> đăng xuất
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await apiClient.get<User[]>('/auth/users', { timeout: 3000 });
      setAllRegisteredUsers(res.data || []);
    } catch (e) {
      // 403 với business_user hoặc backend offline: giữ nguyên danh sách
    }
  }, []);

  // Khi khởi động: xác thực lại token với backend
  useEffect(() => {
    if (!getAccessToken()) return;
    apiClient
      .get<User>('/auth/me', { timeout: 3000 })
      .then((res) => {
        setCurrentUser(res.data);
        if (res.data.role === 'admin') refreshUsers();
      })
      .catch(() => {
        // 401 đã được interceptor xử lý; lỗi mạng -> giữ phiên đã cache
      });
  }, [refreshUsers]);

  const startSession = (data: AuthTokenResponse) => {
    setAccessToken(data.access_token);
    setCurrentUser(data.user);
    setIsAuthPageOpen(false);
    if (data.user.role === 'admin') {
      refreshUsers();
    } else {
      setAllRegisteredUsers([]);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const res = await apiClient.post<AuthTokenResponse>('/auth/login', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password
      });
      startSession(res.data);
    } catch (e) {
      throw new Error(getApiErrorMessage(e, 'Đăng nhập thất bại.'));
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await apiClient.post<AuthTokenResponse>('/auth/register', {
        ...data,
        email: data.email.toLowerCase().trim(),
        fullName: data.fullName.trim()
      });
      startSession(res.data);
    } catch (e) {
      throw new Error(getApiErrorMessage(e, 'Đăng ký tài khoản thất bại.'));
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    if (!currentUser) throw new Error('Không có phiên đăng nhập hợp lệ.');

    const payload: ProfileUpdatePayload = {
      email: currentUser.email,
      fullName: data.fullName,
      organization: data.organization,
      avatarUrl: data.avatarUrl,
      phone: data.phone,
      address: data.address,
      taxCode: data.taxCode,
      industry: data.industry,
      storeCount: data.storeCount,
      website: data.website
    };

    try {
      const res = await apiClient.put<User>('/auth/profile', payload);
      const updatedUser = res.data;
      setCurrentUser(updatedUser);
      setAllRegisteredUsers((prev) =>
        prev.map((u) => (u.email.toLowerCase() === updatedUser.email.toLowerCase() ? updatedUser : u))
      );
      return updatedUser;
    } catch (e) {
      throw new Error(getApiErrorMessage(e, 'Lỗi khi cập nhật hồ sơ.'));
    }
  };

  const quickLoginAs = async (role: RoleType) => {
    await login(DEMO_ACCOUNTS[role]);
  };

  const switchRole = async () => {
    const target: RoleType = currentUser?.role === 'admin' ? 'business_user' : 'admin';
    try {
      await login(DEMO_ACCOUNTS[target]);
    } catch (e: any) {
      alert(e?.message || 'Không thể chuyển vai trò.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allRegisteredUsers,
        isAuthenticated: !!currentUser,
        login,
        register,
        updateProfile,
        logout,
        quickLoginAs,
        switchRole,
        isAuthPageOpen,
        openAuthPage: () => setIsAuthPageOpen(true),
        closeAuthPage: () => setIsAuthPageOpen(false),
        isProfileModalOpen,
        openProfileModal: () => setIsProfileModalOpen(true),
        closeProfileModal: () => setIsProfileModalOpen(false),
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
