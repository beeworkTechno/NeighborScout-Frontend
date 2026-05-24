import * as WebBrowser from 'expo-web-browser';

import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {

  const [request, response, promptAsync] =
    Google.useAuthRequest({

      expoClientId:
        '28186262069-saskpnmu4ippu735knnddfsbe2bk0khn.apps.googleusercontent.com',

      webClientId:
        '28186262069-saskpnmu4ippu735knnddfsbe2bk0khn.apps.googleusercontent.com',

      androidClientId:
        'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',

      iosClientId:
        'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',

      scopes: ['profile', 'email'],
    });

  return {
    request,
    response,
    promptAsync,
  };
};