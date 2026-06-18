import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  "28186262069-saskpnmu4ippu735knnddfsbe2bk0khn.apps.googleusercontent.com";

const DEPLOYED_REDIRECT_URI =
  "https://beeworktechno.github.io/NeighborScout-Frontend/";

const getRedirectUri = () => {
  if (Platform.OS === "web") {
    const origin = window.location.origin;

    if (origin.includes("github.io")) {
      return DEPLOYED_REDIRECT_URI;
    }

    return origin;
  }

  return AuthSession.makeRedirectUri({
    scheme: "neighborscout",
  });
};

const parseParamsFromUrl = (url) => {
  const params = {};

  if (!url) {
    return params;
  }

  const queryString = url.includes("?") ? url.split("?")[1].split("#")[0] : "";
  const hashString = url.includes("#") ? url.split("#")[1] : "";

  const parseString = (value) => {
    if (!value) return;

    value.split("&").forEach((part) => {
      const [key, val] = part.split("=");

      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(val || "");
      }
    });
  };

  parseString(queryString);
  parseString(hashString);

  return params;
};

export const signInWithGoogle = async () => {
  try {
    const redirectUri = getRedirectUri();

    console.log("Google redirectUri:", redirectUri);

    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${encodeURIComponent(WEB_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent("profile email")}` +
      `&prompt=select_account`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    console.log("Google WebBrowser result:", result);

    if (result.type !== "success") {
      return {
        type: result.type,
        accessToken: null,
        idToken: null,
        params: {},
      };
    }

    const params = parseParamsFromUrl(result.url);

    console.log("Google parsed params:", params);

    return {
      type: "success",
      accessToken: params.access_token || null,
      idToken: params.id_token || null,
      params,
    };
  } catch (error) {
    console.log("Google Sign In Error:", error);

    return {
      type: "error",
      accessToken: null,
      idToken: null,
      params: {},
      error,
    };
  }
};