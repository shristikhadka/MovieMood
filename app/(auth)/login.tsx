import LoginButtons from "@/components/auth/LoginButtons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, TextInput } from "react-native";
import { login } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null!);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const user = await login(cleanEmail, cleanPassword);
      if (user) router.replace("/(tabs)");
    } catch (error: unknown) {
      console.log(error);
      const errorMessage = (error as Error)?.message || "Sign in failed";
      Alert.alert("Sign in failed", errorMessage.includes("Email and password") ? errorMessage : "Wrong email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginButtons
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      passwordRef={passwordRef}
      handleSignIn={handleSignIn}
      loading={loading}
    />
  );
}