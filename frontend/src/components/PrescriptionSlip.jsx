import React, { useMemo } from "react";

const pad2 = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export default function PrescriptionSlip({
  hospitalName = "오성 문학의원",
  name,
  result,
}) {
  if (!result) return null;

  const issuedAt = todayStr();
  const { recommendation, analysis } = result;

  const patientName = name?.trim() || "—";
  const title = recommendation?.title || "—";
  const author = recommendation?.author || "";
  const genre = recommendation?.genre || "";
  const content = String(recommendation?.content || "").trim();
  const reason = analysis?.reason || "—";

  return (
    // ✅ 가운데 정렬 제거 + 위에서부터 시작
    <div className="w-full flex items-start justify-center">
      <div className="w-full max-w-2xl rounded-2xl border bg-white shadow-sm p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {title}
            </div>
            <div className="text-sm md:text-base text-muted-foreground mt-1">
              문학 처방전 · 발급일 {issuedAt}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">환자명</div>
            <div className="text-lg md:text-xl font-semibold">{patientName}</div>
          </div>
        </div>

        <div className="my-5 h-px bg-border" />

        {/* ✅ Content first 5 lines */}
        <div className="mt-5">
          <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">
  {content || "—"}
</div>

        </div>

        {/* Reason */}
        <div className="mt-6 rounded-xl border border-border p-4">
          <div className="text-xs md:text-sm text-muted-foreground">처방 이유</div>
          <div className="mt-2 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
            {reason}
          </div>
        </div>
      </div>
    </div>
  );
}
