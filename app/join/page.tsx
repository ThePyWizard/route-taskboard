import { JoinForm } from "@/components/JoinForm";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,name,email")
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <JoinForm profiles={data ?? []} />
    </main>
  );
}
