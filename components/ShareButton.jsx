import React, { useState } from 'react';
import { Alert, ActivityIndicator, Share, StyleSheet, TouchableOpacity, Text } from 'react-native';
import api from '../src/services/api';

export default function ShareButton({
  businessId,
  businessName,
  businessAddress,
  businessLatitude,
  businessLongitude,
  style,
  disabled,
}) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (loading || disabled) {
      return;
    }

    if (!businessId) {
      Alert.alert('Share Error', 'Missing business ID for sharing.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(`/share/business/${encodeURIComponent(businessId)}`, {
        params: {
          name: businessName,
          address: businessAddress,
          lat: businessLatitude,
          lng: businessLongitude,
        },
      });

      const shareUrl = response.data?.shareUrl;

      if (!shareUrl) {
        throw new Error('Share URL not returned by server.');
      }

      const message = `Check out ${businessName} at ${businessAddress}\n${shareUrl}`;

      await Share.share({ message });
    } catch (error) {
      console.error('Share Error:', error?.response?.data || error?.message || error);
      Alert.alert('Share Error', 'Unable to generate share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleShare}
      activeOpacity={0.85}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>Share</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F9B208',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
