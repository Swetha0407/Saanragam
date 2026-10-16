import React from "react";
import SaanragamLayout from "../components/SaanragamLayout";

export default function WordMeaningPageShell({ children }) {
  return (
    <SaanragamLayout
      image="inscription"
      eyebrow="தமிழ்ச் சொற்கள் · பொருள் தேடல்"
      title="சொல்லாய்வாளர்"
      subtitle="சொற்களின் பொருளைத் தேடி, தமிழின் செறிவை அறிந்துகொள்ளுங்கள்."
    >
      <section className="saanragam-panel">{children}</section>
    </SaanragamLayout>
  );
}
