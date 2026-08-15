import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User, LoginCredentials, RegisterData, RoleType, ProfileUpdatePayload } from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  allRegisteredUsers: User[];
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  logout: () => void;
  quickLoginAs: (role: RoleType) => void;
  switchRole: () => void;
  isAuthPageOpen: boolean;
  openAuthPage: () => void;
  closeAuthPage: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  refreshUsers: () => Promise<void>;
}

const DEFAULT_ADMIN: User = {
  id: 'USR_ADMIN_01',
  email: 'admin@omni-dss.vn',
  fullName: 'Võ Thành Tòng',
  role: 'admin',
  organization: 'Trung Tâm Quản Trị Hệ Thống DSS & AI',
  roleTitle: '👑 Quản Trị Viên Hệ Thống (System Admin)',
  createdAt: '2026-08-15',
  phone: '0912 345 678',
  address: 'Tòa nhà Innovation Hub, Quận 1, TP. Hồ Chí Minh',
  taxCode: '0314899988',
  industry: 'Bán lẻ đa kênh (Omnichannel Retail)',
  storeCount: '20+ Chuỗi siêu thị toàn quốc',
  website: 'https://omni-dss.vn'
};

const DEFAULT_BUSINESS_USER: User = {
  id: 'USR_BIZ_02',
  email: 'business@retail.vn',
  fullName: 'Chuyên Viên Marketing & CSKH',
  role: 'business_user',
  organization: 'Tập Đoàn Bán Lẻ Đa Kênh OmniRetail Corp',
  roleTitle: '🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)',
  createdAt: '2026-08-15',
  phone: '0988 765 432',
  address: 'Phố Thương Mại, Cầu Giấy, Hà Nội',
  taxCode: '0108999123',
  industry: 'Thời trang & Phụ kiện Đa Kênh',
  storeCount: '6 - 20 Chi nhánh cửa hàng',
  website: 'https://omniretail.vn'
};

const INITIAL_DB_USERS: User[] = [DEFAULT_ADMIN, DEFAULT_BUSINESS_USER];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'omni_dss_auth_user_v2';
const ALL_USERS_STORAGE_KEY = 'omni_dss_all_registered_users_v2';
const API_AUTH_URL = 'http://localhost:8000/api/auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Quản lý danh sách tài khoản trong Database
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(ALL_USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi parse allRegisteredUsers từ localStorage:', e);
    }
    return INITIAL_DB_USERS;
  });

  // 2. Quản lý phiên đăng nhập hiện tại
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi parse currentUser từ localStorage:', e);
    }
    return DEFAULT_ADMIN;
  });

  const [isAuthPageOpen, setIsAuthPageOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Lưu bền vững LocalStorage với try/catch
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Không thể lưu currentUser vào localStorage (có thể vượt quota):', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(allRegisteredUsers));
    } catch (e) {
      console.warn('Không thể lưu allRegisteredUsers vào localStorage:', e);
    }
  }, [allRegisteredUsers]);

  // Đồng bộ phiên từ Backend MongoDB khi khởi động
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const res = await axios.get<User[]>(`${API_AUTH_URL}/users`, { timeout: 3000 });
        if (res.data && res.data.length > 0) {
          setAllRegisteredUsers(res.data);
          
          if (currentUser?.email) {
            const matched = res.data.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
            if (matched) {
              setCurrentUser(prev => prev ? { ...prev, ...matched } : matched);
            }
          }
        }
      } catch (e) {
        // Fallback offline
      }
    };
    syncWithBackend();
  }, []);

  const refreshUsers = async () => {
    try {
      const res = await axios.get<User[]>(`${API_AUTH_URL}/users`, { timeout: 2000 });
      if (res.data && res.data.length > 0) {
        setAllRegisteredUsers(res.data);
      }
    } catch (e) {
      // Giữ danh sách từ localStorage
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const emailClean = credentials.email.toLowerCase().trim();

    // 1. Thử gửi API Backend tới MongoDB
    try {
      const res = await axios.post<User>(`${API_AUTH_URL}/login`, credentials, { timeout: 2000 });
      if (res.data) {
        setCurrentUser(res.data);
        setIsAuthPageOpen(false);
        return;
      }
    } catch (e) {
      // Fallback kiểm tra trong Database Storage cục bộ
    }

    // 2. Fallback check
    const matchedUser = allRegisteredUsers.find(u => u.email.toLowerCase() === emailClean);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setIsAuthPageOpen(false);
      return;
    }

    // 3. Quick Fallback for Demo
    if (emailClean.includes('admin')) {
      const existingAdmin = allRegisteredUsers.find(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
      setCurrentUser(existingAdmin || DEFAULT_ADMIN);
    } else {
      const fallbackUser: User = {
        id: `USR_${Math.floor(1000 + Math.random() * 9000)}`,
        email: credentials.email,
        fullName: credentials.email.split('@')[0].toUpperCase(),
        role: 'business_user',
        organization: 'Doanh Nghiệp Bán Lẻ',
        roleTitle: '🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCurrentUser(fallbackUser);
      setAllRegisteredUsers(prev => [...prev.filter(u => u.email !== credentials.email), fallbackUser]);
    }
    setIsAuthPageOpen(false);
  };

  const register = async (data: RegisterData) => {
    const roleTitle = data.role === 'admin'
      ? '👑 Quản Trị Viên Hệ Thống (System Admin)'
      : '🏢 Người Dùng Doanh Nghiệp (Marketing & CSKH)';

    const newUser: User = {
      id: `USR_${Math.floor(1000 + Math.random() * 9000)}`,
      email: data.email.toLowerCase().trim(),
      fullName: data.fullName.trim(),
      role: data.role,
      organization: data.organization?.trim() || 'Doanh Nghiệp Bán Lẻ',
      roleTitle: roleTitle,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 1. Gửi API lưu MongoDB
    try {
      const res = await axios.post<User>(`${API_AUTH_URL}/register`, data, { timeout: 2000 });
      if (res.data) {
        newUser.id = res.data.id;
      }
    } catch (e) {
      // Fallback
    }

    // 2. Lưu vào Danh sách Database Users
    setAllRegisteredUsers(prev => {
      const exists = prev.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
      if (!exists) {
        return [newUser, ...prev];
      }
      return prev.map(u => u.email.toLowerCase() === newUser.email.toLowerCase() ? newUser : u);
    });

    setCurrentUser(newUser);
    setIsAuthPageOpen(false);
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

    let updatedUser: User = {
      ...currentUser,
      ...data
    };

    // 1. Gửi API lưu MongoDB Atlas
    try {
      const res = await axios.put<User>(`${API_AUTH_URL}/profile`, payload, { timeout: 4000 });
      if (res.data) {
        updatedUser = res.data;
      }
    } catch (e) {
      // Fallback to local state
    }

    // 2. Cập nhật state & LocalStorage
    setCurrentUser(updatedUser);
    setAllRegisteredUsers(prev =>
      prev.map(u => (u.email.toLowerCase() === updatedUser.email.toLowerCase() ? updatedUser : u))
    );

    return updatedUser;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthPageOpen(true);
  };

  const quickLoginAs = (role: RoleType) => {
    if (role === 'admin') {
      const existing = allRegisteredUsers.find(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
      setCurrentUser(existing || DEFAULT_ADMIN);
    } else {
      const existing = allRegisteredUsers.find(u => u.email.toLowerCase() === DEFAULT_BUSINESS_USER.email.toLowerCase());
      setCurrentUser(existing || DEFAULT_BUSINESS_USER);
    }
    setIsAuthPageOpen(false);
  };

  const switchRole = () => {
    if (!currentUser || currentUser.role === 'admin') {
      const existingBiz = allRegisteredUsers.find(u => u.email.toLowerCase() === DEFAULT_BUSINESS_USER.email.toLowerCase());
      setCurrentUser(existingBiz || DEFAULT_BUSINESS_USER);
    } else {
      const existingAdmin = allRegisteredUsers.find(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
      setCurrentUser(existingAdmin || DEFAULT_ADMIN);
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
