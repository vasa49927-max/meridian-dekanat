import { requireStudent } from "@/server/auth/guards";
import { assistantEnabled } from "@/server/ai/assistant";
import { Chat } from "@/components/assistant/chat";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("assistant.title") };
}

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const v = await requireStudent();
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <Chat firstName={v.firstName} initialQuestion={q?.slice(0, 500) ?? null} llm={assistantEnabled()} />
    </div>
  );
}
