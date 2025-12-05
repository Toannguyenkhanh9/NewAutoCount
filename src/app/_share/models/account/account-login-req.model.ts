export interface AccountLoginReq {
  username: string;
  password: string;
  sessionId: string;
  clientIp: string;
  siteName: string;
  isSuperSite: boolean;
}

export interface AccountLoginByTokenReq {
  token: string;
}
