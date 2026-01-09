// apps/website/src/app/catalogue/page.tsx
import { Metadata } from "next";
import { CatalogSection } from "../../components/marketing/CatalogSection";

export const metadata: Metadata = {
  title:
    "Catalogue des Workers IA - OppSys | 6 Outils d'Intelligence Artificielle",
  description:
    "Découvrez nos 6 outils IA essentiels : posts réseaux sociaux, rédaction, email marketing, transcription, documents, recrutement RH. Automatisez vos tâches avec l'IA conversationnelle.",
  keywords: [
    "IA",
    "automatisation",
    "outils",
    "workers",
    "intelligence artificielle",
    "productivité",
    "réseaux sociaux",
    "marketing",
    "email",
    "transcription",
    "rédaction",
    "RH",
    "recrutement",
    "documents",
    "création contenu",
  ].join(", "),
  openGraph: {
    title: "Catalogue des Workers IA - OppSys | 6 Outils d'IA Essentiels",
    description:
      "6 outils d'IA professionnels pour automatiser vos tâches : marketing, contenu, transcription, RH, documents...",
    type: "website",
    url: "https://oppsys.io/catalogue",
    images: [
      {
        url: "https://oppsys.io/images/catalogue-og.jpg",
        width: 1200,
        height: 630,
        alt: "Catalogue des Workers IA OppSys",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Catalogue des Workers IA - OppSys",
    description: "6 outils d'IA pour automatiser vos tâches quotidiennes",
    images: ["https://oppsys.io/images/catalogue-twitter.jpg"],
  },
  alternates: {
    canonical: "https://oppsys.io/catalogue",
  },
};

export default function CataloguePage() {
  return (
    <>
      {/* ✅ JSON-LD Schema mis à jour */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Catalogue des Workers IA",
            description:
              "Collection de 6 outils d'intelligence artificielle professionnels pour automatiser vos tâches quotidiennes",
            url: "https://oppsys.io/catalogue",
            mainEntity: {
              "@type": "ItemList",
              name: "Outils IA disponibles",
              numberOfItems: 6,
              itemListElement: [
                {
                  "@type": "SoftwareApplication",
                  name: "Générateur Post Multi-Réseaux",
                  description:
                    "Créez des posts engageants pour tous vos réseaux sociaux avec l'IA",
                  applicationCategory: "BusinessApplication",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Rédacteur IA",
                  description:
                    "Rédigez des articles de blog optimisés SEO avec structure professionnelle",
                  applicationCategory: "BusinessApplication",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Campagnes Email IA",
                  description:
                    "Créez des campagnes email performantes avec automation avancée",
                  applicationCategory: "BusinessApplication",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Transcription Audio/Vidéo",
                  description:
                    "Convertissez vos fichiers audio et vidéo en texte avec précision",
                  applicationCategory: "BusinessApplication",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Générateur de Documents",
                  description:
                    "Créez des documents professionnels automatiquement (PDF, DOCX)",
                  applicationCategory: "BusinessApplication",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Talent Analyzer",
                  description:
                    "IA RH pour screening de CV et matching candidat-poste",
                  applicationCategory: "BusinessApplication",
                },
              ],
            },
          }),
        }}
      />
      <CatalogSection />
    </>
  );
}
