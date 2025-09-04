import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Account, Avatars, Client, OAuthProvider } from "react-native-appwrite";

export const config = {
  platform: "com.sc.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
};

export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);

export async function login() {
  try {
    //const redirectUri = Linking.createURL("/");
    let redirectUri = AuthSession.makeRedirectUri({ preferLocalhost: true });

    // Hack: Ensure localhost is in the URI for Appwrite OAuth validation on mobile
    if (!redirectUri.includes("localhost")) {
      const url = new URL(redirectUri);
      url.hostname = "localhost";
      redirectUri = url.toString();
    }

    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri,
      redirectUri
    );

    if (!response) throw new Error("Failed to create OAuth2 token");

    const browserResult = await WebBrowser.openAuthSessionAsync(
      response.toString(),
      redirectUri
    );

    if (browserResult.type !== "success")
      throw new Error("Authentication failed");
    const url = new URL(browserResult.url);

    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();

    if (!secret || !userId) throw new Error("Invalid authentication response");

    const session = await account.createSession(userId, secret);

    if (!session) throw new Error("Failed to create session");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function logout() {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getUser() {
  try {
    const response = await account.get();

    if (response.$id) {
      const userAvatar = avatar.getInitials({ name: response.name || "User" });
      return { ...response, avatar: userAvatar.toString() };
    }
    return response;
  } catch (error) {
    console.error(error);
    return null;
  }
}
