// User domain interfaces with 'I' prefix convention

export interface ICreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface IUpdateUserData {
  name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface IUserData {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}