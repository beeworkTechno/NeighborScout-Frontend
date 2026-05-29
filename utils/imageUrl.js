import { API_URL } from '../src/services/api';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  const backendUrl = API_URL.replace('/api', '');

  return `${backendUrl}${imagePath}`;
};