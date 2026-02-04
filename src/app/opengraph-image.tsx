import { ImageResponse } from "next/og";

export const alt = "PDR Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #111827, #1f2937)",
          color: "#f9fafb",
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        <div>PDR Studio</div>
        <div style={{ fontSize: 28, fontWeight: 400, marginTop: 16 }}>
          Automotive services showcase
        </div>
      </div>
    ),
    size
  );
}
