import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  Account,
  Avatars,
  Client,
  Databases,
  OAuthProvider,
  Query,
} from "react-native-appwrite";

export const config = {
  platform: "com.sc.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  agentsTableId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_TABLE_ID,
  galleriesTableId: process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_TABLE_ID,
  reviewsTableId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_TABLE_ID,
  propertiesTableId: process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_TABLE_ID,
};

export const client = new Client();

client.setEndpoint(config.endpoint!).setProject(config.projectId!);

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);

export async function login() {
  try {
    //const redirectUri = Linking.createURL("/");
    let redirectUri = AuthSession.makeRedirectUri({ scheme: "restate" });

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

export async function getCurrentUser() {
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

export async function getLatestProperties() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesTableId!,
      [Query.orderAsc("$createdAt"), Query.limit(5)]
    );
    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    const buildQuery = [Query.orderDesc("$createdAt")];

    if (filter && filter !== "All") {
      buildQuery.push(Query.equal("type", filter));
    }

    if (query) {
      buildQuery.push(
        Query.or([
          Query.search("name", query),
          Query.search("address", query),
          Query.search("type", query),
        ])
      );
    }

    if (limit) {
      buildQuery.push(Query.limit(limit));
    }

    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesTableId!,
      buildQuery
    );
    return result.documents;
  } catch (error) {
    console.error(error);
  }
}

export async function getPropertyById({ id }: { id: string }) {
  try {
    const result = await databases.getDocument(
      config.databaseId!,
      config.propertiesTableId!,
      id
    );

    const galleryRows = await databases.listDocuments(
      config.databaseId!,
      config.galleriesTableId!,
      [Query.equal("68cbb68d003b729a74ef", id)]
    );

    return {
      ...result,
      gallery: galleryRows.documents ?? [],
    } as typeof result & {
      gallery: typeof galleryRows.documents;
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
