import type { Article, Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "politics", name: "Politics", nameTelugu: "రాజకీయాలు", slug: "politics", articleCount: 24, color: "#C9A84C" },
  { id: "community", name: "Community", nameTelugu: "సమాజం", slug: "community", articleCount: 18, color: "#4A90D9" },
  { id: "culture", name: "Culture", nameTelugu: "సంస్కృతి", slug: "culture", articleCount: 15, color: "#D94A6B" },
  { id: "business", name: "Business", nameTelugu: "వ్యాపారం", slug: "business", articleCount: 12, color: "#4AD98B" },
  { id: "education", name: "Education", nameTelugu: "విద్య", slug: "education", articleCount: 10, color: "#9B59B6" },
  { id: "sports", name: "Sports", nameTelugu: "క్రీడలు", slug: "sports", articleCount: 8, color: "#E67E22" },
];

const IMG = [
  "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
  "https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=800&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
  "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80",
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
  "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=800&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
];

function makeArticle(i: number, o: Partial<Article>): Article {
  return {
    id: String(i), title: "", slug: "", excerpt: "", content: "",
    category: "community", author: { name: "Editor", role: "Staff" },
    imageUrl: IMG[i - 1] || IMG[0], tags: [], isFeatured: false,
    isBreaking: false, isPublished: true, viewCount: 0, readingTime: 4,
    createdAt: "2026-05-15T06:00:00Z", updatedAt: "2026-05-15T06:00:00Z", ...o,
  };
}

export const MOCK_ARTICLES: Article[] = [
  makeArticle(1, {
    title: "Community Leaders Unite for Education Initiative",
    titleTelugu: "విద్యా కార్యక్రమం కోసం సమాజ నాయకులు ఏకమయ్యారు",
    slug: "community-leaders-education-initiative",
    excerpt: "Prominent community leaders from across Andhra Pradesh and Telangana have come together to launch a landmark education initiative aimed at empowering the next generation.",
    excerptTelugu: "ఆంధ్రప్రదేశ్ మరియు తెలంగాణ నుండి ప్రముఖ సమాజ నాయకులు తదుపరి తరాన్ని సాధికారత కల్పించే విద్యా కార్యక్రమాన్ని ప్రారంభించారు.",
    category: "community", categoryTelugu: "సమాజం",
    author: { name: "Rajesh Kumar", role: "Senior Editor" },
    isFeatured: true, viewCount: 12500, readingTime: 5,
  }),
  makeArticle(2, {
    title: "Annual Cultural Festival Celebrates Heritage",
    titleTelugu: "వార్షిక సాంస్కృతిక ఉత్సవం వారసత్వాన్ని జరుపుకుంటోంది",
    slug: "annual-cultural-festival",
    excerpt: "The grand cultural festival showcasing traditional arts, dance, and music draws thousands of attendees celebrating rich Telugu heritage.",
    excerptTelugu: "సాంప్రదాయ కళలు, నృత్యం మరియు సంగీతాన్ని ప్రదర్శించే ఈ సాంస్కృతిక ఉత్సవం వేలాది మందిని ఆకర్షిస్తోంది.",
    category: "culture", categoryTelugu: "సంస్కృతి",
    author: { name: "Priya Reddy", role: "Culture Correspondent" },
    isFeatured: true, viewCount: 8900,
  }),
  makeArticle(3, {
    title: "New Business Hub Inaugurated in Vijayawada",
    titleTelugu: "విజయవాడలో కొత్త వ్యాపార కేంద్రం ప్రారంభం",
    slug: "business-hub-vijayawada",
    excerpt: "A state-of-the-art business incubation center has been inaugurated in Vijayawada, set to boost entrepreneurship and create thousands of jobs.",
    excerptTelugu: "విజయవాడలో అత్యాధునిక వ్యాపార ఇంక్యుబేషన్ కేంద్రం ప్రారంభించబడింది.",
    category: "business", categoryTelugu: "వ్యాపారం",
    author: { name: "Suresh Naidu", role: "Business Editor" },
    isBreaking: true, viewCount: 6700, readingTime: 3,
  }),
  makeArticle(4, {
    title: "Political Rally Draws Massive Crowd in Hyderabad",
    titleTelugu: "హైదరాబాద్‌లో రాజకీయ ర్యాలీకి భారీ జనసమూహం",
    slug: "political-rally-hyderabad",
    excerpt: "A major political gathering in Hyderabad draws unprecedented crowds as leaders address pressing community issues.",
    excerptTelugu: "హైదరాబాద్‌లో రాజకీయ సమావేశం అపూర్వ జనసమూహాన్ని ఆకర్షించింది.",
    category: "politics", categoryTelugu: "రాజకీయాలు",
    author: { name: "Venkat Rao", role: "Political Analyst" },
    isBreaking: true, viewCount: 15200, readingTime: 6,
  }),
  makeArticle(5, {
    title: "Youth Sports Championship Results Announced",
    titleTelugu: "యువ క్రీడా ఛాంపియన్‌షిప్ ఫలితాలు ప్రకటించారు",
    slug: "youth-sports-championship",
    excerpt: "Talented young athletes shine at the annual youth sports championship with record-breaking performances.",
    excerptTelugu: "ప్రతిభావంతులైన యువ క్రీడాకారులు రికార్డులు బ్రేక్ చేస్తూ ప్రకాశించారు.",
    category: "sports", categoryTelugu: "క్రీడలు",
    author: { name: "Lakshmi Devi", role: "Sports Reporter" },
    viewCount: 4300, readingTime: 3,
  }),
  makeArticle(6, {
    title: "Scholarship Program Benefits Thousands of Students",
    titleTelugu: "స్కాలర్‌షిప్ కార్యక్రమం వేలాది విద్యార్థులకు ప్రయోజనం",
    slug: "scholarship-program-students",
    excerpt: "A comprehensive scholarship program providing financial support to thousands of deserving students across the states.",
    excerptTelugu: "వేలాది విద్యార్థులకు ఆర్థిక సహాయం అందించే స్కాలర్‌షిప్ కార్యక్రమం ప్రారంభించబడింది.",
    category: "education", categoryTelugu: "విద్య",
    author: { name: "Anitha Sharma", role: "Education Writer" },
    viewCount: 7800,
  }),
  makeArticle(7, {
    title: "Heritage Temple Restoration Project Completed",
    titleTelugu: "వారసత్వ ఆలయ పునరుద్ధరణ ప్రాజెక్ట్ పూర్తి",
    slug: "heritage-temple-restoration",
    excerpt: "A two-year restoration project of a historic temple completed, preserving centuries-old architectural marvels.",
    excerptTelugu: "చారిత్రాత్మక ఆలయం యొక్క రెండేళ్ల పునరుద్ధరణ ప్రాజెక్ట్ పూర్తయింది.",
    category: "culture", categoryTelugu: "సంస్కృతి",
    author: { name: "Ravi Teja", role: "Heritage Correspondent" },
    viewCount: 5400, readingTime: 5,
  }),
  makeArticle(8, {
    title: "Tech Entrepreneurs Launch Innovation Lab",
    titleTelugu: "టెక్ వ్యాపారవేత్తలు ఇన్నోవేషన్ ల్యాబ్ ప్రారంభం",
    slug: "tech-entrepreneurs-innovation-lab",
    excerpt: "Successful tech entrepreneurs launch a collaborative innovation lab to mentor startups and drive advancement.",
    excerptTelugu: "టెక్ వ్యాపారవేత్తలు స్టార్టప్‌లకు మార్గదర్శనం చేయడానికి ఇన్నోవేషన్ ల్యాబ్‌ను ప్రారంభించారు.",
    category: "business", categoryTelugu: "వ్యాపారం",
    author: { name: "Kiran Patel", role: "Tech Editor" },
    viewCount: 3200,
  }),
  makeArticle(9, {
    title: "Women Empowerment Summit Held in Guntur",
    titleTelugu: "గుంటూరులో మహిళా సాధికారత సదస్సు",
    slug: "women-empowerment-summit-guntur",
    excerpt: "Annual women empowerment summit brings together leaders and entrepreneurs to discuss gender equality strategies.",
    excerptTelugu: "వార్షిక మహిళా సాధికారత సదస్సు నాయకులను ఏకం చేసింది.",
    category: "community", categoryTelugu: "సమాజం",
    author: { name: "Meena Kumari", role: "Community Reporter" },
    viewCount: 6100, readingTime: 5,
  }),
  makeArticle(10, {
    title: "State Government Announces Policy Reforms",
    titleTelugu: "రాష్ట్ర ప్రభుత్వం విధాన సంస్కరణలు ప్రకటించింది",
    slug: "state-government-policy-reforms",
    excerpt: "Sweeping policy reforms announced to improve infrastructure, healthcare, and education across all districts.",
    excerptTelugu: "మౌలిక సదుపాయాలు, ఆరోగ్యం మరియు విద్యను మెరుగుపరచే సంస్కరణలు ప్రకటించబడ్డాయి.",
    category: "politics", categoryTelugu: "రాజకీయాలు",
    author: { name: "Rajesh Kumar", role: "Senior Editor" },
    viewCount: 9200, readingTime: 7,
  }),
];

export const BREAKING_NEWS = [
  { id: "b1", text: "Community Leaders Unite for Landmark Education Initiative Across AP & Telangana", textTelugu: "AP & తెలంగాణలో విద్యా కార్యక్రమం కోసం సమాజ నాయకులు ఏకమయ్యారు" },
  { id: "b2", text: "New Business Hub Inaugurated in Vijayawada — Expected to Create 5000+ Jobs", textTelugu: "విజయవాడలో కొత్త వ్యాపార కేంద్రం — 5000+ ఉద్యోగాలు" },
  { id: "b3", text: "Political Rally in Hyderabad Draws Record Attendance of Over 1 Lakh People", textTelugu: "హైదరాబాద్ ర్యాలీకి 1 లక్ష మందికి పైగా హాజరు" },
  { id: "b4", text: "State Government Announces Major Policy Reforms for Healthcare and Education", textTelugu: "ఆరోగ్యం మరియు విద్య కోసం ప్రధాన విధాన సంస్కరణలు ప్రకటించబడ్డాయి" },
];
