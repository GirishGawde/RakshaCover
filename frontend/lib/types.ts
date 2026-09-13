export type CheckLinkResponse = {
  score: number;
  riskLabel: string;
  url: string;
  flags: any;
  recommendation: string;
};

export type CheckQrResponse = {
  score: number;
  riskLabel: string;
  decodedUrl?: string;
  vpa?: string;
  flags: any;
  recommendation: string;
};

export type CheckUpiResponse = {
  score: number;
  riskLabel: string;
  vpa: string;
  flags: any;
  recommendation: string;
};
