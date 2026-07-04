export interface BusinessType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}