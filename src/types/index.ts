export type UserRole = 'client' | 'pro';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  country_code?: string;
  rating?: number;
  total_reviews?: number;
  is_online?: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (data: SignUpData) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: UserRole;
}

// Navigation
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: { role: UserRole };
  ClientTabs: undefined;
  ProTabs: undefined;
};

export type ClientTabParamList = {
  Home: undefined;
  Favorites: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type ProTabParamList = {
  ProHome: undefined;
  Jobs: undefined;
  Earnings: undefined;
  ProProfile: undefined;
};

export type JobType = 'basic' | 'deep' | 'move' | 'office' | 'custom';
export type JobStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Job {
  id: string;
  client_id: string;
  pro_id?: string;
  address_id?: string;
  type: JobType;
  bedrooms: number;
  bathrooms: number;
  notes?: string;
  budget?: number;
  agreed_price?: number;
  status: JobStatus;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'rating'>;
  addresses?: Address;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street: string;
  detail?: string;
  city: string;
  zip?: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  pro_id: string;
  offered_price: number;
  message?: string;
  status: ApplicationStatus;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'rating' | 'total_reviews'>;
  jobs?: Job;
}

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export type ClientStackParamList = {
  ClientTabs: undefined;
  Booking: undefined;
  Applications: { jobId: string; jobType: string };
  Chat: { jobId: string; otherName: string };
};
