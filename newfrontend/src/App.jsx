import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SiteHeader from "./components/SiteHeader";
import SaanragamHome from "./pages/SaanragamHome";
import ThirukkuralReader from "./components/ThirukkuralReader";
import KuralVerification from "./components/KuralVerification";
import KuralForYou from "./components/KuralForYou";
import WordMeaning from "./components/WordMeaning";
import WordHistory from "./components/WordHistory";
import DailyKural from "./components/DailyKural";
import ThiruvalluvarGuide from "./components/ThiruvalluvarGuide";
import SaanragamLayout from "./components/SaanragamLayout";
import "./App.css";

function KuralPage() {
  return <ThirukkuralReader />;
}

function VerifyPage() {
  return (
    <SaanragamLayout
      eyebrow="சான்றகம் உரை மெய்ப்பிப்பு"
      title="குறள் மெய்ப்பிப்பு"
      subtitle="நீங்கள் கண்ட திருக்குறள் வரிகளை உள்ளிட்டு, மூலத் தரவுத்தளத்துடன் சொல்வாரியாக ஒப்பிடுங்கள்."
    >
      <KuralVerification />
    </SaanragamLayout>
  );
}

function KuralForYouPage() {
  return (
    <SaanragamLayout
      eyebrow="வாழ்க்கை நெறி ஆலோசனைகள்"
      title="சூழல் குறள்"
      subtitle="கோபம், கல்வி, நட்பு, மனச்சுமை உள்ளிட்ட 8 வாழ்க்கைச் சூழல்களுக்குத் திருவள்ளுவர் காட்டும் நல்வழி."
    >
      <KuralForYou />
    </SaanragamLayout>
  );
}

function WordMeaningPage() {
  return (
    <SaanragamLayout
      eyebrow="சொற்பொருட் களஞ்சியம்"
      title="சொல்லாய்வாளர்"
      subtitle="தமிழ்ச் சொற்களின் நேரடி அகராதிப் பொருள் மற்றும் திருக்குறளில் அச்சொல் இடம்பெறும் சூழல் ஆய்வு."
    >
      <WordMeaning />
    </SaanragamLayout>
  );
}

function WordHistoryPage() {
  return (
    <SaanragamLayout
      eyebrow="திராவிட மொழியியல் ஆய்வு"
      title="சொல்லின் மரபு"
      subtitle="DEDR மற்றும் பழந்தமிழ்ச் சான்றுகளுடன் சொல்லின் வேர் மற்றும் மலையாளம், கன்னடம், தெலுங்கு மொழி ஒப்பீடுகள்."
    >
      <WordHistory />
    </SaanragamLayout>
  );
}

function DailyKuralPage() {
  return (
    <SaanragamLayout
      eyebrow="சான்றகம் விடியல் அருள்"
      title="இன்றைய குறள்"
      subtitle="தினந்தோறும் ஒரு நற்பேறு குறளுடன் உங்கள் சிந்தனையைத் தொடங்குங்கள்."
    >
      <DailyKural />
    </SaanragamLayout>
  );
}

function ThiruvalluvarPage() {
  return (
    <SaanragamLayout
      eyebrow="ஞானக் கூடம்"
      title="திருவள்ளுவர் வழிகாட்டி"
      subtitle="வாழ்க்கையின் இக்கட்டான தருணங்களில் திருவள்ளுவரிடம் ஆலோசனை கேட்டு நல்வழி அறியுங்கள்."
    >
      <ThiruvalluvarGuide />
    </SaanragamLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<SaanragamHome />} />
        <Route path="/kural" element={<KuralPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/kural-for-you" element={<KuralForYouPage />} />
        <Route path="/word-meaning" element={<WordMeaningPage />} />
        <Route path="/word-history" element={<WordHistoryPage />} />
        <Route path="/daily-kural" element={<DailyKuralPage />} />
        <Route path="/thiruvalluvar" element={<ThiruvalluvarPage />} />
        <Route path="*" element={<SaanragamHome />} />
      </Routes>
    </BrowserRouter>
  );
}
