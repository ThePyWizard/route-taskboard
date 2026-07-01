import { JoinForm } from "@/components/JoinForm";

export const dynamic = "force-dynamic";

export default function JoinPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <JoinForm />
    </main>
  );
}
