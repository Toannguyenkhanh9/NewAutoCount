export interface DebtorRow {
  debtorAccount: string;
  companyName: string;
  type: string;
  registrationNo : string,
  phone: string;
  currency: string;
  creditTerm: string;
  creditLimit: number;
  active: boolean;
  groupCompany: boolean;
  billAddress?: string;
  fax?: string;
  email?: string;
  website?:string;
  postCode?: string;
  deliveryAddress?: string;
  deliveryPostCode?: string;
  customerTin?: string;
}
