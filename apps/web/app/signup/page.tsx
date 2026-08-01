import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFlow } from "@/components/auth/auth-flow";

export default function SignupPage() {
  return (
    <AuthLayout>
      <AuthFlow mode="signup" />
    </AuthLayout>
  );
}
