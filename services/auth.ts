import { Account, Client, ID } from "react-native-appwrite";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const account = new Account(client);

export interface AuthUser {
  $id: string;
  name: string;
  email: string;
  $createdAt?: string;
}

// Simple login function
export const login = async (email: string, password: string): Promise<AuthUser> => {
  try {
    // First, check if user is already logged in
    try {
      const existingUser = await account.get();
      if (existingUser) {
        console.log("User already logged in:", existingUser.email);
        return existingUser as AuthUser;
      }
    } catch (error) {
      // No existing session, proceed with login
    }

    // Clear any existing sessions first
    try {
      await account.deleteSessions();
    } catch (error) {
      // No sessions to delete
    }

    // Create new session
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    return user as AuthUser;
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.message || "Login failed");
  }
};

// Simple signup function  
export const signup = async (name: string, email: string, password: string): Promise<AuthUser> => {
  try {
    // Clear any existing sessions first
    try {
      await account.deleteSessions();
    } catch (error) {
      // No sessions to delete
    }

    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    return user as AuthUser;
  } catch (error: any) {
    console.error("Signup error:", error);
    throw new Error(error.message || "Signup failed");
  }
};

// Simple logout function
export const logout = async (): Promise<void> => {
  try {
    await account.deleteSessions();
  } catch (error: any) {
    console.error("Logout error:", error);
    throw new Error(error.message || "Logout failed");
  }
};

// Check if user is logged in
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const user = await account.get();
    return user as AuthUser;
  } catch (error) {
    return null;
  }
};

// Check auth status
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    await account.get();
    return true;
  } catch (error) {
    return false;
  }
};

// Change password function
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    await account.updatePassword(newPassword, currentPassword);
  } catch (error: any) {
    console.error("Password change error:", error);
    throw new Error(error.message || "Failed to change password");
  }
};