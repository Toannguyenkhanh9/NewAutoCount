export interface AccountLoginRes {
  UserInfo: UserInfo;
  Permissions: Permission[];
}

export interface UserInfo {
  UserLevel: number;
  SessionToken: string;
  AccDateType: string;
  CurCode: string;
  UserName: string;
  ConcreteUser: string;
  IsShadow: boolean;
  IsMain: boolean;
  Language: any;
  MerchantId: number;
  GameSystemID: number;
  IsTransferAcc: boolean;
  IsAgentCash: boolean;
  IsAffiliate: boolean;
  MerchantName: string;
  Message: any;
  CasinoId: number;
  IsFixCurrency: boolean;
}

export interface Permission {
  PrgCode: string;
  AllowAddNew: boolean;
  AllowEdit: boolean;
  AllowRead: boolean;
  AllowDelete: boolean;
}
