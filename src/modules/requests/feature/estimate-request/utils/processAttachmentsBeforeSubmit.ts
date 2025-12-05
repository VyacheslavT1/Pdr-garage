// src/modules/requests/feature/estimate-request/utils/processAttachmentsBeforeSubmit.ts

type UploadDescriptor = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  uploadUrl: string | null;
  uploadToken: string | null;
};

type UploadUrlResponse =
  | {
      ok: true;
      uploads: UploadDescriptor[];
    }
  | {
      ok: false;
      error: string;
    };

export async function processAttachmentsBeforeSubmit(
  originalFormData: FormData
): Promise<FormData> {
  const attachmentEntries = originalFormData.getAll("attachment");
  const attachmentFiles = attachmentEntries.filter(
    (entry): entry is File => entry instanceof File
  );

  if (attachmentFiles.length === 0) {
    return originalFormData;
  }

  const filesMetadata = attachmentFiles.map((currentFile) => ({
    name: currentFile.name,
    type: currentFile.type,
    size: currentFile.size,
  }));

  const uploadUrlResponse = await fetch("/api/form-attachments/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: filesMetadata }),
  });

  const uploadUrlData = (await uploadUrlResponse.json()) as UploadUrlResponse;

  if (!uploadUrlResponse.ok || !uploadUrlData.ok || !uploadUrlData.uploads) {
    throw new Error("failedToGetUploadUrls");
  }

  const uploads = uploadUrlData.uploads;

  // Загружаем каждый файл по соответствующему uploadUrl
  for (const currentUpload of uploads) {
    if (!currentUpload.uploadUrl) {
      continue;
    }

    const matchedFile = attachmentFiles.find(
      (currentFile) =>
        currentFile.name === currentUpload.fileName &&
        currentFile.size === currentUpload.size &&
        currentFile.type === currentUpload.mimeType
    );

    if (!matchedFile) {
      continue;
    }

    const uploadResult = await fetch(currentUpload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": currentUpload.mimeType },
      body: matchedFile,
    });

    if (!uploadResult.ok) {
      throw new Error("uploadFailed");
    }
  }
  const newFormData = new FormData();

  for (const [fieldName, fieldValue] of originalFormData.entries()) {
    if (fieldValue instanceof File) {
      continue;
    }
    newFormData.append(fieldName, fieldValue);
  }
  newFormData.append("attachmentsMetadata", JSON.stringify(uploads));
  return newFormData;
}
