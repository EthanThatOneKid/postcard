import { ImageResponse } from "next/og";
import { db } from "@/src/db";
import { postcards, posts } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { dbRowToReport } from "@/src/api/conversions";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const result = await db
      .select()
      .from(postcards)
      .innerJoin(posts, eq(posts.id, postcards.postId))
      .where(eq(postcards.id, id))
      .limit(1);

    if (result.length === 0) {
      return new Response("Postcard not found", { status: 404 });
    }

    const { postcards: row, posts: post } = result[0];
    const report = dbRowToReport(row, post);

    const verdictLabel = report.corroboration.verdict.toUpperCase();
    const verdictColor =
      report.corroboration.verdict === "verified"
        ? "#4a8438"
        : report.corroboration.verdict === "disputed"
          ? "#b83c2b"
          : "#7a6a52";

    const score = Math.round(report.audit.totalScore * 100);

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fdf6e3",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #d4c9a8 2%, transparent 0%), radial-gradient(circle at 75px 75px, #d4c9a8 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "40px",
          fontFamily: "serif",
        }}
      >
        {/* Postcard Border */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            right: "20px",
            bottom: "20px",
            border: "2px solid #2c2416",
            display: "flex",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#2c2416",
                letterSpacing: "2px",
              }}
            >
              POSTCARD FORENSIC
            </span>
            <span style={{ fontSize: "16px", color: "#7a6a52" }}>
              TRACE ID: {id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Stamp Section */}
          <div
            style={{
              display: "flex",
              width: "120px",
              height: "140px",
              backgroundColor: "#f4c07a",
              border: "4px double #d4882c",
              transform: "rotate(5deg)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              padding: "10px",
            }}
          >
            <span
              style={{ fontSize: "12px", color: "#2c2416", fontWeight: "bold" }}
            >
              SCORE
            </span>
            <span
              style={{ fontSize: "40px", fontWeight: "bold", color: "#2c2416" }}
            >
              {score}
            </span>
            <span style={{ fontSize: "10px", color: "#2c2416" }}>/ 100</span>
          </div>
        </div>

        {/* Main Verdict */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "10px 40px",
              border: `8px double ${verdictColor}`,
              color: verdictColor,
              fontSize: "64px",
              fontWeight: "bold",
              transform: "rotate(-2deg)",
              marginBottom: "20px",
              backgroundColor: "rgba(255,255,255,0.3)",
            }}
          >
            {verdictLabel}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "24px",
              color: "#2c2416",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: "1.4",
              fontStyle: "italic",
            }}
          >
            &quot;{report.corroboration.summary.slice(0, 200)}...&quot;
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "20px",
            borderTop: "1px solid #d4c9a8",
            paddingTop: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{ fontSize: "18px", color: "#2c2416", fontWeight: "bold" }}
            >
              @{report.postcard.username || "unknown"}
            </span>
            <span style={{ fontSize: "14px", color: "#7a6a52" }}>
              Platform: {report.postcard.platform}
            </span>
          </div>
          <div style={{ fontSize: "14px", color: "#7a6a52" }}>
            POSTCARDHQ.TRUTH
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error("OG Image generation failed:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
