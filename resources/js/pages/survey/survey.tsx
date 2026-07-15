import { useState } from "react";
import StudentSurvey from "./surveyform/surveyquesti";
import AgencySurvey from "./agent/agencysurveyform";
import InstitutionalSurvey from './institutional/InstitutionalSurveyForm'; // Adjust import path if needed

const PRIMARY = "#0ea5e9";
const SURFACE = "#F8FAFB";

export default function App() {
  const [activeTab, setActiveTab] = useState<"student" | "agency" | "institution">("student");

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      {/* ── Compact & Professional Navigation Tab Bar ── */}
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "0.5rem 1rem",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 5px rgba(0, 0, 0, 0.03)",
      }}>
        <div style={{
          display: "flex",
          background: "#f1f5f9",
          borderRadius: "999px",
          padding: "3px",
          maxWidth: "520px", // Expanded slightly to comfortably accommodate three tabs
          width: "100%",
          border: "1px solid #e2e8f0",
        }}>
          <button
            onClick={() => setActiveTab("student")}
            style={{
              flex: 1,
              background: activeTab === "student" ? PRIMARY : "transparent",
              color: activeTab === "student" ? "white" : "#475569",
              border: "none",
              borderRadius: "999px",
              padding: "0.45rem 0.5rem",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.74rem",
              fontWeight: "700",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s ease-in-out",
            }}
          >
            Student Survey
          </button>
          <button
            onClick={() => setActiveTab("agency")}
            style={{
              flex: 1,
              background: activeTab === "agency" ? PRIMARY : "transparent",
              color: activeTab === "agency" ? "white" : "#475569",
              border: "none",
              borderRadius: "999px",
              padding: "0.45rem 0.5rem",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.74rem",
              fontWeight: "700",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s ease-in-out",
            }}
          >
            Agency Survey
          </button>
          <button
            onClick={() => setActiveTab("institution")}
            style={{
              flex: 1,
              background: activeTab === "institution" ? PRIMARY : "transparent",
              color: activeTab === "institution" ? "white" : "#475569",
              border: "none",
              borderRadius: "999px",
              padding: "0.45rem 0.5rem",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.74rem",
              fontWeight: "700",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s ease-in-out",
            }}
          >
            HEI Survey
          </button>
        </div>
      </div>

      {/* ── Render Surveys ── */}
      {/* Visibility is toggled via display properties to preserve filled form states when shifting tabs */}
      <div style={{ display: activeTab === "student" ? "block" : "none" }}>
        <StudentSurvey />
      </div>

      <div style={{ display: activeTab === "agency" ? "block" : "none" }}>
        <AgencySurvey />
      </div>

      <div style={{ display: activeTab === "institution" ? "block" : "none" }}>
        <InstitutionalSurvey />
      </div>
    </div>
  );
}