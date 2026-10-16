import React from "react";
import SaanragamLayout from "../components/SaanragamLayout";

export default function ThiruvalluvarPageShell({ children }) {
  return (
    <SaanragamLayout
      image="thiruvalluvar"
      eyebrow="வள்ளுவர் வழி"
      title="திருவள்ளுவர் வழிகாட்டி"
      subtitle="வள்ளுவரின் சிந்தனைகளை அணுகவும்; உரையாடல் மற்றும் அனிமேஷன் அம்சத்தை இங்கே இணைக்கலாம்."
    >
      <section className="saanragam-panel">{children}</section>
    </SaanragamLayout>
  );
}
