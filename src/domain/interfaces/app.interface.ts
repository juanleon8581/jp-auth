// App domain interfaces with 'I' prefix convention

export interface ICreateAppData {
  name: string;
  allowed_origins: string[];
}

export interface IUpdateAppData {
  name?: string;
  allowed_origins?: string[];
}

export interface IAppData {
  id: string;
  name: string;
  api_key: string;
  allowed_origins: string[];
  created_at: Date;
  updated_at: Date;
}