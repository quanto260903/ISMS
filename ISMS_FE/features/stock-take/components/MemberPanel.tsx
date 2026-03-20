// features/stock-take/components/MemberPanel.tsx
"use client";

import React from "react";

interface MemberPanelProps {
  member1: string; setMember1: (v: string) => void;
  position1: string; setPosition1: (v: string) => void;
  member2: string; setMember2: (v: string) => void;
  position2: string; setPosition2: (v: string) => void;
  member3: string; setMember3: (v: string) => void;
  position3: string; setPosition3: (v: string) => void;
  inputStyle: React.CSSProperties;
}

/**
 * Dùng chung trong StockTakeCreatePage và EditModal (StockTakeDetailPage).
 * Hiển thị 3 cặp (tên thành viên / chức vụ) trên 3 cột.
 */
export function MemberPanel({
  member1, setMember1, position1, setPosition1,
  member2, setMember2, position2, setPosition2,
  member3, setMember3, position3, setPosition3,
  inputStyle,
}: MemberPanelProps) {
  const slots = [
    { mv: member1, pv: position1, sm: setMember1, sp: setPosition1, idx: 1 },
    { mv: member2, pv: position2, sm: setMember2, sp: setPosition2, idx: 2 },
    { mv: member3, pv: position3, sm: setMember3, sp: setPosition3, idx: 3 },
  ] as const;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px 16px" }}>
      {slots.map(({ mv, pv, sm, sp, idx }) => (
        <div key={idx}>
          <input
            style={{ ...inputStyle, marginBottom: 4 }}
            placeholder={`Thành viên ${idx}`}
            value={mv}
            onChange={(e) => sm(e.target.value)}
          />
          <input
            style={{ ...inputStyle, height: 30, fontSize: 12 }}
            placeholder={`Chức vụ `}
            value={pv}
            onChange={(e) => sp(e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
