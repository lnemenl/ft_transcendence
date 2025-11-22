export const validateImageUrl = async (url: string) => {
  const response = await fetch(url, { method: 'HEAD' });
  const contentType = response.headers.get('Content-Type');

  console.log(contentType);

  return contentType && contentType.startsWith('image/', 0);
};
