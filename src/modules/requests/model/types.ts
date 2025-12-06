// src/modules/requests/model/types.ts

export type RequestStatus = "Non traité" | "Traité";

export type RequestAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  storagePath: string | null; // обязательное для новых заявок
  publicUrl?: string | null; // заполнено, если заранее получили ссылку
  dataUrl?: string | null; // legacy inline data для старых записей
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
  storagePaths: string[];
};
