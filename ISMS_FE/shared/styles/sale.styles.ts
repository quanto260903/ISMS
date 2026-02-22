// ============================================================
//  shared/styles/sale.styles.ts
//  Style object dùng cho feature sale
// ============================================================

import React from "react";

const styles: Record<string, React.CSSProperties> = {
  // Layout
  container:    { maxWidth: "100%", margin: "0 auto", padding: "24px 32px", fontFamily: "sans-serif", fontSize: 14 },
  title:        { fontSize: 22, marginBottom: 16 },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#333" },
  hr:           { border: "none", borderTop: "1px solid #e5e5e5", margin: "16px 0" },

  // Form fields
  fieldGroup: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  label:      { minWidth: 220, color: "#444" },
  input:      { flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4, fontSize: 14 },
  radioLabel: { display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, color: "#333" },

  // Item table
  itemTable: {
    width: "100%",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    fontSize: 12,
    border: "1px solid #e0e0e0",
  },
  itemTh: {
    padding: "8px 6px",
    background: "#2255cc",
    color: "#fff",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 11,
    whiteSpace: "nowrap",
    borderBottom: "2px solid #1a44aa",
    overflow: "hidden",
  },
  itemTd: {
    padding: "5px 6px",
    borderBottom: "1px solid #eee",
    verticalAlign: "middle",
    fontSize: 12,
    overflow: "hidden",
  },
  inputTable: {
    width: "100%",
    padding: "4px 5px",
    border: "1px solid #ddd",
    borderRadius: 3,
    fontSize: 12,
    boxSizing: "border-box",
    outline: "none",
  },
  selectVat: {
    padding: "4px 4px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 12,
    background: "#fff",
    cursor: "pointer",
    width: "100%",
  },
  spinner: {
    position: "absolute",
    right: 8, top: "50%",
    transform: "translateY(-50%)",
    fontSize: 13,
    pointerEvents: "none",
  },

  // Summary
  summaryBox: {
    marginTop: 16,
    border: "1px solid #e0e8ff",
    borderRadius: 6,
    padding: "12px 16px",
    background: "#f8faff",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxWidth: 360,
    marginLeft: "auto",
  },
  summaryRow:   { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#444" },
  summaryTotal: { borderTop: "1px solid #c7d7ff", paddingTop: 8, marginTop: 4, fontSize: 15, color: "#1a3a99" },

  // Dropdown portal
  dropdownItem: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", fontSize: 13 },
  dropdownId:   { fontWeight: 700, color: "#2255cc", minWidth: 70, fontSize: 12 },
  dropdownName: { flex: 1, color: "#222" },
  dropdownMeta: { fontSize: 11, color: "#888", whiteSpace: "nowrap" },

  // Buttons
  btnPrimary:   { padding: "8px 20px", background: "#2255cc", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  btnSecondary: { padding: "6px 14px", background: "#f5f5f5", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer", fontSize: 13 },
  btnDanger:    { padding: "3px 6px", background: "#fff0f0", color: "#cc2222", border: "1px solid #ffcccc", borderRadius: 4, cursor: "pointer", fontSize: 11 },
  btnDetail:    { padding: "3px 6px", background: "#f0fff4", color: "#1a7a3a", border: "1px solid #86efac", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" },
  message:      { marginTop: 12, fontWeight: 500 },

  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modalBox:     { background: "#fff", borderRadius: 10, width: "min(96vw, 900px)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", overflow: "hidden" },
  modalHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px", borderBottom: "1px solid #e5e5e5", background: "#f8faff" },
  modalTitle:   { fontSize: 16, fontWeight: 700, color: "#1a3a99" },
  modalSubtitle:{ fontSize: 12, color: "#666", marginTop: 2 },
  modalClose:   { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888", lineHeight: 1, padding: "2px 6px", borderRadius: 4 },
  modalBody:    { padding: "16px 20px", overflowY: "auto", flex: 1 },
  modalStatus:  { textAlign: "center", color: "#888", padding: "32px 0", fontSize: 14 },

  // Warehouse table
  table:   { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 },
  th:      { padding: "8px 10px", background: "#2255cc", color: "#fff", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap", fontSize: 12 },
  td:      { padding: "7px 10px", borderBottom: "1px solid #eee", whiteSpace: "nowrap", fontSize: 13 },
  tdIn:    { color: "#1a7a3a", fontWeight: 600, textAlign: "right" },
  tdOut:   { color: "#cc2222", fontWeight: 600, textAlign: "right" },
  tdStock: { fontWeight: 700, textAlign: "right" },
};

export default styles;