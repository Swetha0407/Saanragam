import React from "react";
import SaanragamLayout from "../components/SaanragamLayout";

export default function DailyKuralPageShell({ children }) {
  return (
    <SaanragamLayout
      image="scroll"
      eyebrow="தினமும் ஒரு சிந்தனை"
      title="இன்றைய குறள்"
      subtitle="ஒரு குறள். ஒரு புதிய பார்வை. வாழ்வுக்கான ஒரு சிறிய வழிகாட்டல்."
    >
      <section className="saanragam-panel">{children}</section>
    </SaanragamLayout>
  );
}
