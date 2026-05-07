import { ImageResponse } from "next/og";
import { getPublicListeningReceipt } from "@/lib/data/public-listening-receipt";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "1x1"; // 1x1 or 3x4
    
    const isPortrait = format === "3x4";
    const width = 1080;
    const height = isPortrait ? 1440 : 1080;

    const receipt = await getPublicListeningReceipt();

    // Visual Identity Tokens
    const bgDark = "#1a1a1a";
    const bgLighter = "#2a2a2a";
    const accentYellow = "#facc15";
    const accentRed = "#b91c1c";
    const textLight = "#f8fafc";
    const textMuted = "#94a3b8";

    // Prepare text elements
    const periodText = `${receipt.periodStart} a ${receipt.periodEnd}`;
    const topicsList = receipt.topics.topics.slice(0, 3).map(t => t.name).join(" • ");

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: bgDark,
            fontFamily: "sans-serif",
            padding: isPortrait ? "80px 60px" : "60px",
            color: textLight,
            border: `16px solid ${bgLighter}`,
            boxSizing: "border-box",
            justifyContent: "space-between",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: accentYellow,
                color: "#000",
                padding: "8px 24px",
                borderRadius: "4px",
                fontSize: 24,
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                alignSelf: "flex-start",
              }}
            >
              Prestação de Contas
            </div>
            <h1
              style={{
                fontSize: isPortrait ? 80 : 70,
                fontWeight: "900",
                lineHeight: 1.1,
                margin: "20px 0 0 0",
                color: textLight,
              }}
            >
              RECIBO DA<br />
              <span style={{ color: accentYellow }}>ESCUTA</span>
            </h1>
            <p style={{ fontSize: 28, color: textMuted, margin: "10px 0 0 0" }}>
              O que ouvimos, o que fizemos e o que falta.
            </p>
            <p style={{ fontSize: 24, color: textMuted, margin: "10px 0 0 0", fontStyle: "italic" }}>
              Período: {periodText}
            </p>
          </div>

          {/* Numbers Grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              marginTop: "40px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: bgLighter,
                padding: "30px",
                borderRadius: "12px",
                flex: "1",
                borderLeft: `8px solid ${accentYellow}`,
              }}
            >
              <span style={{ fontSize: 60, fontWeight: "900", color: textLight }}>
                {receipt.topics.uniquePeopleReached}
              </span>
              <span style={{ fontSize: 24, color: textMuted, textTransform: "uppercase" }}>
                Pessoas Alcançadas
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: bgLighter,
                padding: "30px",
                borderRadius: "12px",
                flex: "1",
                borderLeft: `8px solid ${accentRed}`,
              }}
            >
              <span style={{ fontSize: 60, fontWeight: "900", color: textLight }}>
                {receipt.actions.totalActions}
              </span>
              <span style={{ fontSize: 24, color: textMuted, textTransform: "uppercase" }}>
                Ações Criadas
              </span>
            </div>
          </div>

          {/* Topics and Call to action */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 24, fontWeight: "bold", color: accentYellow, textTransform: "uppercase" }}>
                Principais Temas:
              </span>
              <span style={{ fontSize: 32, fontWeight: "bold", color: textLight, marginTop: "10px" }}>
                {topicsList || "Ainda colhendo dados..."}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "auto",
              paddingTop: "40px",
              borderTop: `2px solid ${bgLighter}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 36, fontWeight: "900", color: textLight, letterSpacing: "-0.02em" }}>
                MISSÃO ÉLUTA
              </span>
              <span style={{ fontSize: 20, color: textMuted, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Escutar • Cuidar • Organizar
              </span>
            </div>
            <div
              style={{
                display: "flex",
                backgroundColor: accentYellow,
                color: "#000",
                padding: "16px 32px",
                borderRadius: "30px",
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              Participe da Escuta!
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (error) {
    console.error("[public_receipt_card_export] Error:", error);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
