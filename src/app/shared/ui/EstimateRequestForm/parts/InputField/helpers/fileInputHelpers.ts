// Логика работы с input[type="file"] — отдельно от JSX/стилей

import React from "react";

/** Забрать файлы из события onChange */
export function extractFilesFromChangeEvent(
  event: React.ChangeEvent<HTMLInputElement>
): File[] {
  return event.target.files ? Array.from(event.target.files) : [];
}

/** Вернуть новый массив без файла по индексу (иммутабельно) */
export function removeFileByIndex(files: File[], index: number): File[] {
  return files.filter((_, i) => i !== index);
}

/** Пропатчить files у нативного input через DataTransfer */
export function applyFilesToNativeInput(
  input: HTMLInputElement | null,
  files: File[]
): void {
  if (!input) return;
  const dataTransfer = new DataTransfer();
  for (const file of files) dataTransfer.items.add(file);
  input.files = dataTransfer.files;

  if (files.length === 0) {
    // Сбросим значение, чтобы событие change срабатывало при выборе того же файла повторно
    input.value = "";
  }
}

export function mergeUniqueFiles(existing: File[], incoming: File[]): File[] {
  // Ключ по трем стабильным признакам
  const byKey = new Map<string, File>();
  for (const f of existing) {
    byKey.set(`${f.name}|${f.size}|${f.lastModified}`, f);
  }
  for (const f of incoming) {
    byKey.set(`${f.name}|${f.size}|${f.lastModified}`, f);
  }
  return Array.from(byKey.values());
}
