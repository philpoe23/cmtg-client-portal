import { CodeForm } from "./code-form";

export default async function CodePage({ searchParams }: { searchParams: Promise<{ otp?: string }> }) {
  const { otp } = await searchParams;
  return <CodeForm otpId={otp ?? ""} />;
}
