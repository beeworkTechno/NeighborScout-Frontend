import { useEffect } from 'react';
import { Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function Layout() {
  const router = useRouter();

  useEffect(() => {
    const navigateToBusinessDetails = (url) => {
      if (!url) {
        return;
      }

      try {
        const match = url.match(/neighborscout:\/\/business\/([^/?#]+)/i)
          || url.match(/\/\/business\/([^/?#]+)/i)
          || url.match(/business\/([^/?#]+)/i);

        const businessId = match?.[1];

        if (businessId) {
          router.push(`/business/${businessId}`);
        }
      } catch (error) {
        console.log('Deep link parse error:', error);
      }
    };

    const handleUrlEvent = ({ url }) => {
      navigateToBusinessDetails(url);
    };

    const initLinking = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          navigateToBusinessDetails(initialUrl);
        }
      } catch (error) {
        console.log('Deep link initial URL error:', error);
      }
    };

    initLinking();
    const subscription = Linking.addEventListener('url', handleUrlEvent);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-business" />
      <Stack.Screen name="business/[id]" />
    </Stack>
  );
}
