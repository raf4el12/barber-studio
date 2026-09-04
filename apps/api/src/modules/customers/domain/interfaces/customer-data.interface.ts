export interface CreateCustomerData {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  branchId: string | null;
  isActive: boolean;
}

export type UpdateCustomerData = Partial<
  Pick<
    CreateCustomerData,
    'name' | 'phone' | 'email' | 'notes' | 'branchId' | 'isActive'
  >
>;
