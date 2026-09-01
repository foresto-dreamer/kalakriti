import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: 8,
          fontWeight: 900,
          fontFamily: "sans-serif",
          boxShadow: "inset 0 0 4px rgba(255,255,255,0.4)",
          position: "relative",
        }}
      >
        {/* Stylized K with sprout leaf motif */}
        <span
          style={{
            color: "#ffffff",
            fontWeight: 900,
            fontSize: 22,
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          K
        </span>
        {/* Tiny golden leaf accent dot */}
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            borderRadius: "50% 0 50% 50%",
            background: "#34d399",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
