import AsyncStorage from '@react-native-async-storage/async-storage';

// Save token
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.log('Save token error:', error);
  }
};

// Get token
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.log('Get token error:', error);
    return null;
  }
};

// Remove token only
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (error) {
    console.log('Remove token error:', error);
  }
};

// Save user role
export const saveRole = async (role) => {
  try {
    await AsyncStorage.setItem('role', role);
  } catch (error) {
    console.log('Save role error:', error);
  }
};

// Get user role
export const getRole = async () => {
  try {
    return await AsyncStorage.getItem('role');
  } catch (error) {
    console.log('Get role error:', error);
    return null;
  }
};

// Remove role only
export const removeRole = async () => {
  try {
    await AsyncStorage.removeItem('role');
  } catch (error) {
    console.log('Remove role error:', error);
  }
};

// Clear all auth data during logout
export const clearToken = async () => {
  try {
    await AsyncStorage.multiRemove(['token', 'role']);
  } catch (error) {
    console.log('Clear auth data error:', error);
  }
};