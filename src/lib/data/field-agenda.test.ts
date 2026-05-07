import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
    listFieldAgendaEvents, 
    getFieldAgendaEvent, 
    createFieldAgendaEvent, 
} from "./field-agenda";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
    getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
    shouldUseMockData: () => false,
}));

vi.mock("@/lib/audit/write-audit-log", () => ({
    writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe("field-agenda data layer", () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (getSupabaseAdminClient as any).mockReturnValue(mockSupabase);
    });

    it("listFieldAgendaEvents returns mapped events", async () => {
        mockSupabase.order.mockResolvedValue({
            data: [
                { id: '1', title: 'Evento 1', type: 'roda_escuta', status: 'planned', metadata: {} }
            ],
            error: null
        });

        const results = await listFieldAgendaEvents();
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Evento 1');
        expect(results[0].type).toBe('roda_escuta');
    });

    it("getFieldAgendaEvent returns single event", async () => {
        mockSupabase.maybeSingle.mockResolvedValue({
            data: { id: '1', title: 'Evento 1', type: 'roda_escuta', status: 'planned', metadata: {} },
            error: null
        });

        const result = await getFieldAgendaEvent('1');
        expect(result?.id).toBe('1');
    });

    it("createFieldAgendaEvent inserts and logs", async () => {
        mockSupabase.single.mockResolvedValue({
            data: { id: '1', title: 'Novo Evento', type: 'reuniao', status: 'planned', metadata: {} },
            error: null
        });

        const result = await createFieldAgendaEvent({ title: 'Novo Evento', type: 'reuniao' }, { id: 'u1', email: 'test@test.com' });
        expect(result?.title).toBe('Novo Evento');
        expect(mockSupabase.insert).toHaveBeenCalled();
    });
});
