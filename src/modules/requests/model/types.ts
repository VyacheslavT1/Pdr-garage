// src/modules/requests/model/types.ts

export type RequestStatus = "Non traité" | "Traité";

export type RequestAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string | null;
};

export type RequestItem = {
  id: string;
  createdAt: string;
  clientName: string;
  gender?: "male" | "female";
  phone: string;
  email: string;
  comment?: string | null;
  status: RequestStatus;
  attachments?: RequestAttachment[];
};

