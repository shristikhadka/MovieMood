import SignupButtons from "@/components/auth/SignupButtons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, TextInput } from "react-native";
import { signup } from '@/services/auth';

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const nameRef = useRef<TextInput>(null!);
  const emailRef = useRef<TextInput>(null!);
  const passwordRef = useRef<TextInput>(null!);
  const confirmPasswordRef = useRef<TextInput>(null!);

  const handleSignUp = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!cleanName || !cleanEmail || !cleanPassword || !cleanConfirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (cleanPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await signup(cleanName, cleanEmail, cleanPassword);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      console.log(error);
      const errorMessage = (error as Error)?.message || "Sign up failed";
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupButtons
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      nameRef={nameRef}
      emailRef={emailRef}
      passwordRef={passwordRef}
      confirmPasswordRef={confirmPasswordRef}
      handleSignUp={handleSignUp}
      loading={loading}
    />
  );
}