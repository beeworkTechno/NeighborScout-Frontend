import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '28186262069-saskpnmu4ippu735knnddfsbe2bk0khn.apps.googleusercontent.com',
    //androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    //iosClientId: 'YOUR_IOS_CLIENT_ID',
    webClientId: '28186262069-saskpnmu4ippu735knnddfsbe2bk0khn.apps.googleusercontent.com',
  });

  return {
    request,
    response,
    promptAsync,
  };
};