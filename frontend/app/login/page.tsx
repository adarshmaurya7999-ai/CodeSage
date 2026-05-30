import { LoginCommandCenter } from "@/components/auth/LoginCommandCenter";
import "./login-command-center.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authFailed = params.error === "auth";
  const failReason = params.reason ? decodeURIComponent(params.reason) : null;

  return (
    <LoginCommandCenter authFailed={authFailed} failReason={failReason} />
  );
}
