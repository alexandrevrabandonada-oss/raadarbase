import { describe, it, expect, vi } from "vitest";
import { suggestMemoriesFromResults } from "./strategic-memory";

// Mock do Supabase
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({
          data: [
            {
              id: "r1",
              lessons_learned: "Post informativo gerou mais comentários que vídeo.",
              item: {
                id: "i1",
                type: "post_publico",
                plan: {
                  topic_id: "t1",
                  topic: { name: "Saúde" }
                }
              }
            },
            {
              id: "r2",
              lessons_learned: "Roda de conversa presencial gerou 5 novas demandas.",
              item: {
                id: "i2",
                type: "escuta_bairro",
                plan: {
                  topic_id: "t1",
                  topic: { name: "Saúde" }
                }
              }
            }
          ],
          error: null
        })
      })
    })
  })
}));

describe("Strategic Memory Data Logic", () => {
  describe("Pattern Synthesis (suggestMemoriesFromResults)", () => {
    it("should aggregate results by topic and suggest titles", async () => {
      const suggestions = await suggestMemoriesFromResults();
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].topic_name).toBe("Saúde");
      expect(suggestions[0].suggested_title).toContain("Saúde");
      expect(suggestions[0].source_count).toBe(2);
    });

    it("should include snippets of lessons learned in summary", async () => {
      const suggestions = await suggestMemoriesFromResults();
      expect(suggestions[0].suggested_summary).toContain("Post informativo");
      expect(suggestions[0].suggested_summary).toContain("Roda de conversa");
    });
  });
});
