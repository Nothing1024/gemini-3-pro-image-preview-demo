const MAX_UPLOADS = 14;

export function limitUploads(existing, incoming) {
  const available = MAX_UPLOADS - existing;
  return available > 0 ? incoming.slice(0, available) : [];
}

export function isImageFile(file) {
  return file && file.type && file.type.startsWith('image/');
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function toUploadItems(files) {
  const items = [];
  for (const file of files) {
    if (!isImageFile(file)) continue;
    const dataUrl = await fileToBase64(file);
    const [, base64] = dataUrl.split(',');
    items.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      mimeType: file.type,
      base64,
      dataUrl,
    });
  }
  return items;
}
