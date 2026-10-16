import React from "react";
import SaanragamLayout from "../components/SaanragamLayout";

export default function WordHistoryPageShell({ children }) {
  return (
    <SaanragamLayout
      image="pillars"
      eyebrow="மொழி · வரலாறு · ஆதாரம்"
      title="சொல்லின் மரபு"
      subtitle="சரிபார்க்கப்பட்ட மூலங்களின் அடிப்படையில் சொற்களின் வரலாற்றை ஆராயுங்கள்."
    >
      <section className="saanragam-panel">{children}</section>
    </SaanragamLayout>
  );
}
