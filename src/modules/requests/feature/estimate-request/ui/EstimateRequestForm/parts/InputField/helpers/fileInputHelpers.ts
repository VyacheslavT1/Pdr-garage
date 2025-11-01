export function extractFilesFromChangeEvent(
  event: React.ChangeEvent<HTMLInputElement>
): File[] {
  const files = event.target.files;
  if (!files || files.length === 0) return [];
  return Array.from(files);
}

export function mergeUniqueFiles(current: File[], incoming: File[]): File[] {
  const byKey = new Map<string, File>();
  for (const f of current) byKey.set(f.name + ":" + f.size + ":" + f.type, f);
  for (const f of incoming) byKey.set(f.name + ":" + f.size + ":" + f.type, f);
  return Array.from(byKey.values());
}

export function removeFileByIndex(files: File[], index: number): File[] {
  const next = files.slice();
  next.splice(index, 1);
  return next;
}

export function applyFilesToNativeInput(
  input: HTMLInputElement | null,
  files: File[]
): void {
  if (!input) return;
  const data = new DataTransfer();
  for (const f of files) data.items.add(f);
  input.files = data.files;
}

