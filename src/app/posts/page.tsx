import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { listPosts } from "@/lib/data/posts";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { PostsClient } from "./posts-client";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  await requireInternalPageSession("/posts");

  const posts = await listPosts();

  return (
    <AppShell>
      <PageHeader
        title="Posts e Conteúdo"
        description="Acompanhe a mobilização em cada postagem. Identifique quais temas estão gerando mais escuta."
      />

      <PostsClient posts={posts} />
    </AppShell>
  );
}
