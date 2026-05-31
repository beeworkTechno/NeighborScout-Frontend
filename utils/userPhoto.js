import { API_URL } from '../src/services/api';

export const getUserProfilePhotoUrl = (user) => {
  if (!user) return null;

  if (user.hasProfilePhoto && user._id) {
    const version = user.updatedAt
      ? `?v=${new Date(user.updatedAt).getTime()}`
      : '';

    return `${API_URL}/auth/profile-photo/${user._id}${version}`;
  }

  if (user.avatar) {
    return user.avatar;
  }

  return null;
};