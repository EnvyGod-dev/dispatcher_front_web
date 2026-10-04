export const uploadFile = async (
  file: File,
  endpoint: string
): Promise<{ url: string }> => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const url = `${baseURL}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

  const formData = new FormData();
  formData.append('file', file);

  for (const [key, value] of formData.entries()) {
    console.log(
      `${key}:`,
      value instanceof File ? `File(${value.name})` : value
    );
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (response.status === 422) {
      return response.json();
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
