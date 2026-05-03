import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/auth/login?message=Account registration is disabled. Ask a super admin to create your account.");
}
