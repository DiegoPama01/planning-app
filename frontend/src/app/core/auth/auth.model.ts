export interface CompanyMembership {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'manager' | 'viewer';
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  companies: CompanyMembership[];
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}