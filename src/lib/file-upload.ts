export const uploadBulkFile = async <T>(
  file: File,
  endpoint: string
): Promise<T> => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const url = `${baseURL}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    // Body-г нэг л удаа уншина (json() дараа text() дуудахад алдаа гардаг).
    const text = await response.text();
    let result: unknown = null;

    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      result = null;
    }

    if (!response.ok) {
      const message =
        (result as { error?: unknown; message?: unknown } | null)?.error ??
        (result as { message?: unknown } | null)?.message;
      console.error('Bulk upload failed:', text);
      throw new Error(
        typeof message === 'string' && message
          ? message
          : `Upload failed: ${response.status}`
      );
    }

    return result as T;
  } catch (error) {
    console.error('Bulk upload error:', error);
    throw error;
  }
};
