export const DEMO_USERS = [
  {
    id: 'demo_admin',
    name: 'Admin User',
    email: 'admin@leadfi.com',
    role: 'Admin',
    avatar: '/avatars/admin.png',
    color: 'highlight1',
    permissions: ['full_access', 'analytics', 'user_management', 'system_activities'],
    description: 'Full system access with user management',
    icon: 'CogIcon'
  },
  {
    id: 'demo_manager',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@leadfi.com',
    role: 'Manager',
    avatar: '/avatars/manager.png',
    color: 'highlight5',
    permissions: ['full_access', 'analytics', 'team_management'],
    description: 'Team management with full access',
    icon: 'UserGroupIcon'
  },
  {
    id: 'demo_senior_bd',
    name: 'Alex Chen',
    email: 'alex.chen@leadfi.com',
    role: 'Senior BD',
    avatar: '/avatars/senior-bd.png',
    color: 'highlight4',
    permissions: ['leads', 'customers', 'activities', 'basic_analytics'],
    description: 'Lead and customer management',
    icon: 'UserIcon'
  },
  {
    id: 'demo_user',
    name: 'Demo User',
    email: 'demo@leadfi.com',
    role: 'Demo User',
    avatar: '/avatars/demo-user.png',
    color: 'gray-600',
    permissions: ['read_only', 'basic_analytics'],
    description: 'Read-only access to all features',
    icon: 'EyeIcon'
  }
]; 