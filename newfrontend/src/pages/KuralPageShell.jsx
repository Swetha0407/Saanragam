import React from "react";
import SaanragamLayout from "../components/SaanragamLayout";

/**
 * A visual page shell only. Insert your existing Kural search, verse,
 * meaning, and KuralAudioPlayer inside the children area.
 */
export default function KuralPageShell({ children }) {
  return (
    <SaanragamLayout
      image="lamp"
      eyebrow="திருக்குறள் · கற்க கசடற"
      title="குறளின் ஒளி"
      subtitle="குறளை வாசிக்கவும், பொருளைப் புரிந்துகொள்ளவும், ஒலியுடன் கேட்கவும்."
    >
      <section className="saanragam-panel">{children}</section>
    </SaanragamLayout>
  );
}
