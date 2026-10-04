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

    const result = await response.json();

    if (response.status === 422) {
      throw new Error(result.error);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bulk upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    return result as T;
  } catch (error) {
    console.error('Bulk upload error:', error);
    throw error;
  }
};
