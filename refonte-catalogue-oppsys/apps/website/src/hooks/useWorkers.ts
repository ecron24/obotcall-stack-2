/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import {
  PenTool,
  Share2,
  Mic,
  FileText,
  Mail,
  Users,
  Zap,
  Target,
} from "lucide-react";

interface Worker {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: any;
  color: string;
  timeToComplete: string;
  time_to_complete?: string;
  rating: number;
  difficulty: string;
  popular: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: any;
  count: number;
}

interface UseWorkersResult {
  workers: Worker[];
  categories: Category[];
  filteredWorkers: Worker[];
  loading: boolean;
  error: string | null;
  stats: {
    totalWorkers: number;
    popularWorkers: number;
    totalCategories: number;
    averageRating: number;
  };
  selectedCategory: string;
  searchQuery: string;
  sortBy: string;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  resetFilters: () => void;
}

// ✅ MODULES RÉELS DISPONIBLES (6)
const STATIC_WORKERS: Worker[] = [
  {
    id: "social-factory",
    name: "Générateur Post Multi-Réseaux",
    description:
      "Créez des posts engageants pour tous vos réseaux sociaux avec l'IA. Optimisé pour Facebook, Instagram, LinkedIn et X (Twitter).",
    category: "marketing",
    tags: [
      "réseaux sociaux",
      "content marketing",
      "automation",
      "multi-plateformes",
      "facebook",
      "instagram",
      "linkedin",
      "twitter",
    ],
    icon: Share2,
    color: "bg-blue-500 text-white",
    timeToComplete: "2-5 min",
    difficulty: "Facile",
    rating: 4.8,
    popular: true,
  },
  {
    id: "article-writer",
    name: "Rédacteur IA",
    description:
      "Rédigez des articles de blog optimisés SEO avec une structure professionnelle et un contenu de qualité. Parfait pour votre stratégie de content marketing.",
    category: "content",
    tags: [
      "blog",
      "seo",
      "rédaction",
      "contenu",
      "article",
      "marketing de contenu",
    ],
    icon: PenTool,
    color: "bg-green-500 text-white",
    timeToComplete: "5-10 min",
    difficulty: "Facile",
    rating: 4.7,
    popular: true,
  },
  {
    id: "email-campaign",
    name: "Campagnes Email IA",
    description:
      "Créez des campagnes email performantes et personnalisées avec notre assistant IA conversationnel. Automation avancée et A/B testing intégrés.",
    category: "marketing",
    tags: [
      "email",
      "marketing",
      "campagne",
      "automation",
      "newsletter",
      "a/b testing",
      "personnalisation",
    ],
    icon: Mail,
    color: "bg-red-500 text-white",
    timeToComplete: "5-8 min",
    difficulty: "Facile",
    rating: 4.6,
    popular: true,
  },
  {
    id: "audio-transcription",
    name: "Transcription Audio/Vidéo",
    description:
      "Convertissez vos fichiers audio et vidéo en texte avec une précision exceptionnelle. Idéal pour podcasts, interviews, webinaires et cours.",
    category: "productivity",
    tags: [
      "audio",
      "transcription",
      "vidéo",
      "sous-titres",
      "podcast",
      "interview",
    ],
    icon: Mic,
    color: "bg-purple-500 text-white",
    timeToComplete: "1-15 min",
    difficulty: "Facile",
    rating: 4.5,
    popular: false,
  },
  {
    id: "document-generator",
    name: "Générateur de Documents",
    description:
      "Créez des documents professionnels (PDF, DOCX, ODT) automatiquement à partir de templates personnalisables. Gagnez du temps sur vos tâches administratives.",
    category: "productivity",
    tags: [
      "documents",
      "pdf",
      "templates",
      "automatisation",
      "administratif",
      "docx",
    ],
    icon: FileText,
    color: "bg-indigo-500 text-white",
    timeToComplete: "3-7 min",
    difficulty: "Intermédiaire",
    rating: 4.4,
    popular: false,
  },
  {
    id: "talent-analyzer",
    name: "Talent Analyzer",
    description:
      "Analysez les talents avec notre IA RH conversationnelle : screening de CV, matching candidat-poste, et évaluation prédictive des compétences.",
    category: "hr",
    tags: [
      "rh",
      "recrutement",
      "talents",
      "cv",
      "matching",
      "prédictif",
      "screening",
      "ressources humaines",
    ],
    icon: Users,
    color: "bg-indigo-600 text-white",
    timeToComplete: "5-15 min",
    difficulty: "Intermédiaire",
    rating: 4.7,
    popular: true,
  },
];

// ✅ CATÉGORIES ADAPTÉES AUX 6 MODULES
const STATIC_CATEGORIES: Category[] = [
  {
    id: "all",
    name: "Tous les outils",
    icon: Zap,
    count: STATIC_WORKERS.length,
  },
  {
    id: "marketing",
    name: "Marketing & Communication",
    icon: Target,
    count: STATIC_WORKERS.filter((w) => w.category === "marketing").length,
  },
  {
    id: "content",
    name: "Création de contenu",
    icon: PenTool,
    count: STATIC_WORKERS.filter((w) => w.category === "content").length,
  },
  {
    id: "productivity",
    name: "Productivité & Documents",
    icon: FileText,
    count: STATIC_WORKERS.filter((w) => w.category === "productivity").length,
  },
  {
    id: "hr",
    name: "Ressources Humaines",
    icon: Users,
    count: STATIC_WORKERS.filter((w) => w.category === "hr").length,
  },
];

export function useWorkers(): UseWorkersResult {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");

  // Filtrage et tri
  const filteredWorkers = useMemo(() => {
    let filtered = STATIC_WORKERS;

    // Filtrage par catégorie
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (worker: Worker) => worker.category === selectedCategory
      );
    }

    // Filtrage par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (worker: Worker) =>
          worker.name.toLowerCase().includes(query) ||
          worker.description.toLowerCase().includes(query) ||
          worker.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Tri
    filtered.sort((a: Worker, b: Worker) => {
      switch (sortBy) {
        case "popular":
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return b.rating - a.rating;
        case "rating":
          return b.rating - a.rating;
        case "name":
          return a.name.localeCompare(b.name);
        case "time":
          const aTime = parseInt(a.timeToComplete.match(/\d+/)?.[0] || "0");
          const bTime = parseInt(b.timeToComplete.match(/\d+/)?.[0] || "0");
          return aTime - bTime;
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    return {
      totalWorkers: STATIC_WORKERS.length,
      popularWorkers: STATIC_WORKERS.filter((w) => w.popular).length,
      totalCategories: STATIC_CATEGORIES.filter((c) => c.id !== "all").length,
      averageRating:
        STATIC_WORKERS.reduce((sum, w) => sum + w.rating, 0) /
        STATIC_WORKERS.length,
    };
  }, []);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("popular");
  };

  return {
    workers: STATIC_WORKERS,
    categories: STATIC_CATEGORIES,
    filteredWorkers,
    loading: false,
    error: null,
    stats,
    selectedCategory,
    searchQuery,
    sortBy,
    setSelectedCategory,
    setSearchQuery,
    setSortBy,
    resetFilters,
  };
}
