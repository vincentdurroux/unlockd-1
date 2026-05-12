import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Logo } from './components/Logo';
import { 
  Home, 
  Search, 
  Calendar, 
  BookOpen, 
  User, 
  Plus, 
  MapPin, 
  Star, 
  CheckCircle2, 
  MessageCircle,
  Instagram,
  Link,
  Award, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Globe,
  ArrowLeft,
  Filter,
  Languages,
  ArrowRight,
  Clock,
  Euro,
  Share2,
  Heart,
  Bell,
  Lock,
  CreditCard,
  Gift,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  ShoppingBag,
  Tag,
  Camera,
  RotateCcw,
  Loader2,
  X,
  Mail,
  Phone,
  Rocket,
  FileText,
  Users,
  HeartPulse,
  Briefcase,
  Lightbulb,
  Sparkles,
  Trophy,
  Palmtree,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Send,
  Car,
  Smartphone,
  Shirt,
  Gamepad,
  Coffee,
  Building2,
  Fuel,
  Umbrella,
  Monitor,
  Armchair,
  Bike,
  MessageSquare,
  ShieldCheck,
  Check,
  MoreHorizontal
} from 'lucide-react';
import { storageService } from './lib/storage';
import { marketplaceService, Ad } from './services/marketplaceService';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useProfessionals } from './hooks/useProfessionals';
import { proService } from './services/proService';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatRelativeTime(dateString: string | undefined) {
  if (!dateString) return '';
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'just now';
    if (diffInSeconds < 60) return 'just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  } catch (e) {
    return '';
  }
}

// --- Types ---

type View = 'home' | 'explore' | 'events' | 'guides' | 'profile' | 'community' | 'marketplace' | 'community-thread' | 'messages' | 'admin';

interface Professional {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  languages: string[];
  image: string;
  verified: boolean;
  services: { name: string; price: number; description: string }[];
  bio: string;
  testimonials: { author: string; avatar: string; text: string; rating: number; date: string }[];
  phone?: string;
  email?: string;
  website?: string;
  experience?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  attendees: number;
}

interface GuideStep {
  id: string;
  title: string;
  description: string;
  pros: string[]; // Professional IDs
}

interface Classified {
  id: string;
  title: string;
  price: string;
  category: string;
  image: string;
  condition?: string;
  location?: string;
}

// --- Mock Data ---

const MOCK_PROS: Professional[] = [
  {
    id: '1',
    name: 'Carlos Rodriguez',
    category: 'Plumber',
    rating: 4.9,
    reviews: 124,
    languages: ['Spanish', 'English'],
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200',
    verified: true,
    bio: 'Certified plumber with 15 years of experience in both residential and industrial installations. Specialized in modern water systems and emergency leak control. Known for punctuality and clean work.',
    phone: '+34 612 345 678',
    email: 'carlos.plumbing@example.com',
    experience: '15 years',
    location: 'Calle de la Paz, 4, 46003 Valencia',
    coordinates: { lat: 39.4614, lng: -0.3756 },
    services: [
      { name: 'Emergency Leak Repair', price: 60, description: 'Fast response for urgent leaks.' },
      { name: 'Installation', price: 120, description: 'New faucet or toilet installation.' }
    ],
    testimonials: [
      { author: 'Thomas', avatar: 'https://i.pravatar.cc/150?u=thomas', text: 'Carlos saved my kitchen! Very professional and explained everything clearly.', rating: 5, date: '2 weeks ago' },
      { author: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah', text: 'Fast and clean work. Best plumber I found in Valencia so far.', rating: 4, date: '1 month ago' }
    ]
  },
  {
    id: '2',
    name: 'Elena Martinez',
    category: 'Lawyer',
    rating: 5.0,
    reviews: 89,
    languages: ['Spanish', 'English', 'French'],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
    verified: true,
    bio: 'Specializing in immigration law and relocation services. I have helped over 500 expats obtain their NIE and TIE. My goal is to make your transition to Spain as smooth as possible through clear legal guidance.',
    phone: '+34 698 765 432',
    email: 'elena.law@example.com',
    experience: '8 years',
    location: 'Plaça de l\'Ajuntament, 1, 46002 Valencia',
    coordinates: { lat: 39.4746, lng: -0.3768 },
    services: [
      { name: 'NIE Application', price: 150, description: 'Full assistance with NIE paperwork.' },
      { name: 'Rental Contract Review', price: 80, description: 'Legal review of your lease.' }
    ],
    testimonials: [
      { author: 'Marie', avatar: 'https://i.pravatar.cc/150?u=marie', text: 'Elena made my residency process stress-free. Highly recommended for any expat!', rating: 5, date: '3 days ago' }
    ]
  },
  {
    id: '3',
    name: 'David Wilson',
    category: 'Translator',
    rating: 4.8,
    reviews: 56,
    languages: ['English', 'Spanish', 'German'],
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200',
    verified: true,
    bio: 'Professional sworn translator for English and German. Fast turnaround for official documents, business proposals, and website localization. Member of the Valencia Translators Association.',
    phone: '+34 654 321 098',
    email: 'david.trans@example.com',
    experience: '10 years',
    location: 'Carrer de la Guàrdia Civil, 22, 46020 Valencia',
    coordinates: { lat: 39.4824, lng: -0.3544 },
    services: [
      { name: 'Official Translation', price: 40, description: 'Per page official document translation.' }
    ],
    testimonials: [
      { author: 'Lukas', avatar: 'https://i.pravatar.cc/150?u=lukas', text: 'Perfect translations, accepted by all official offices without issue.', rating: 5, date: '2 months ago' }
    ]
  },
  {
    id: '4',
    name: 'Sophie Dubois',
    category: 'Real Estate',
    rating: 4.7,
    reviews: 42,
    languages: ['French', 'English', 'Spanish'],
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200&h=200',
    verified: true,
    bio: 'Dedicated real estate agent focusing on the expat market. I find the best apartments before they even hit the main websites. I also provide full relocation support including school hunting for families.',
    phone: '+34 677 888 999',
    email: 'sophie.realty@example.com',
    experience: '6 years',
    location: 'Carrer de Quart, 15, 46001 Valencia',
    coordinates: { lat: 39.4776, lng: -0.3792 },
    services: [
      { name: 'Apartment Hunting', price: 200, description: 'Personalized search for your next home.' },
      { name: 'Relocation Package', price: 500, description: 'Full support for moving to Valencia.' }
    ],
    testimonials: [
      { author: 'Julie', avatar: 'https://i.pravatar.cc/150?u=julie', text: 'Sophie found us the perfect flat in El Carmen in less than a week!', rating: 5, date: '1 week ago' }
    ]
  },
  {
    id: '5',
    name: 'Marco Rossi',
    category: 'Handyman',
    rating: 4.9,
    reviews: 78,
    languages: ['Italian', 'Spanish', 'English'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    verified: true,
    bio: 'Professional handyman with a passion for fixing things. I can help with anything from furniture assembly to general home maintenance. Reliable, efficient, and always with a smile.',
    location: 'Carrer del Dr. Manuel Candela, 45, 46021 Valencia',
    coordinates: { lat: 39.4754, lng: -0.3478 },
    services: [
      { name: 'Furniture Assembly', price: 50, description: 'Quick assembly of IKEA or other furniture.' },
      { name: 'General Maintenance', price: 40, description: 'Fixing small things around the house.' }
    ],
    testimonials: [
      { author: 'Luca', avatar: 'https://i.pravatar.cc/150?u=luca', text: 'Marco is a wizard! Fixed my door and my sink in no time.', rating: 5, date: '4 days ago' }
    ]
  },
  {
    id: '6',
    name: 'Anna Schmidt',
    category: 'Accountant',
    rating: 4.9,
    reviews: 34,
    languages: ['German', 'English', 'Spanish'],
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0ad2f01?auto=format&fit=crop&q=80&w=200&h=200',
    verified: true,
    bio: 'Tax consultant with extensive knowledge of the Spanish legal system. I specialize in helping digital nomads and expats optimize their taxes and set up their businesses in Valencia.',
    location: 'Gran Via de les Germanies, 12, 46006 Valencia',
    coordinates: { lat: 39.4674, lng: -0.3664 },
    services: [
      { name: 'Tax Advice', price: 120, description: 'Expert advice for expats and digital nomads.' },
      { name: 'Business Setup', price: 300, description: 'Help with starting your company in Spain.' }
    ],
    testimonials: [
      { author: 'Emma', avatar: 'https://i.pravatar.cc/150?u=emma', text: 'Anna explained the Spanish tax system so clearly. A life-saver!', rating: 5, date: '1 week ago' }
    ]
  },
  {
    id: '7',
    name: 'Dr. Sarah Taylor',
    category: 'Dentist',
    rating: 4.9,
    reviews: 65,
    languages: ['English', 'Spanish'],
    image: 'https://images.unsplash.com/photo-1559839734-2b71f1e59816?auto=format&fit=crop&q=80&w=200&h=200',
    verified: true,
    bio: 'International dentist specializing in cosmetic dentistry and preventive care. Providing high-quality care in a modern, expat-friendly environment.',
    location: 'Gran Via, Valencia',
    coordinates: { lat: 39.4684, lng: -0.3644 },
    services: [
      { name: 'Teeth Cleaning', price: 60, description: 'Professional cleaning and checkup.' },
      { name: 'Emergency Appointment', price: 80, description: 'Same-day urgent dental care.' }
    ],
    testimonials: [
      { author: 'Chris', avatar: 'https://i.pravatar.cc/150?u=12', text: 'Best dental experience in years. Very clean and professional.', rating: 5, date: '3 weeks ago' }
    ]
  },
  {
    id: '8',
    name: 'Lucas Dupont',
    category: 'Electrician',
    rating: 4.8,
    reviews: 47,
    languages: ['French', 'Spanish', 'English'],
    image: 'https://images.unsplash.com/photo-1590650046871-92c887180603?auto=format&fit=crop&q=80&w=200&h=200',
    verified: true,
    bio: 'Certified electrician for all your home power needs. From fixing sockets to complete rewiring projects and smart home installations.',
    location: 'Cabanyal, Valencia',
    coordinates: { lat: 39.4682, lng: -0.3238 },
    services: [
      { name: 'Socket Repair', price: 40, description: 'Fixing faulty electrical outlets.' },
      { name: 'Electrical Audit', price: 100, description: 'Full home safety inspection.' }
    ],
    testimonials: [
      { author: 'Pierre', avatar: 'https://i.pravatar.cc/150?u=22', text: 'Very efficient and honest. Explained the issue clearly.', rating: 5, date: '1 month ago' }
    ]
  }
];

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'International Networking Valencia',
    date: 'Mar 15',
    time: '19:00',
    location: 'Ruzafa Hub',
    category: 'Networking',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400&h=200',
    attendees: 45
  },
  {
    id: '2',
    title: 'Paella Cooking Class',
    date: 'Mar 18',
    time: '11:00',
    location: 'Central Market',
    category: 'Cultural',
    image: 'https://images.unsplash.com/photo-1534080564607-317f53f89998?auto=format&fit=crop&q=80&w=400&h=200',
    attendees: 12
  }
];

interface GuideArticle {
  id: string;
  title: string;
  excerpt: string;
  readTime: string;
  tag?: string;
}

interface GuideCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  articles: GuideArticle[];
}

// --- Custom Multi-color Icons for Guides ---

const RocketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="#EF4444" stroke="#EF4444" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="#FBBF24" stroke="#F59E0B" />
    <circle cx="15" cy="9" r="1" fill="white" />
  </svg>
);

const PaperworkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M4 4h16v16H4z" fill="#3B82F6" stroke="#2563EB" />
    <path d="M8 8h8" stroke="white" />
    <path d="M8 12h8" stroke="white" />
    <path d="M8 16h5" stroke="white" />
    <path d="M18 4v4h-4" fill="#60A5FA" stroke="#2563EB" />
  </svg>
);

const FamilyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <circle cx="9" cy="7" r="4" fill="#EC4899" stroke="#DB2777" />
    <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="#EC4899" stroke="#DB2777" />
    <circle cx="17" cy="8" r="3" fill="#8B5CF6" stroke="#7C3AED" />
    <path d="M13 21v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" fill="#8B5CF6" stroke="#7C3AED" />
  </svg>
);

const HealthIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="#F472B6" stroke="#E11D48" />
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" stroke="#E11D48" strokeWidth="1.5" />
  </svg>
);

const WorkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" fill="#6366F1" stroke="#4F46E5" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="#F59E0B" />
    <path d="M2 12h20" stroke="#4F46E5" />
    <circle cx="12" cy="14" r="1" fill="#FBBF24" />
  </svg>
);

const TipsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M9 18h6" stroke="#F59E0B" />
    <path d="M10 22h4" stroke="#F59E0B" />
    <path d="M15.09 14c.18-.98.37-1.74.37-2.5a3.5 3.5 0 0 0-7 0c0 .76.19 1.52.37 2.5H15.09Z" fill="#FDE047" stroke="#F59E0B" />
    <path d="M12 2v1" stroke="#F59E0B" />
    <path d="M5 5l1 1" stroke="#F59E0B" />
    <path d="M2 12h1" stroke="#F59E0B" />
    <path d="M19 5l-1 1" stroke="#F59E0B" />
    <path d="M22 12h-1" stroke="#F59E0B" />
  </svg>
);

const CityFunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M6 3h12l-6 9Z" fill="#F97316" stroke="#EA580C" />
    <path d="M12 12v8" stroke="#94A3B8" />
    <path d="M9 21h6" stroke="#94A3B8" />
    <circle cx="18" cy="5" r="3" fill="#FBBF24" stroke="#F59E0B" />
    <path d="M18 13v6" stroke="#EC4899" />
    <circle cx="16" cy="19" r="2" fill="#EC4899" stroke="#DB2777" />
    <path d="M18 13l3-1" stroke="#EC4899" />
  </svg>
);

const MOCK_GUIDE_CATEGORIES: GuideCategory[] = [
  { 
    id: 'getting-started', 
    title: 'Getting Started', 
    description: 'First steps for your arrival in Valencia.', 
    icon: RocketIcon,
    color: 'bg-orange-500',
    articles: [
      { id: 'gs-1', title: 'Top 10 Neighborhoods for Expats', excerpt: 'From the trendy Ruzafa to the family-friendly El Carmen.', readTime: '5 min', tag: 'Housing' },
      { id: 'gs-2', title: 'Arrival Checklist: First 48 Hours', excerpt: 'SIM cards, transport cards, and essential apps.', readTime: '3 min', tag: 'Essentials' },
      { id: 'gs-3', title: 'How to use the Metro & Valenbisi', excerpt: 'Navigating the city like a local.', readTime: '4 min', tag: 'Transport' }
    ]
  },
  { 
    id: 'paperwork', 
    title: 'Paperwork Survival', 
    description: 'NIE, Empadronamiento, and legal essentials.', 
    icon: PaperworkIcon,
    color: 'bg-blue-500',
    articles: [
      { id: 'pw-1', title: 'The Ultimate NIE Guide 2024', excerpt: 'How to get your appointment without losing your mind.', readTime: '8 min', tag: 'Legal' },
      { id: 'pw-2', title: 'Empadronamiento Explained', excerpt: 'Why you need it and how to register at the Ayuntamiento.', readTime: '4 min', tag: 'Legal' },
      { id: 'pw-3', title: 'Digital Certificate: Your Best Friend', excerpt: 'How to do all your paperwork online from home.', readTime: '6 min', tag: 'Tech' }
    ]
  },
  { 
    id: 'family', 
    title: 'Family Life', 
    description: 'Schools, activities, and family services.', 
    icon: FamilyIcon,
    color: 'bg-pink-500',
    articles: [
      { id: 'fm-1', title: 'Public vs. Concertado vs. Private Schools', excerpt: 'Understanding the Spanish education system.', readTime: '10 min', tag: 'Education' },
      { id: 'fm-2', title: 'Best Parks & Playgrounds in Valencia', excerpt: 'Where to take the kids on a sunny afternoon.', readTime: '5 min', tag: 'Leisure' },
      { id: 'fm-3', title: 'Finding a Reliable Nanny or Babysitter', excerpt: 'Trusted services and community recommendations.', readTime: '4 min', tag: 'Services' }
    ]
  },
  { 
    id: 'health', 
    title: 'Stay Healthy', 
    description: 'Doctors, hospitals, and wellness tips.', 
    icon: HealthIcon,
    color: 'bg-emerald-500',
    articles: [
      { id: 'hl-1', title: 'How to Register for Public Healthcare', excerpt: 'Getting your SIP card as an expat.', readTime: '5 min', tag: 'Health' },
      { id: 'hl-2', title: 'Best English-Speaking Doctors', excerpt: 'A curated list of trusted medical professionals.', readTime: '3 min', tag: 'Directory' },
      { id: 'hl-3', title: 'Pharmacies in Valencia: What to Know', excerpt: 'Opening hours, prescriptions, and over-the-counter meds.', readTime: '3 min', tag: 'Essentials' }
    ]
  },
  { 
    id: 'work', 
    title: 'Work Stuff', 
    description: 'Job search, co-working, and business.', 
    icon: WorkIcon,
    color: 'bg-indigo-500',
    articles: [
      { id: 'wk-1', title: 'Becoming Autonomo in Spain', excerpt: 'A step-by-step guide for freelancers.', readTime: '12 min', tag: 'Business' },
      { id: 'wk-2', title: 'Top Co-working Spaces in Valencia', excerpt: 'Where to find the best community and coffee.', readTime: '5 min', tag: 'Remote Work' },
      { id: 'wk-3', title: 'The Digital Nomad Visa Guide', excerpt: 'Requirements and application process.', readTime: '9 min', tag: 'Legal' }
    ]
  },
  { 
    id: 'daily-tips', 
    title: 'Daily Life Tips', 
    description: 'Transport, shopping, and local habits.', 
    icon: TipsIcon,
    color: 'bg-amber-500',
    articles: [
      { id: 'dt-1', title: 'Supermarket Comparison', excerpt: 'Mercadona vs. Consum vs. Lidl: Where to shop.', readTime: '6 min', tag: 'Shopping' },
      { id: 'dt-2', title: 'Understanding the Siesta Culture', excerpt: 'When things open, close, and when to eat.', readTime: '4 min', tag: 'Habits' },
      { id: 'dt-3', title: 'Learning Spanish in Valencia', excerpt: 'Best schools and language exchange meetups.', readTime: '5 min', tag: 'Language' }
    ]
  },
  { 
    id: 'city-fun', 
    title: 'City Fun', 
    description: 'Best spots, events, and leisure.', 
    icon: CityFunIcon,
    color: 'bg-cyan-500',
    articles: [
      { id: 'cf-1', title: 'The Ultimate Fallas Guide', excerpt: 'How to survive and enjoy the biggest festival.', readTime: '7 min', tag: 'Events' },
      { id: 'cf-2', title: 'Hidden Gems: Secret Spots in the Turia', excerpt: 'Escape the crowds in the city\'s green lung.', readTime: '5 min', tag: 'Nature' },
      { id: 'cf-3', title: 'Best Tapas Bars in the Old Town', excerpt: 'Authentic flavors away from the tourist traps.', readTime: '6 min', tag: 'Food' }
    ]
  }
];

const MOCK_GUIDE: GuideStep[] = [
  { id: '1', title: 'Get your NIE', description: 'The essential ID number for living in Spain.', pros: ['2'] },
  { id: '2', title: 'Open a Bank Account', description: 'Necessary for utilities and rent.', pros: ['2'] },
  { id: '3', title: 'Empadronamiento', description: 'Registering at the town hall.', pros: [] },
  { id: '4', title: 'Health Insurance', description: 'Private or public health coverage.', pros: ['2'] }
];

const MOCK_FEED = [
  {
    id: '1',
    user: 'Sarah J.',
    content: 'Just used Elena Martinez for my NIE. She was amazing! Highly recommend if you are struggling with the appointments.',
    proId: '2',
    likes: 12,
    comments: 3,
    time: '2h ago'
  },
  {
    id: '2',
    user: 'Marc L.',
    content: 'Does anyone know a good gym in Ruzafa that is international friendly?',
    likes: 5,
    comments: 8,
    time: '5h ago'
  },
  {
    id: '3',
    user: 'Julian R.',
    content: 'The new bakery on Calle de la Paz is incredible. Best croissants in Valencia!',
    likes: 24,
    comments: 5,
    time: '1h ago'
  },
  {
    id: '4',
    user: 'Emma W.',
    content: 'Looking for a Spanish tutor for intensive classes. Any recommendations?',
    likes: 8,
    comments: 12,
    time: '3h ago'
  },
  {
    id: '5',
    user: 'Thomas B.',
    content: 'Valencia is so beautiful in the spring. Love the Turia park right now!',
    likes: 45,
    comments: 2,
    time: '30m ago'
  }
];

const MOCK_CLASSIFIEDS: Classified[] = [
  { 
    id: '1', 
    title: 'Vintage Bicycle', 
    price: '€80', 
    category: 'For Sale', 
    condition: 'Good',
    location: 'Ruzafa',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=200&h=200' 
  },
  { 
    id: '2', 
    title: 'Room in Ruzafa', 
    price: '€450/mo', 
    category: 'Housing', 
    condition: 'N/A',
    location: 'Ruzafa',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=200&h=200' 
  },
  { 
    id: '3', 
    title: 'Office Chair', 
    price: '€15', 
    category: 'For Sale', 
    condition: 'Like New',
    location: 'El Carmen',
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=200&h=200' 
  },
  { 
    id: '4', 
    title: 'Yoga Classes', 
    price: '€10/h', 
    category: 'Services', 
    condition: 'N/A',
    location: 'Turia Park',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200&h=200' 
  },
];

// --- Components ---

export default function App() {
  const [isStarting, setIsStarting] = useState(true);
  const mainRef = useRef<HTMLElement>(null);
  const [activeView, setActiveView] = useState<View>('home');
  const [initialEventId, setInitialEventId] = useState<string | null>(null);
  const [initialProId, setInitialProId] = useState<string | null>(null);
  const [initialGuideId, setInitialGuideId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{ query: string; location: string; category: string; filters?: any }>({ query: '', location: '', category: 'All' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStarting(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const [showAddPro, setShowAddPro] = useState(false);
  const [showAddAd, setShowAddAd] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | any>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [city, setCity] = useState('Valencia');
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const getNearestMajorCity = async (city: string, region: string, country: string) => {
    try {
      if (!city) return 'Valencia';
      
      const cacheKey = `city_norm_${city}_${region}_${country}`.toLowerCase().replace(/\s+/g, '_');
      const cached = localStorage.getItem(cacheKey);
      if (cached) return cached;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const locationContext = `${city}, ${region}, ${country}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Target: Identify the nearest major metropolitan city for "${locationContext}". 
        Rules: 
        1. Return ONLY the name of the major city.
        2. No punctuation, no sentences.
        3. If the location is already a major city, return its name.
        4. Example: "La Eliana, Valencian Community, Spain" -> "Valencia".`,
      });
      
      const result = response.text?.trim();
      if (result) {
        localStorage.setItem(cacheKey, result);
        return result;
      }
      return city;
    } catch (error) {
      console.error('Error normalizing city:', error);
      return city || 'Valencia';
    }
  };

  const refreshLocation = () => {
    if (!("geolocation" in navigator)) {
      setCity('Valencia');
      return;
    }

    setIsLocating(true);
    const geoOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          
          const rawCity = data.city || data.locality || '';
          const region = data.principalSubdivision || '';
          const country = data.countryName || '';
          
          const majorCity = await getNearestMajorCity(rawCity, region, country);
          setCity(majorCity);
        } catch (error) {
          console.error('Error fetching city:', error);
          setCity('Valencia');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setCity('Valencia');
        setIsLocating(false);
      },
      geoOptions
    );
  };

  useEffect(() => {
    // City is hardcoded to Valencia for now
    setCity('Valencia');
  }, []);

  // Form states for Pro
  const [proName, setProName] = useState('');
  const [proCategory, setProCategory] = useState('');
  const [proEmail, setProEmail] = useState('');
  const [proPhone, setProPhone] = useState('');
  const [proRecommendation, setProRecommendation] = useState('');

  // Form states for Ad
  const [adTitle, setAdTitle] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [adCategory, setAdCategory] = useState('Vehicles');
  const [adCondition, setAdCondition] = useState('Good');
  const [adLocation, setAdLocation] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adHousingType, setAdHousingType] = useState<'Rent' | 'Sale'>('Rent');
  const [adFuelType, setAdFuelType] = useState('Petrol');
  const [adPropertyType, setAdPropertyType] = useState('Apartment');
  const [adContractType, setAdContractType] = useState('Full-time');
  const [adSize, setAdSize] = useState('M');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const data = await marketplaceService.getAds();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const handlePostPro = () => {
    if (!proName || !proCategory) return;
    
    // In a real app, we would send this to a service
    console.log('Posting pro:', { proName, proCategory, proEmail, proPhone, proRecommendation });
    
    // Reset form
    setProName('');
    setProCategory('');
    setProEmail('');
    setProPhone('');
    setProRecommendation('');
    setShowAddPro(false);
    
    alert('Thank you for your recommendation! Our team will review it.');
  };

  const handlePostAd = async () => {
    const isPriceRequired = adCategory !== 'Jobs' && adCategory !== 'Services';
    if (!adTitle || (isPriceRequired && !adPrice)) return;
    
    setIsUploading(true);
    try {
      await marketplaceService.createAd({
        title: adTitle,
        price: adPrice,
        category: adCategory,
        condition: adCondition,
        location: adLocation,
        description: adDescription,
        type: adCategory === 'Real Estate' ? adHousingType : undefined,
        fuel_type: adCategory === 'Vehicles' ? adFuelType : undefined,
        property_type: adCategory === 'Real Estate' ? adPropertyType : undefined,
        contract_type: adCategory === 'Jobs' ? adContractType : undefined,
        size: adCategory === 'Clothing' ? adSize : undefined,
        image_url: uploadedImageUrls[0] || '',
        images: uploadedImageUrls
      });
      
      // Reset form
      setAdTitle('');
      setAdPrice('');
      setAdCategory('Vehicles');
      setAdCondition('Good');
      setAdLocation('');
      setAdDescription('');
      setAdHousingType('Rent');
      setAdFuelType('Petrol');
      setAdPropertyType('Apartment');
      setAdContractType('Full-time');
      setAdSize('M');
      setUploadedImageUrls([]);
      setShowAddAd(false);
      
      // Refresh list
      fetchAds();
    } catch (error) {
      console.error('Error posting ad:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 3 - uploadedImageUrls.length;
    if (remainingSlots <= 0) {
      alert('Maximum 3 photos allowed');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Sanitize filename
        const sanitizedName = file.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9.]/g, '_')
          .replace(/_{2,}/g, '_');

        const fileName = `${Date.now()}-${sanitizedName}`;
        const path = `ads/${fileName}`;
        return await storageService.uploadFile('images', path, file);
      });

      const newUrls = await Promise.all(uploadPromises);
      setUploadedImageUrls(prev => [...prev, ...newUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload one or more images.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Bottom Nav Items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Find Pro', icon: Search },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'guides', label: 'Guides', icon: BookOpen },
    { id: 'marketplace', label: 'Market', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const [direction, setDirection] = useState(0);

  const mainNavIds = navItems.map(item => item.id);

  const handleSearch = (query: string, location: string, category: string, filters?: any) => {
    setSearchParams({ query, location, category, filters });
    // No longer navigating to searchResults view, MarketplaceView will handle it internally
  };

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  };

  const navigateTo = (view: View) => {
    const currentIndex = mainNavIds.indexOf(activeView);
    const newIndex = mainNavIds.indexOf(view);

    if (currentIndex !== -1 && newIndex !== -1) {
      setDirection(newIndex > currentIndex ? 1 : -1);
    } else if (view === 'messages' || view === 'community-thread' || view === 'community') {
      setDirection(1); // Forward to sub-view
    } else if (activeView === 'messages' || activeView === 'community-thread' || activeView === 'community') {
      setDirection(-1); // Back from sub-view
    } else {
      setDirection(0);
    }
    setActiveView(view);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    // Special cases for sub-views
    if (activeView === 'messages' && direction === 'right') {
      navigateTo('explore');
      return;
    }
    if (activeView === 'community-thread' && direction === 'right') {
      navigateTo('community');
      return;
    }

    const currentIndex = mainNavIds.indexOf(activeView);
    if (currentIndex === -1) return;

    if (direction === 'left' && currentIndex < mainNavIds.length - 1) {
      navigateTo(mainNavIds[currentIndex + 1] as View);
    } else if (direction === 'right' && currentIndex > 0) {
      navigateTo(mainNavIds[currentIndex - 1] as View);
    }
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [activeView, selectedAd, selectedPost, initialEventId, initialProId, initialGuideId]);

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-white w-full mx-auto shadow-2xl overflow-hidden relative">
      <AnimatePresence>
        {isStarting && <SplashScreen />}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white px-4 md:px-6 py-2 md:py-3 flex justify-between items-center border-b border-slate-100 flex-shrink-0 z-30">
        <div className="flex flex-col md:flex-row items-center md:items-center gap-0.5 md:gap-6">
          <div 
            onClick={() => navigateTo('home')}
            className="hover:opacity-80 transition-opacity cursor-pointer flex flex-col items-center md:items-start"
          >
            <Logo className="items-center md:items-start" />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowCitySelector(!showCitySelector)}
              className="flex items-center justify-center md:justify-start gap-1.5 md:gap-2 group transition-all"
            >
              <div className={cn(
                "flex items-center justify-center w-3 h-3 md:w-4 md:h-4 rounded-full transition-colors",
                showCitySelector ? "bg-rose-500 shadow-sm" : "bg-rose-50 group-hover:bg-rose-100"
              )}>
                <MapPin className={cn(
                  "w-2 h-2 md:w-2.5 md:h-2.5 transition-colors",
                  showCitySelector ? "text-white" : "text-rose-500"
                )} />
              </div>
              <div className="flex flex-col items-start translate-y-[1px] md:translate-y-0">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.15em] md:tracking-[0.2em]">{city}</span>
              </div>
              <ChevronDown className={cn("w-2.5 h-2.5 md:w-3 md:h-3 text-slate-300 transition-transform duration-300", showCitySelector && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showCitySelector && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCitySelector(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="absolute top-full left-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      <div className="px-3 py-2 border-b border-slate-50 mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Your City</p>
                      </div>
                      <button
                        onClick={() => {
                          setCity('Valencia');
                          setShowCitySelector(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img src="/valencia.jpg" alt="Valencia" className="w-8 h-8 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all hover:scale-105" />
                          <span className="font-semibold text-slate-700">Valencia</span>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full ring-4 ring-green-50" />
                      </button>
                      
                      <div className="mx-1 mt-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          We're expanding! <br/>
                          <span className="text-brand-blue">Unlock'd</span> is coming to Madrid & Barcelona soon.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <motion.button 
          onClick={() => setShowAddPro(true)}
          className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center group flex-shrink-0 ml-2"
        >
          {/* Central Button */}
          <div className="absolute inset-1.5 bg-brand-yellow rounded-full shadow-lg shadow-brand-yellow/30 flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-110 group-active:scale-95">
            <Plus className="w-5 h-5 text-white" />
          </div>
          
          {/* Spinning Circular Text */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-full h-full"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <defs>
                <path
                  id="circlePath"
                  d="M 50, 50 m -43, 0 a 43,43 0 1,1 86,0 a 43,43 0 1,1 -86,0"
                />
              </defs>
              <text className="text-[16px] font-black fill-brand-yellow tracking-[0.15em] uppercase">
                <textPath xlinkHref="#circlePath">
                  Add a Pro • Add a Pro • 
                </textPath>
              </text>
            </svg>
          </motion.div>
        </motion.button>
      </header>

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto no-scrollbar relative pb-24">
        <motion.div
          className="min-h-full w-full"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeView}
              custom={direction}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.5 }}
              className="min-h-full w-full"
            >
              {activeView === 'home' && (
                <HomeView 
                  key="home" 
                  onNavigate={(view, params) => {
                    if (params?.eventId) setInitialEventId(params.eventId);
                    if (params?.proId) setInitialProId(params.proId);
                    if (params?.guideId) setInitialGuideId(params.guideId);
                    navigateTo(view);
                  }}
                  onAddPro={() => setShowAddPro(true)} 
                  ads={ads} 
                  onSelectAd={setSelectedAd} 
                  onSelectPost={(post) => { setSelectedPost(post); navigateTo('community-thread'); }}
                  scrollToTop={scrollToTop}
                />
              )}
              {activeView === 'explore' && (
                <ExploreView 
                  onNavigate={navigateTo} 
                  initialProId={initialProId}
                  onModalClose={() => setInitialProId(null)}
                  scrollToTop={scrollToTop}
                />
              )}
              {activeView === 'events' && (
                <EventsView 
                  key="events" 
                  initialEventId={initialEventId}
                  onModalClose={() => setInitialEventId(null)}
                  scrollToTop={scrollToTop}
                />
              )}
              {activeView === 'guides' && (
                <GuidesView 
                  key="guides" 
                  initialGuideId={initialGuideId}
                  onModalClose={() => setInitialGuideId(null)}
                  scrollToTop={scrollToTop}
                />
              )}
              {activeView === 'profile' && (
                <ProfileView 
                  key="profile" 
                  scrollToTop={scrollToTop}
                  onNavigate={navigateTo}
                />
              )}
              {activeView === 'admin' && (
                <AdminView 
                  key="admin" 
                  scrollToTop={scrollToTop}
                />
              )}
              {activeView === 'marketplace' && (
                <MarketplaceView 
                  key="marketplace" 
                  onAddAd={() => setShowAddAd(true)} 
                  ads={ads} 
                  onSelectAd={setSelectedAd} 
                  scrollToTop={scrollToTop}
                />
              )}
              {activeView === 'messages' && (
                <MessagesView key="messages" scrollToTop={scrollToTop} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Modals contained in this area */}
        <AnimatePresence>
          {showAddPro && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] overflow-y-auto overscroll-contain"
              onClick={() => setShowAddPro(false)}
            >
              <div className="min-h-full flex items-start justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col my-auto border border-slate-100"
                  onClick={e => e.stopPropagation()}
                >
                {/* Modal Header */}
                <div className="px-8 pt-10 pb-4 flex flex-col items-center text-center relative">
                  <div className="w-12 h-12 bg-brand-yellow/10 flex items-center justify-center rounded-full mb-4">
                    <Plus className="w-6 h-6 text-brand-yellow" />
                  </div>
                  
                  <h2 className="text-2xl font-bold font-display text-brand-navy tracking-tight">
                    Recommend a Pro
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Share a great service with the community</p>
                  
                  <button 
                    onClick={() => setShowAddPro(false)}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 pt-4 space-y-6">
                  <div className="space-y-5">
                    {/* Basic Info Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Professional Identity</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Full Name" 
                          value={proName}
                          onChange={(e) => setProName(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                        />
                        <input 
                          type="text" 
                          placeholder="Category" 
                          value={proCategory}
                          onChange={(e) => setProCategory(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                        />
                      </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Contact Details</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                          type="email" 
                          placeholder="Email (Optional)" 
                          value={proEmail}
                          onChange={(e) => setProEmail(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                        />
                        <input 
                          type="tel" 
                          placeholder="Phone (Optional)" 
                          value={proPhone}
                          onChange={(e) => setProPhone(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none text-sm font-semibold transition-all placeholder:text-slate-300" 
                        />
                      </div>
                    </div>

                    {/* Recommendation Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Your Recommendation</p>
                      </div>
                      <textarea 
                        placeholder="Why do you recommend them?" 
                        value={proRecommendation}
                        onChange={(e) => setProRecommendation(e.target.value)}
                        className="w-full p-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:border-brand-yellow/30 focus:bg-white focus:ring-4 focus:ring-brand-yellow/5 outline-none h-28 text-sm font-medium resize-none transition-all leading-relaxed placeholder:text-slate-300" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      className="w-full py-4 bg-brand-yellow text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand-yellow/20 hover:shadow-brand-yellow/30 active:scale-[0.98] transition-all disabled:opacity-40 disabled:grayscale disabled:shadow-none uppercase tracking-widest" 
                      onClick={handlePostPro}
                      disabled={!proName || !proCategory || (!proEmail.trim() && !proPhone.trim())}
                    >
                      Post Recommendation
                    </button>
                    <button 
                      onClick={() => setShowAddPro(false)}
                      className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-500 transition-all uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="pt-4 flex items-center justify-center gap-2 text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] border-t border-slate-50">
                    <Shield className="w-3 h-3" />
                    Verified Community Content
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        <AnimatePresence>
          {showAddAd && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] overflow-y-auto overscroll-contain touch-pan-y"
              onClick={() => setShowAddAd(false)}
            >
              <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white w-full max-w-lg rounded-[32px] p-6 sm:p-8 space-y-6 relative shadow-2xl my-auto"
                  onClick={e => e.stopPropagation()}
                >
                <button 
                  onClick={() => setShowAddAd(false)}
                  className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-display text-brand-navy">Post a New Ad</h2>
                    <span className="text-xs font-medium text-slate-400">{uploadedImageUrls.length}/3 photos</span>
                  </div>
                  <p className="text-slate-500 text-sm">Share what you're selling or looking for.</p>
                </div>
                <div className="space-y-6">
                  {/* Photo Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Photos</label>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {uploadedImageUrls.length}/3
                      </span>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      multiple
                      onChange={handleImageUpload}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      {uploadedImageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                          <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setUploadedImageUrls(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 backdrop-blur text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {uploadedImageUrls.length < 3 && (
                        <button 
                          onClick={() => !isUploading && fileInputRef.current?.click()}
                          disabled={isUploading}
                          className={cn(
                            "aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1.5 cursor-pointer hover:bg-slate-100 hover:border-brand-blue/20 hover:text-brand-blue transition-all active:scale-95",
                            isUploading && "opacity-50 cursor-wait"
                          )}
                        >
                          {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                          ) : (
                            <>
                              <Camera className="w-6 h-6" />
                              <span className="text-[10px] font-bold">Add Photo</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basic Information</label>
                    <div className="space-y-3">
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="What are you listing?" 
                          value={adTitle}
                          onChange={(e) => setAdTitle(e.target.value)}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder={adCategory === 'Jobs' || adCategory === 'Services' ? "Price (Optional)" : "Price"} 
                            value={adPrice}
                            onChange={(e) => setAdPrice(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium" 
                          />
                        </div>
                        <div className="relative">
                          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adCategory}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdCategory(val);
                              if (val === 'Jobs' || val === 'Services') {
                                setAdCondition('N/A');
                              } else if (val === 'Real Estate') {
                                setAdCondition('N/A');
                              } else {
                                setAdCondition('Good');
                              }
                            }}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="Vehicles">Vehicles</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Home">Home</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Leisure">Leisure</option>
                            <option value="Services">Services</option>
                            <option value="Jobs">Jobs</option>
                          </select>
                        </div>
                      </div>

                      {adCategory === 'Real Estate' && (
                        <div className="space-y-3">
                          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                            {(['Rent', 'Sale'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => setAdHousingType(type)}
                                className={cn(
                                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                                  adHousingType === type 
                                    ? "bg-white text-brand-blue shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                For {type}
                              </button>
                            ))}
                          </div>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                              value={adPropertyType}
                              onChange={(e) => setAdPropertyType(e.target.value)}
                              className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                            >
                              <option value="Apartment">Apartment</option>
                              <option value="House">House</option>
                              <option value="Studio">Studio</option>
                              <option value="Office">Office</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {adCategory === 'Vehicles' && (
                        <div className="relative">
                          <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adFuelType}
                            onChange={(e) => setAdFuelType(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>
                      )}

                      {adCategory === 'Jobs' && (
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adContractType}
                            onChange={(e) => setAdContractType(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                          </select>
                        </div>
                      )}

                      {adCategory === 'Clothing' && (
                        <div className="relative">
                          <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adSize}
                            onChange={(e) => setAdSize(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</label>
                    <div className={cn(
                      "grid gap-3",
                      (adCategory === 'Jobs' || adCategory === 'Services') ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {(adCategory !== 'Jobs' && adCategory !== 'Services') && (
                        <div className="relative">
                          <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={adCondition}
                            onChange={(e) => setAdCondition(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium appearance-none"
                          >
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </div>
                      )}
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Location" 
                          value={adLocation}
                          onChange={(e) => setAdLocation(e.target.value)}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      placeholder="Tell us more about it..." 
                      value={adDescription}
                      onChange={(e) => setAdDescription(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none h-32 text-sm font-medium resize-none" 
                    />
                  </div>

                  <button 
                    className="w-full btn-primary py-4 text-lg font-bold rounded-2xl shadow-xl shadow-brand-blue/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none" 
                    onClick={handlePostAd}
                    disabled={isUploading || !adTitle || !adPrice}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Posting...</span>
                      </div>
                    ) : (
                      'Post Listing'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        <AnimatePresence>
          {selectedAd && (
            <AdDetailModal 
              key="ad-detail-modal"
              ad={selectedAd} 
              onClose={() => setSelectedAd(null)} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 safe-area-bottom z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between px-2 py-2 max-w-xl mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id as View)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 min-w-0",
                (activeView === item.id) ? "text-brand-blue" : "text-slate-400"
              )}
            >
              <item.icon className={cn(
                "w-8 h-8 transition-all", 
                (activeView === item.id) ? "stroke-[2.5px] text-brand-blue" : "stroke-[1.5px] text-slate-400"
              )} />
              <span className={cn(
                "text-[11px] font-bold text-center truncate w-full px-1 transition-all",
                (activeView === item.id) ? "text-brand-blue" : "text-slate-400"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// --- Components ---

function ReviewModal({ pro, onClose, onSubmit }: { pro: any, onClose: () => void, onSubmit: (review: any) => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto no-scrollbar" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl -z-10" />
      <div className="min-h-full flex items-center justify-center p-4 py-12">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Leave a Review</h2>
            <p className="text-sm text-slate-500">How was your experience with {pro.name}?</p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star 
                  className={cn(
                    "w-10 h-10 transition-colors",
                    (hoveredRating || rating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-200"
                  )} 
                />
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Feedback</label>
            <textarea 
              placeholder="Write your review here..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-blue outline-none h-32 text-sm font-medium resize-none" 
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button 
              disabled={!rating || !comment.trim()}
              onClick={() => onSubmit({ rating, comment })}
              className="flex-1 py-4 bg-brand-blue text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-blue/20 active:scale-95 transition-all disabled:opacity-50"
            >
              Submit Review
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);
}

function AdDetailModal({ ad, onClose }: { ad: Ad | any, onClose: () => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const price = ad.price.includes('€') ? ad.price : `${ad.price}€`;
  const images = ad.images && ad.images.length > 0 ? ad.images : [ad.image_url || ad.image];
  const createdAt = 'created_at' in ad ? ad.created_at : new Date().toISOString();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [ad.id]);

  const nextImage = (e?: any) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: any) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const onDragEnd = (event: any, info: any) => {
    if (images.length <= 1) return;
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      nextImage();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      prevImage();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain touch-pan-y"
    >
      <div 
        className="min-h-full flex items-start justify-center p-4 py-12"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md -z-10"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col my-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={onClose}
              className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-slate-900 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div 
              className="h-56 sm:h-80 overflow-hidden relative group cursor-zoom-in touch-pan-y no-swipe"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, x: direction * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 100 }}
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={onDragEnd}
                className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                onClick={() => setIsFullScreen(true)}
              >
                <img 
                  src={images[currentImageIndex]} 
                  alt={ad.title} 
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
              </motion.div>
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_: any, i: number) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          i === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-1">
                    {ad.category}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 font-display">{ad.title}</h3>
                </div>
                <div className="text-2xl font-black text-brand-blue">
                  {price}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {ad.location && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                    {ad.location}
                  </div>
                )}
                {ad.condition && ad.condition !== 'N/A' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Tag className="w-3.5 h-3.5" />
                    {ad.condition}
                  </div>
                )}
                {ad.type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 rounded-full text-xs font-bold text-brand-blue">
                    For {ad.type}
                  </div>
                )}
                {ad.fuel_type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Fuel className="w-3.5 h-3.5" />
                    {ad.fuel_type}
                  </div>
                )}
                {ad.property_type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Building2 className="w-3.5 h-3.5" />
                    {ad.property_type}
                  </div>
                )}
                {ad.contract_type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Briefcase className="w-3.5 h-3.5" />
                    {ad.contract_type}
                  </div>
                )}
                {ad.size && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    <Shirt className="w-3.5 h-3.5" />
                    Size: {ad.size}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeTime(createdAt)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Description</h4>
              <p className="text-slate-600 leading-relaxed">
                {ad.description || "No description provided for this item."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button 
                className="flex-1 bg-brand-blue text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20 active:scale-[0.98] transition-transform"
                onClick={() => {
                  window.location.href = `mailto:seller@example.com?subject=Inquiry about ${ad.title}`;
                }}
              >
                Send Email to Seller
              </button>
              <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-[0.98] transition-transform">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            </div>
          </div>
        </motion.div>

        {/* Full Screen Image Portal */}
        <AnimatePresence>
          {isFullScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
              onClick={() => setIsFullScreen(false)}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-[110]"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center p-4 no-swipe">
                <motion.img
                  key={currentImageIndex}
                  initial={{ scale: 0.9, opacity: 0, x: direction * 200 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0.9, opacity: 0, x: -direction * 200 }}
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                  drag={images.length > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={onDragEnd}
                  src={images[currentImageIndex]}
                  alt={ad.title}
                  className="max-w-full max-h-full object-contain shadow-2xl cursor-grab active:cursor-grabbing select-none"
                  onClick={(e) => e.stopPropagation()}
                />

                {images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
);
}

// --- Views ---

function AdminView({ scrollToTop }: { scrollToTop?: () => void }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scrollToTop?.();
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const data = await proService.getRecommendations();
      setRecommendations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1 text-left">
           <h2 className="text-2xl font-black font-display text-brand-navy flex items-center gap-2">
             <ShieldCheck className="w-8 h-8 text-brand-blue" />
             Admin Dashboard
           </h2>
           <p className="text-slate-500 font-medium tracking-tight">Review member recommendations for new professionals.</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-slate-50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No recommendations yet.</p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4 text-left">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-900">{rec.pro_name}</h3>
                  <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black uppercase text-slate-500 rounded-full tracking-widest">{rec.pro_category}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Recently'}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {rec.pro_contact && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Contact Info</p>
                    <p className="font-medium text-slate-700">{rec.pro_contact}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Suggested by</p>
                  <p className="font-medium text-brand-blue">{rec.user_email}</p>
                </div>
              </div>

              {rec.notes && (
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Member Notes</p>
                  <p className="text-slate-600 text-sm leading-relaxed italic">"{rec.notes}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function SuggestProModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [formData, setFormData] = useState({
    pro_name: '',
    company_name: '',
    pro_category: '',
    pro_email: '',
    pro_phone: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: Name or Company required
    if (!formData.pro_name && !formData.company_name) {
      setError('Please provide at least a Full Name or a Company Name.');
      return;
    }

    // Validation: Email or Phone required
    if (!formData.pro_email && !formData.pro_phone) {
      setError('Please provide at least an Email or a Phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await proService.submitRecommendation({
        ...formData,
        user_email: "vincentdurroux@gmail.com"
      });
      setDone(true);
      setTimeout(() => {
        onClose();
        setDone(false);
        setFormData({ 
          pro_name: '', 
          company_name: '',
          pro_category: '', 
          pro_email: '', 
          pro_phone: '',
          notes: '' 
        });
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to send recommendation. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden text-left"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black font-display text-brand-navy">Recommend a Professional</h3>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Help us discover the best local talent for our community.</p>
            </div>
            
            {done ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <p className="font-bold text-slate-900">Recommendation Sent!</p>
                <p className="text-sm text-slate-500">Thank you for helping the community grow.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                {error && (
                  <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-red-100">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                    <input 
                      value={formData.pro_name}
                      onChange={e => setFormData({...formData, pro_name: e.target.value})}
                      placeholder="e.g. Maria Gonzalez" 
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-slate-300 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Company Name</label>
                    <input 
                      value={formData.company_name}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                      placeholder="e.g. Legal Experts SL" 
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Profession (Métier)</label>
                  <input 
                    required
                    value={formData.pro_category}
                    onChange={e => setFormData({...formData, pro_category: e.target.value})}
                    placeholder="e.g. Attorney, Plumber, Doctor" 
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-slate-300 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email</label>
                    <input 
                      type="email"
                      value={formData.pro_email}
                      onChange={e => setFormData({...formData, pro_email: e.target.value})}
                      placeholder="email@example.com" 
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-slate-300 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Phone</label>
                    <input 
                      type="tel"
                      value={formData.pro_phone}
                      onChange={e => setFormData({...formData, pro_phone: e.target.value})}
                      placeholder="+34 ..." 
                      className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Why do you recommend them?</label>
                  <textarea 
                    required
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Tell us why this professional is great..." 
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all resize-none placeholder:text-slate-300 text-sm"
                  />
                </div>
                
                <button 
                  disabled={isSubmitting}
                  className="w-full h-14 bg-brand-navy text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand-navy/20 hover:bg-brand-blue transition-all disabled:opacity-50 mt-2"
                  type="submit"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Recommendation'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function HomeView({ onNavigate, onAddPro, ads, onSelectAd, onSelectPost, scrollToTop }: { onNavigate: (view: View, params?: { eventId?: string, proId?: string, guideId?: string }) => void, onAddPro: () => void, ads: Ad[], onSelectAd: (ad: Ad) => void, onSelectPost: (post: any) => void, scrollToTop?: () => void }) {
  const feedRef = useRef<HTMLDivElement>(null);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-6 pt-12 pb-6 space-y-12 max-w-7xl mx-auto w-full"
    >
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left mb-12">
        <div className="space-y-1 flex flex-col items-center md:items-start">
          <h2 className="text-[22px] font-bold font-display text-brand-navy">Hola, Vincent!</h2>
          <p className="text-slate-500 text-sm">Welcome back to your local community.</p>
        </div>
      </div>

      {/* Community Image Section */}
      <div className="w-full flex justify-center -mb-2 relative z-0">
        <img 
          src="/people.jpg" 
          alt="Our Community" 
          className="w-[70%] md:w-[35%] h-auto max-h-[160px] md:max-h-[300px] object-contain block"
        />
      </div>

      {/* Hero Find Pro Section */}
      <motion.div 
        whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
        className="relative overflow-hidden rounded-[2rem] bg-white p-8 md:p-16 text-slate-900 border border-slate-100 shadow-sm transition-all duration-300"
      >
        {/* Subtle Background Elements */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:space-y-8 flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-[1.15] tracking-tight max-w-2xl">
              Find recommended <span className="text-brand-blue italic">Pros</span> near you.
            </h1>
            <p className="text-slate-500 text-base md:text-xl max-w-md leading-relaxed">
              Connect with experts recommended by the community.
            </p>
            
            <div 
              className="relative group cursor-pointer w-full max-w-md" 
              onClick={() => onNavigate('explore')}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors" />
              <input 
                readOnly
                placeholder="Search for a pro..."
                className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-slate-100 text-slate-600 placeholder:text-slate-400 text-base hover:border-brand-blue/20 transition-all cursor-pointer shadow-sm group-hover:shadow-md outline-none"
                onClick={() => onNavigate('explore')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onNavigate('explore');
                }}
              />
            </div>
          </div>
          
          <div className="hidden md:flex justify-center lg:justify-end relative">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue to-brand-yellow rounded-full animate-pulse opacity-10 blur-2xl" />
              <div className="relative z-10 w-full h-full rounded-full border-2 border-slate-100 p-4 backdrop-blur-sm">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-2xl">
                   <img src="/valencia.jpg" alt="Valencia City" className="w-full h-full object-cover" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start">
        {/* Highlights of the week carousel */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg font-display text-brand-navy flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-blue" />
              Highlights of the week
            </h3>
          </div>
          
          <div className="relative group flex-1 flex flex-col min-h-[250px]">
            <HighlightCarousel onNavigate={onNavigate} />
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          {/* Expert Guides & Partners Section */}
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg font-display text-brand-navy flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-yellow" />
              Partner Expert Guides
            </h3>
          </div>
          <ExpertGuidesPartners onReadFullGuide={() => onNavigate('guides', { guideId: 'gs-1' })} />
        </div>
      </div>
    </motion.div>
  );
}

function ExpertGuideModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 60);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-navy/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[85vh] rounded-none md:rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Image Section - Shrinks on scroll */}
          <motion.div 
            animate={{ 
              height: isScrolled ? '80px' : '320px'
            }}
            className="relative flex-shrink-0 overflow-hidden bg-brand-navy group"
          >
            <motion.img 
              animate={{ opacity: isScrolled ? 0.3 : 1, scale: isScrolled ? 1.1 : 1 }}
              src="/valencia.jpg" 
              alt="Valencia" 
              className="w-full h-full object-cover absolute inset-0" 
            />
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
              isScrolled ? "opacity-0" : "opacity-100"
            )} />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-lg active:scale-95 z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div 
              animate={{ 
                opacity: isScrolled ? 0 : 1,
                y: isScrolled ? 20 : 0
              }}
              className="absolute bottom-8 left-8 right-8 pointer-events-none"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-brand-yellow text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-brand-yellow/20">Exclusive Guide</span>
                <span className="text-white/60 text-xs font-bold">• 8 min read</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-white font-display leading-tight drop-shadow-2xl">
                Choosing the perfect neighborhood in Valencia
              </h2>
            </motion.div>

            {/* Small Title for Scrolled State */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isScrolled ? 1 : 0 }}
              className="absolute inset-0 flex items-center justify-start px-8 pt-2 pointer-events-none"
            >
              <p className="text-white font-bold text-sm tracking-tight truncate max-w-[70%]">Choosing the perfect neighborhood in Valencia</p>
            </motion.div>
          </motion.div>

          {/* Scrollable Content */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-grow overflow-y-auto p-8 md:p-12 scroll-smooth"
          >
            <div className="max-w-2xl mx-auto space-y-10">
              {/* Partner Intro */}
              <div className="flex items-center gap-4 py-6 border-b border-slate-100 mb-8">
                <img src="https://i.pravatar.cc/150?u=marina" alt="Marina" className="w-12 h-12 rounded-full border-2 border-brand-yellow/20" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Article by Marina Sanchis</p>
                  <p className="text-sm font-bold text-slate-800">Engel & Völkers Valencia Real Estate Specialist</p>
                </div>
              </div>

              {/* Guide Content */}
              <div className="space-y-6 text-slate-600 leading-relaxed text-base md:text-lg">
                <p className="font-bold text-slate-900 border-l-4 border-brand-yellow pl-4 italic">
                  "Valencia is no longer Spain’s best-kept secret. As more expats move here, choosing the right neighborhood is the most critical decision for your quality of life."
                </p>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-yellow rounded-full" />
                    Ruzafa: The Bohemian Heart
                  </h3>
                  <p>
                    Known as the Soho of Valencia, Ruzafa is perfect for young professionals and digital nomads. It's vibrant, filled with art galleries, vintage shops, and the city's best coffee scene. However, be prepared for noise on weekends.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-yellow rounded-full" />
                    Cabañal: Living by the Mediterranean
                  </h3>
                  <p>
                    The old fisherman’s quarter is undergoing a massive transformation. It offers a unique architectural style and proximity to the Malvarrosa beach. Perfect for those who want a maritime vibe while remaining 15 minutes from the center.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-yellow rounded-full" />
                    Ciutat Vella: History at your Doorstep
                  </h3>
                  <p>
                    Living in the old town means being surrounded by centuries of history. It's walkable, charming, but can feel touristy in peak seasons. Ideal for those who love the 'Old Europe' atmosphere.
                  </p>
                </div>

                <div className="bg-brand-blue/5 rounded-3xl p-6 md:p-8 space-y-4 border border-brand-blue/10 mt-8" id="expert-tip-box">
                  <h4 className="text-brand-navy font-black text-sm uppercase tracking-widest">Expert Market Tip for 2024</h4>
                  <p className="text-brand-navy/80 text-sm md:text-base leading-relaxed">
                    Property values in areas adjacent to the Turia Park, like Campanar and Algiros, are seeing the highest appreciation due to the 'Green Corridor' effect. Families should focus their search here for long-term stability.
                  </p>
                </div>
              </div>

              {/* Call to Action Section */}
              <div className="mt-12 p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full blur-3xl group-hover:bg-brand-yellow/20 transition-all duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <h4 className="text-xl font-bold mb-4 font-display">Ready to find your home in Valencia?</h4>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Connect with Marina Sanchis directly for a private consultation and access to our off-market portfolio.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <a href="tel:+34963510200" className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/call">
                      <div className="w-10 h-10 rounded-xl bg-brand-yellow/20 flex items-center justify-center text-brand-yellow group-hover/call:scale-110 transition-transform">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Call Marina</p>
                        <p className="text-sm font-bold">+34 963 51 02 00</p>
                      </div>
                    </a>
                    <a href="mailto:valencia@engelvoelkers.com" className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/mail">
                      <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue group-hover/mail:scale-110 transition-transform">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email Office</p>
                        <p className="text-sm font-bold">valencia@ev.com</p>
                      </div>
                    </a>
                  </div>

                  <button className="w-full py-4 bg-brand-yellow text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Visit Website
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ExpertGuidesPartners({ onReadFullGuide }: { onReadFullGuide: () => void }) {
  const featuredGuide = {
    title: "How to choose the best neighborhood in Valencia",
    partner: "Engel & Völkers Valencia",
    author: "Marina Sanchis",
    avatar: "https://i.pravatar.cc/150?u=marina",
    excerpt: "From the bohemian streets of Ruzafa to the family-friendly avenues of Algiros, every district tells a different story. Discover which one matches your lifestyle and investment goals.",
    brandImage: "/valencia.jpg",
    contact: {
      phone: "+34 963 51 02 00",
      email: "valencia@engelvoelkers.com"
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4">
      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row flex-1">
          {/* Visual Side */}
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
            <img src={featuredGuide.brandImage} alt="Valencia neighborhoods" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
            <div className="absolute top-4 left-4 bg-brand-yellow text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-lg">
              Featured Expert
            </div>
          </div>

          {/* Content Side */}
          <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-yellow/20">
                  <img src={featuredGuide.avatar} alt={featuredGuide.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-none">{featuredGuide.partner}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">By {featuredGuide.author}</p>
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-black font-display text-brand-navy mb-3 group-hover:text-brand-blue transition-colors leading-tight">
                {featuredGuide.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 md:line-clamp-none">
                {featuredGuide.excerpt}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Contact Expert</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-brand-yellow" />
                    {featuredGuide.contact.phone}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-brand-yellow" />
                    {featuredGuide.contact.email}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={onReadFullGuide}
                  className="bg-brand-navy text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue transition-all shadow-lg active:scale-95"
                >
                  Read Full Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightCarousel({ onNavigate }: { onNavigate: (view: View, params?: { eventId?: string, proId?: string, guideId?: string }) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { professionals: allPros } = useProfessionals(MOCK_PROS);
  const featuredPro = allPros[1] || MOCK_PROS[1];
  const totalSlides = 3;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  const slides = [
    {
      type: 'event',
      id: '1',
      title: 'Valencia Expat Connect',
      location: 'Marina Beach Club',
      tag: 'EVENT',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600',
      date: { day: 'FRI', num: '24' },
      action: () => onNavigate('events', { eventId: '1' })
    },
    {
      type: 'pro',
      pro: featuredPro,
      action: () => onNavigate('explore', { proId: featuredPro.id })
    },
    {
      type: 'tip',
      id: 'pw-1',
      title: 'The Ultimate NIE Guide 2024',
      excerpt: 'Avoid the administrative headache with our updated 2024 guide for Valencia residents.',
      tag: 'TIPS',
      readTime: '4 min read',
      action: () => onNavigate('guides', { guideId: 'pw-1' })
    }
  ];

  return (
    <div className="relative overflow-hidden rounded-[32px] no-swipe flex-1 flex flex-col">
      <motion.div 
        className="flex h-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          const threshold = 50;
          if (info.offset.x < -threshold && currentIndex < totalSlides - 1) {
            setCurrentIndex(prev => prev + 1);
          } else if (info.offset.x > threshold && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
          }
        }}
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {slides.map((slide, idx) => (
          <div key={idx} className="min-w-full px-1 h-full">
            {slide.type === 'event' && (
              <div 
                className="card bg-white overflow-hidden cursor-pointer h-full border border-slate-100/50 shadow-sm flex flex-col"
                onClick={slide.action}
              >
                <div className="h-32 overflow-hidden relative">
                  <img src={slide.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-center shadow-sm">
                    <p className="text-[8px] font-bold text-brand-blue uppercase">{slide.date?.day}</p>
                    <p className="text-sm font-bold leading-none">{slide.date?.num}</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-brand-blue text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {slide.tag}
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">{slide.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {slide.location}
                  </p>
                </div>
              </div>
            )}

            {slide.type === 'pro' && slide.pro && (
              <div 
                className="card bg-gradient-to-br from-brand-blue/5 to-transparent overflow-hidden cursor-pointer h-full border border-brand-blue/10 shadow-sm relative flex flex-col justify-center items-center text-center p-5"
                onClick={slide.action}
              >
                <div className="absolute top-3 right-3 bg-brand-blue text-white p-1.5 rounded-full shadow-lg">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2">Pro of the week</p>
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl mb-3">
                  <img src={slide.pro.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-slate-900">{slide.pro.name}</h4>
                  <p className="text-xs text-brand-blue font-medium">{slide.pro.category}</p>
                </div>
              </div>
            )}

            {slide.type === 'tip' && (
              <div 
                className="card bg-white overflow-hidden cursor-pointer h-full border border-slate-100/50 shadow-sm flex flex-col"
                onClick={slide.action}
              >
                <div className="h-24 bg-brand-blue/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-blue/20 rounded-full blur-2xl" />
                  <Lightbulb className="w-10 h-10 text-brand-blue relative z-10" />
                  <div className="absolute top-3 right-3 bg-brand-blue text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {slide.tag}
                  </div>
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">{slide.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{slide.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Guides</span>
                    <span className="text-[10px] font-bold text-brand-blue">{slide.readTime}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-1 transition-all duration-300 rounded-full",
              currentIndex === i ? "w-4 bg-brand-blue" : "w-1 bg-slate-300"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ProMap({ pros, onSelectPro, center }: { pros: Professional[], onSelectPro: (pro: Professional) => void, center: { lat: number, lng: number } }) {
  const hasValidKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY.length > 10;

  if (!hasValidKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 p-8 text-center rounded-[32px] border border-slate-100">
        <div className="max-w-md space-y-6">
          <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-brand-blue" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-brand-navy">Interactive Map Locked</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enable the professional directory map by adding your <strong>Google Maps Platform API Key</strong> as a secret.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-left space-y-2 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Setup</p>
            <ol className="text-[10px] text-slate-600 space-y-1.5 list-decimal pl-4">
              <li>Open <strong>Settings</strong> → <strong>Secrets</strong></li>
              <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId="e8677c77d4677732"
          className="w-full h-full"
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          scrollwheel={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {pros.map((pro, index) => pro.coordinates && (
            <AdvancedMarker
              key={pro.id}
              position={pro.coordinates}
              onClick={() => onSelectPro(pro)}
              title={pro.name}
            >
              <div className="relative group/pin">
                <Pin 
                  background={'#0038FF'} 
                  borderColor={'#fff'} 
                  glyphColor={'#fff'}
                  glyph={(index + 1).toString()}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white rounded-lg shadow-xl border border-slate-100 whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="text-[10px] font-bold text-brand-navy">{pro.name}</p>
                  <p className="text-[8px] text-slate-400 font-medium">Click to see details</p>
                </div>
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}

function ExploreView({ onNavigate, initialProId, onModalClose, scrollToTop }: { onNavigate: (view: View) => void, initialProId?: string | null, onModalClose?: () => void, scrollToTop?: () => void }) {
  const [search, setSearch] = useState('');
  const [deferredSearch, setDeferredSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    scrollToTop?.();
  }, [selectedCategory]);

  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);

  const { professionals: allPros } = useProfessionals(MOCK_PROS);

  const allProfessions = useMemo(() => {
    return Array.from(new Set(allPros.map(p => p.category))).sort();
  }, [allPros]);

  const scrollToPro = (pro: Professional) => {
    const element = document.getElementById(`pro-card-${pro.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary highlight effect
      element.classList.add('ring-4', 'ring-brand-blue/30', 'scale-[1.02]');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-brand-blue/30', 'scale-[1.02]');
      }, 2000);
    }
  };

  useEffect(() => {
    if (initialProId) {
      const pro = allPros.find(p => p.id === initialProId);
      if (pro) {
        setSelectedPro(pro);
      }
    }
  }, [initialProId, allPros]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | 'All'>('All');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedPro]);

  // Handle manual search submission (button or Enter)
  const handleSearchSubmit = () => {
    setDeferredSearch(search); // Force update immediately
    setIsInputFocused(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Visual feedback
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 600);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Valencia center if denied
          setUserLocation({ lat: 39.4699, lng: -0.3763 });
        }
      );
    } else {
      setUserLocation({ lat: 39.4699, lng: -0.3763 });
    }
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const languages = ['All', 'Spanish', 'English', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Arabic', 'Chinese', 'Japanese'];
  const distances = ['All', 1, 2, 5, 10, 25, 50, 100];

  const hasActiveFilter = deferredSearch.trim() !== '' || selectedCategory !== 'All' || selectedLanguage !== 'All' || maxDistance !== 'All' || minRating > 0;

  const filteredPros = hasActiveFilter 
    ? allPros.filter(pro => {
        const matchesCategory = selectedCategory === 'All' || pro.category === selectedCategory;
        const matchesLanguage = selectedLanguage === 'All' || pro.languages.includes(selectedLanguage);
        const matchesRating = pro.rating >= minRating;
        const matchesSearch = pro.name.toLowerCase().includes(deferredSearch.toLowerCase()) || 
                            pro.category.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                            pro.bio.toLowerCase().includes(deferredSearch.toLowerCase());
        
        let matchesDistance = true;
        if (maxDistance !== 'All' && userLocation && pro.coordinates) {
          const dist = getDistance(userLocation.lat, userLocation.lng, pro.coordinates.lat, pro.coordinates.lng);
          matchesDistance = dist <= (maxDistance as number);
        }

        return matchesCategory && matchesLanguage && matchesSearch && matchesDistance && matchesRating;
      })
    : allPros.slice(0, 4);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 md:p-12 pt-20 md:pt-24 space-y-16 pb-32 max-w-7xl mx-auto"
    >
      {/* Search & Filters */}
      <div className="space-y-16">
        <div className="max-w-4xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-4xl font-normal font-display text-brand-navy tracking-tight leading-tight">
              Find exactly who you <span className="text-brand-blue italic font-medium">need.</span>
            </h2>
          </div>
          <div className="relative group flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
              <input 
                type="text" 
                placeholder="Search by name, service or expertise..." 
                className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-slate-100 focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 outline-none shadow-sm hover:shadow-md transition-all text-slate-700 font-medium text-base placeholder:text-slate-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit();
                }}
              />
                
                {/* Live Search Results Dropdown */}
                <AnimatePresence>
                  {isInputFocused && search.trim().length > 1 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] border border-slate-100 shadow-2xl z-[150] overflow-hidden max-h-[400px] overflow-y-auto"
                    >
                      <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live matches</span>
                      </div>
                      
                      {MOCK_PROS.filter(p => 
                        p.name.toLowerCase().includes(search.toLowerCase()) || 
                        p.category.toLowerCase().includes(search.toLowerCase())
                      ).slice(0, 6).length > 0 ? (
                        MOCK_PROS.filter(p => 
                          p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase())
                        ).slice(0, 6).map((pro) => (
                          <button
                            key={pro.id}
                            onClick={() => {
                              setSelectedPro(pro);
                              setSearch(pro.name);
                              setIsInputFocused(false);
                            }}
                            className="w-full p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 border-b border-slate-50 last:border-0 group/item"
                          >
                            <img src={pro.image} alt={pro.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                            <div className="text-left">
                              <h4 className="font-bold text-slate-900 group-hover/item:text-brand-blue transition-colors">{pro.name}</h4>
                              <p className="text-xs text-slate-400">{pro.category} • {pro.location}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-400">
                          <p className="text-sm font-medium">No instant matches for "{search}"</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={handleSearchSubmit}
                className="hidden md:flex items-center gap-2 px-8 py-5 bg-brand-blue text-white rounded-[24px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Search
              </button>
            </div>
          </div>
          
          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-4">
            {/* Profession Dropdown */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-brand-blue" /> Filter by Profession
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-6 pr-12 py-4 bg-white rounded-2xl border border-slate-100 focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 outline-none shadow-sm hover:shadow-md transition-all text-slate-700 font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="All">All Professions</option>
                  {allProfessions.map(prof => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Language Dropdown */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-brand-blue" /> Preferred Language
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full pl-6 pr-12 py-4 bg-white rounded-2xl border border-slate-100 focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 outline-none shadow-sm hover:shadow-md transition-all text-slate-700 font-bold text-sm appearance-none cursor-pointer"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang === 'All' ? 'All Languages' : lang}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Distance Filter Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Max Distance ({maxDistance === 'All' ? 'Everywhere' : `${maxDistance} km`})
                </label>
                {maxDistance !== 'All' && (
                  <button onClick={() => setMaxDistance('All')} className="text-[10px] font-bold text-brand-blue uppercase hover:underline">Reset</button>
                )}
              </div>
              <div className="px-4 py-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-300">1km</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={maxDistance === 'All' ? 50 : maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <span className="text-[10px] font-bold text-slate-300">50km+</span>
              </div>
            </div>

            {/* Rating Filter stars */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-brand-yellow" /> Minimum Rating
              </label>
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm h-[66px]">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setMinRating(minRating === s ? 0 : s)}
                      className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star className={cn("w-6 h-6 transition-colors", s <= minRating ? "text-brand-yellow fill-brand-yellow" : "text-slate-200")} />
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-xs font-bold text-slate-400">
                  {minRating > 0 ? `${minRating}.0+` : 'Any rating'}
                </span>
              </div>
            </div>
          </div>
      </div>

      <div className="pt-8">
        <div className="space-y-12">
          {/* Map View always on top */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-[400px] md:h-[500px] rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl relative bg-slate-50"
          >
             <ProMap 
               pros={filteredPros} 
               onSelectPro={(pro) => scrollToPro(pro)} 
               center={userLocation || { lat: 39.4699, lng: -0.3763 }} 
             />
          </motion.div>

          {/* List View below the map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPros.length > 0 ? (
              filteredPros.map((pro, index) => (
                <motion.div 
                  key={pro.id} 
                  id={`pro-card-${pro.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPro(pro)}
                  className="group relative bg-white rounded-[32px] p-6 flex flex-col sm:flex-row gap-6 border border-slate-100 transition-all shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-brand-blue/10 cursor-pointer overflow-hidden"
                >
                  {/* Number Badge to match map pins */}
                  <div className="absolute top-6 right-6 w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-brand-blue/20 z-10 transition-transform group-hover:scale-110">
                    {index + 1}
                  </div>

                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-brand-blue/5 transition-colors duration-500" />
                  
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-700">
                    <img src={pro.image} alt={pro.name} className="w-full h-full object-cover" />
                  </div>
  
                  <div className="relative flex-1 flex flex-col justify-between min-w-0 py-1">
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-xl truncate group-hover:text-brand-blue transition-colors tracking-tight pr-8">{pro.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-brand-blue uppercase tracking-widest">{pro.category}</span>
                          <span className="text-slate-200">•</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                            <span className="text-xs font-normal text-slate-700">{pro.rating}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">({pro.reviews})</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                        {pro.bio}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                      <div className="flex flex-wrap gap-2">
                        {pro.languages.slice(0, 2).map(lang => (
                          <span key={lang} className="px-2 py-1 bg-slate-50/80 text-slate-400 rounded-lg text-[10px] font-medium border border-slate-100">
                            {lang}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300 uppercase tracking-widest">
                         <MapPin className="w-3 h-3" />
                         {pro.location}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center space-y-6">
                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto ring-1 ring-slate-100">
                  <Search className="w-12 h-12 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-900 font-bold text-2xl">No top experts found</p>
                  <p className="text-slate-400 max-w-md mx-auto font-medium">Try broadening your search or choosing a different community category.</p>
                </div>
                <button 
                  onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedLanguage('All'); setMaxDistance('All'); setMinRating(0); }}
                  className="mt-4 px-8 py-4 bg-brand-blue text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-blue/20 hover:scale-105 transition-all active:scale-95"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal Integration */}
      <AnimatePresence>
        {selectedPro && (
          <ProfessionalDetailView 
            pro={selectedPro} 
            onClose={() => {
              setSelectedPro(null);
              onModalClose?.();
            }} 
            onNavigate={onNavigate}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MessagesView({ scrollToTop }: { scrollToTop?: () => void }) {
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  useEffect(() => {
    scrollToTop?.();
  }, [selectedChat]);

  const chats = [
    { id: 1, name: 'Thomas', lastMsg: 'Thanks for the recommendation!', time: '2m ago', avatar: 'https://i.pravatar.cc/150?u=thomas', online: true },
    { id: 2, name: 'Marie', lastMsg: 'Did you get your residency yet?', time: '1h ago', avatar: 'https://i.pravatar.cc/150?u=marie', online: false },
    { id: 3, name: 'Julie', lastMsg: 'The flat is amazing, Valencia is great!', time: '3h ago', avatar: 'https://i.pravatar.cc/150?u=julie', online: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto w-full h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-white md:rounded-[32px] overflow-hidden shadow-sm border-x md:border border-slate-100 flex md:mt-4"
    >
      {/* Sidebar - Hidden on mobile if a chat is selected */}
      <div className={cn(
        "w-full md:w-80 border-r border-slate-100 flex flex-col transition-all duration-300",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur">
          <h2 className="text-xl font-black text-slate-900 font-display">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "p-4 flex gap-3 cursor-pointer transition-colors border-l-4",
                selectedChat?.id === chat.id ? "bg-brand-blue/5 border-brand-blue" : "hover:bg-slate-50 border-transparent"
              )}
            >
              <div className="relative flex-shrink-0">
                <img src={chat.avatar} alt="" className="w-12 h-12 rounded-full" />
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{chat.name}</h4>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area - Full screen on mobile if a chat is selected */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-50/30 transition-all duration-300",
        selectedChat ? "flex" : "hidden md:flex"
      )}>
        {selectedChat ? (
          <>
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm relative z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-brand-blue transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <img src={selectedChat.avatar} alt="" className="w-10 h-10 rounded-full" />
                  {selectedChat.online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedChat.name}</h4>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{selectedChat.online ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50/50">
              <div className="flex justify-end">
                <div className="bg-brand-blue text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] md:max-w-sm text-sm shadow-sm ring-1 ring-black/5">
                  Hey! I noticed you left a review for one of the pros. How was your experience?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white text-slate-700 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] md:max-w-sm text-sm shadow-sm border border-slate-100">
                  {selectedChat.lastMsg}
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-slate-100 pb-6 md:pb-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue/20 transition-all"
                />
                <button className="bg-brand-blue text-white p-2.5 rounded-xl shadow-lg shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-12 space-y-4 bg-white">
            <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center animate-bounce-slow">
              <MessageCircle className="w-10 h-10 text-brand-blue" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Your Conversations</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">Select a chat to start talking with other community members.</p>
            </div>
          </div>
        ) }
      </div>
    </motion.div>
  );
}

function ProfessionalDetailView({ pro, onClose, onNavigate }: { pro: Professional, onClose: () => void, onNavigate: (view: View) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pro.id]);

  return (
    <div 
      ref={scrollRef}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] overflow-y-auto overscroll-contain flex justify-center" 
      onClick={onClose}
    >
      <div className="min-h-full w-full max-w-2xl flex items-start p-4 md:p-8">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          className="bg-white w-full rounded-[40px] overflow-hidden shadow-2xl relative my-auto"
          onClick={e => e.stopPropagation()}
        >
        {/* Header Image/Cover Area */}
        <div className="h-40 md:h-48 bg-gradient-to-br from-brand-blue/30 via-slate-100 to-amber-500/10 relative">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2.5 bg-white/40 hover:bg-white/90 backdrop-blur-md rounded-full shadow-lg text-slate-600 transition-all z-10 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 md:px-10 pb-10 -mt-16 relative">
          <div className="flex flex-col md:flex-row gap-6 md:items-end mb-10">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-[32px] bg-white p-1.5 overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100 group">
              <img src={pro.image} alt={pro.name} className="w-full h-full object-cover rounded-[24px] group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 space-y-3 pb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 font-display tracking-tight leading-none">{pro.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/5 text-brand-blue rounded-xl font-medium border border-brand-blue/10">
                  <Briefcase className="w-3.5 h-3.5" />
                  {pro.category}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl font-medium border border-slate-100">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{pro.rating}</span>
                  <span className="text-slate-400 font-normal">({pro.reviews} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-10">
              {/* Direct Contact Bar - Vertical List */}
              <div className="bg-slate-50/30 rounded-2xl p-4 space-y-3 max-w-sm">
                {pro.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-3.5 h-3.5 text-cyan-500/70" />
                    <a href={`tel:${pro.phone}`} className="text-sm text-slate-500 hover:text-brand-blue transition-colors">{pro.phone}</a>
                  </div>
                )}
                {pro.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-3.5 h-3.5 text-brand-blue/70" />
                    <a href={`mailto:${pro.email}`} className="text-sm text-slate-500 hover:text-brand-blue transition-colors break-all">{pro.email}</a>
                  </div>
                )}
                {pro.website && (
                  <div className="flex items-center gap-3">
                    <Link className="w-3.5 h-3.5 text-slate-400/70" />
                    <a 
                      href={pro.website.startsWith('http') ? pro.website : `https://${pro.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-slate-500 hover:text-brand-blue transition-colors"
                    >
                      {pro.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                )}
                {pro.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-3.5 h-3.5 text-rose-500/70" />
                    <span className="text-sm text-slate-500">{pro.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Globe className="w-3.5 h-3.5 text-slate-400/70" />
                  <div className="flex gap-2">
                    {pro.languages.map(lang => (
                      <span key={lang} className="text-sm text-slate-500">{lang}</span>
                    ))}
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-blue" />
                  <h4 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-wider">About</h4>
                </div>
                <p className="text-slate-600 leading-relaxed text-base font-medium">
                  {pro.bio}
                </p>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-blue" />
                    <h4 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-wider">Community feedback</h4>
                  </div>
                </div>
                <div className="grid gap-4">
                  {pro.testimonials.map((t, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50 hover:bg-white hover:shadow-xl hover:border-brand-blue/10 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3 items-center">
                          <img src={t.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onNavigate('messages');
                                }}
                                className="font-bold text-slate-900 hover:text-brand-blue flex items-center gap-1.5 transition-colors group/chat"
                              >
                                {t.author}
                                <MessageSquare className="w-3.5 h-3.5 text-brand-blue opacity-70 group-hover/chat:opacity-100 transition-opacity" />
                              </button>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} className={cn("w-2.5 h-2.5", idx < t.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.date}</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium pl-1">
                        "{t.text}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);
}

function EventsView({ initialEventId, onModalClose, scrollToTop }: { initialEventId?: string | null, onModalClose?: () => void, scrollToTop?: () => void }) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (initialEventId) {
      const event = MOCK_EVENTS.find(e => e.id === initialEventId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [initialEventId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-bold font-display text-brand-navy">What's Up in Your City</h2>
        <p className="text-slate-500">Discover meetups and cultural events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        {MOCK_EVENTS.map(event => (
          <div 
            key={event.id} 
            className="card bg-white group hover-lift cursor-pointer"
            onClick={() => setSelectedEvent(event)}
          >
            <div className="h-40 overflow-hidden relative">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-center">
                <p className="text-[10px] font-bold text-brand-blue uppercase">{event.date.split(' ')[0]}</p>
                <p className="text-lg font-bold leading-none">{event.date.split(' ')[1]}</p>
              </div>
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white p-2 rounded-full">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg">{event.title}</h4>
                <span className="text-[10px] font-bold bg-brand-blue/5 text-brand-blue px-2 py-1 rounded-full">{event.category}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.time}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold">+{event.attendees - 3}</div>
                </div>
                <button className="btn-primary text-xs">Attend Event</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal 
            event={selectedEvent} 
            onClose={() => {
              setSelectedEvent(null);
              onModalClose?.();
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EventDetailModal({ event, onClose }: { event: Event, onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [event.id]);

  return (
    <div 
      ref={scrollRef}
      className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 py-8 md:py-16" 
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-48 relative">
          <img src={event.image} alt="" className="w-full h-full object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-slate-900">{event.title}</h2>
              <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-bold uppercase tracking-wider">
                {event.category}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-brand-blue" />
                {event.date}
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-brand-blue" />
                {event.time}
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-brand-blue" />
                {event.location}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">About this event</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Join our community meetup at {event.location}! This is a great opportunity to meet new people, share experiences, and enjoy the local atmosphere. Whether you're new to the city or a long-time resident, everyone is welcome.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-blue/10 flex items-center justify-center text-[10px] font-bold text-brand-blue">
                +{event.attendees - 4}
              </div>
            </div>
            <button className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-blue/20 active:scale-95 transition-all">
              Attend Event
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GuidesView({ initialGuideId, onModalClose, scrollToTop }: { initialGuideId?: string | null, onModalClose?: () => void, scrollToTop?: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);

  useEffect(() => {
    if (initialGuideId) {
      const category = MOCK_GUIDE_CATEGORIES.find(cat => 
        cat.articles.some(art => art.id === initialGuideId)
      );
      if (category) {
        setSelectedCategory(category);
        setSelectedArticleId(initialGuideId);
        // Only open the modal automatically for the neighborhood guide for now, 
        // to match the requested behavior for "Read full guide"
        if (initialGuideId === 'gs-1') {
          setShowArticleModal(true);
        }
      }
    }
  }, [initialGuideId]);

  useEffect(() => {
    scrollToTop?.();
  }, [selectedCategory]);

  const handleCloseModal = () => {
    setShowArticleModal(false);
    if (initialGuideId === 'gs-1') {
      onModalClose?.();
    }
  };

  if (selectedCategory) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 space-y-8 pb-24"
      >
        <button 
          onClick={() => {
            setSelectedCategory(null);
            setSelectedArticleId(null);
            onModalClose?.();
          }}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Guides
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100">
            <selectedCategory.icon />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-slate-900">{selectedCategory.title}</h2>
            <p className="text-slate-500">{selectedCategory.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Publications</h3>
          <div className="grid grid-cols-1 gap-4">
            {selectedCategory.articles.map(article => (
              <div 
                key={article.id} 
                onClick={() => {
                  setSelectedArticleId(article.id);
                  if (article.id === 'gs-1') {
                    setShowArticleModal(true);
                  }
                }}
                className={cn(
                  "card p-6 space-y-3 hover-lift group cursor-pointer transition-all border-2",
                  selectedArticleId === article.id 
                    ? "bg-brand-blue/5 border-brand-blue ring-4 ring-brand-blue/5 shadow-xl scale-[1.02]" 
                    : "bg-white border-transparent"
                )}
              >
                <div className="flex justify-between items-start">
                  {article.tag && (
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      {article.tag}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-brand-blue transition-colors">{article.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{article.excerpt}</p>
                <div className="flex items-center gap-2 text-brand-blue text-sm font-bold pt-2">
                  Read Article <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Article Modal */}
        <ExpertGuideModal 
          isOpen={showArticleModal} 
          onClose={handleCloseModal} 
        />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-8 pb-24"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold font-display text-brand-navy">Relocation Guides</h2>
        <p className="text-slate-500 text-lg">Everything you need to know to settle into your new life.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full">
        {MOCK_GUIDE_CATEGORIES.map((category) => (
          <motion.div 
            key={category.id} 
            onClick={() => setSelectedCategory(category)}
            className="card bg-white p-5 flex gap-5 items-center relative group cursor-pointer border border-slate-100 transition-all shadow-sm hover-lift"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110">
              <category.icon />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-slate-900 text-lg">{category.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{category.description}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-blue/10 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-blue" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Featured Guide Section */}
      <div className="pt-4">
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-blue/20 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/20 border border-brand-blue/30 text-brand-blue uppercase tracking-wider">
              <Star className="w-3 h-3 fill-current" /> Most Popular
            </div>
            <h3 className="text-2xl font-bold font-display">The Ultimate NIE Guide</h3>
            <p className="text-slate-400 max-w-md">Stop struggling with appointments. We've simplified the entire process for you.</p>
            <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-brand-yellow transition-colors">
              Read Guide
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MarketplaceView({ onAddAd, ads, onSelectAd, scrollToTop }: { onAddAd: () => void, ads: Ad[], onSelectAd: (ad: Ad) => void, scrollToTop?: () => void }) {
  useEffect(() => {
    scrollToTop?.();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[80vh] flex items-center justify-center p-6"
    >
      <div className="max-w-xl w-full text-center space-y-12">
        {/* Animated Icon Group */}
        <div className="relative inline-block">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="w-32 h-32 bg-brand-blue/5 rounded-[40px] flex items-center justify-center relative z-10"
          >
            <ShoppingBag className="w-12 h-12 text-brand-blue" />
          </motion.div>
          
          {/* Decorative elements */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-4 -right-4 w-12 h-12 bg-rose-100 rounded-full blur-2xl"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-8 -left-8 w-20 h-20 bg-brand-blue/20 rounded-full blur-3xl"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-black text-brand-blue uppercase tracking-[0.5em]"
            >
              Exclusive Community Area
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-black font-display text-brand-navy tracking-tight"
            >
              Marketplace <br/>
              <span className="text-brand-blue italic font-medium">Coming Soon.</span>
            </motion.h2>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 text-sm md:text-base leading-relaxed max-w-md mx-auto"
          >
            We're building a secure, private space for our community to trade, share, and connect. Stay tuned for the grand opening.
          </motion.p>
        </div>

        {/* Status indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/20" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            System Refinement in Progress
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ProfileView({ scrollToTop, onNavigate }: { scrollToTop?: () => void, onNavigate?: (view: View) => void }) {
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const userEmail = "vincentdurroux@gmail.com";
  const isAdmin = proService.isAdmin(userEmail);

  useEffect(() => {
    scrollToTop?.();
  }, [activeSubPage]);

  const menuItems = [
    ...(isAdmin ? [{ label: 'Admin Dashboard', icon: ShieldCheck, color: 'text-brand-blue', action: () => onNavigate?.('admin') }] : []),
    { label: 'Suggest a Pro', icon: Star, color: 'text-brand-yellow', action: () => setShowSuggestModal(true) },
    { label: 'Account Security', icon: Shield },
    { label: 'Change Password', icon: Lock },
    { label: 'Notifications', icon: Bell },
    { label: 'Privacy Settings', icon: Shield },
    { label: 'Support', icon: HelpCircle },
    { label: 'About', icon: Info },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-12"
    >
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-10 bg-white border-b border-slate-100">
        <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-sm overflow-hidden mb-4">
          <img src="/photo-vincent.jpg" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold font-display text-brand-navy">Vincent D.</h2>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase tracking-widest rounded-full mt-1">
              <ShieldCheck className="w-3 h-3" /> Admin
            </span>
          )}
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white border-y border-slate-100">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-50">
          <span className="font-bold text-slate-900">Account</span>
          <span className="text-sm text-slate-500">{userEmail}</span>
        </div>

        {menuItems.map((item, index) => (
          <button 
            key={index}
            onClick={() => item.action ? item.action() : setActiveSubPage(item.label)}
            className={cn(
              "w-full px-6 py-4 flex justify-between items-center active:bg-slate-50 hover:bg-slate-50/50 transition-all group",
              index !== menuItems.length - 1 && "border-b border-slate-50"
            )}
          >
            <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
              <item.icon className={cn("w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors", item.color)} />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wider">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-blue transition-colors" />
          </button>
        ))}
      </div>

      <SuggestProModal isOpen={showSuggestModal} onClose={() => setShowSuggestModal(false)} />

      {/* Logout Button */}
      <div className="px-6 mt-8">
        <button className="w-full py-4 text-slate-500 font-medium hover:text-red-500 transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Sub-pages */}
      <AnimatePresence>
        {activeSubPage === 'Account Security' && (
          <ProfileSubPage title="Account Security" onBack={() => setActiveSubPage(null)}>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <p className="font-bold text-slate-900">Login History</p>
                <div className="space-y-4">
                  {[
                    { device: 'iPhone 15 Pro', location: 'Valencia, ES', time: 'Active now' },
                    { device: 'MacBook Air', location: 'Valencia, ES', time: '2 hours ago' }
                  ].map((login, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-slate-700">{login.device}</p>
                        <p className="text-xs text-slate-400">{login.location}</p>
                      </div>
                      <span className="text-xs text-slate-400">{login.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'Change Password' && (
          <ProfileSubPage title="Change Password" onBack={() => setActiveSubPage(null)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-blue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-blue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-blue outline-none" />
              </div>
              <button className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-blue/20 mt-4">
                Update Password
              </button>
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'Notifications' && (
          <ProfileSubPage title="Notifications" onBack={() => setActiveSubPage(null)}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {[
                { title: 'Push Notifications', desc: 'Receive alerts on your device' },
                { title: 'Email Updates', desc: 'Weekly community highlights' },
                { title: 'Booking Reminders', desc: 'Stay on top of your schedule' },
                { title: 'Marketplace Alerts', desc: 'When items you follow are listed' }
              ].map((item, i) => (
                <div key={i} className={cn(
                  "p-6 flex items-center justify-between",
                  i !== 3 && "border-b border-slate-50"
                )}>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                    i < 2 ? "bg-brand-blue" : "bg-slate-200"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                      i < 2 ? "right-1" : "left-1"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'Privacy Settings' && (
          <ProfileSubPage title="Privacy Settings" onBack={() => setActiveSubPage(null)}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {[
                { title: 'Public Profile', desc: 'Allow others to see your profile' },
                { title: 'Show Activity', desc: 'Show when you are online' },
                { title: 'Data Sharing', desc: 'Share anonymous usage data' }
              ].map((item, i) => (
                <div key={i} className={cn(
                  "p-6 flex items-center justify-between",
                  i !== 2 && "border-b border-slate-50"
                )}>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                    i === 0 ? "bg-brand-blue" : "bg-slate-200"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                      i === 0 ? "right-1" : "left-1"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'Support' && (
          <ProfileSubPage title="Support" onBack={() => setActiveSubPage(null)}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <button className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-brand-blue/30 transition-all w-full">
                  <div className="w-12 h-12 bg-brand-blue/5 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-brand-blue" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 text-lg">Email Us</p>
                    <p className="text-sm text-slate-500">support@valenciaguide.com</p>
                  </div>
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <p className="p-6 font-bold text-slate-900 border-b border-slate-50">Frequently Asked Questions</p>
                {[
                  'How do I book a professional?',
                  'What is the cancellation policy?',
                  'How can I list an item in marketplace?',
                  'Is my payment secure?'
                ].map((q, i) => (
                  <button key={i} className="w-full p-6 flex justify-between items-center hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{q}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </ProfileSubPage>
        )}

        {activeSubPage === 'About' && (
          <ProfileSubPage title="About Unlock'd" onBack={() => setActiveSubPage(null)}>
            <div className="flex flex-col items-center text-center space-y-8 py-8">
              <Logo className="scale-125 mb-4" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-display">Unlock'd Community</h3>
                <p className="text-slate-500 italic max-w-xs">Helping you unlock your new city through community-vetted professionals.</p>
                <p className="text-slate-400 text-xs mt-2 font-mono uppercase tracking-widest">Version 1.3.0</p>
              </div>
              <div className="w-full space-y-2 px-2">
                {['Terms of Service', 'Privacy Policy', 'Community Guidelines'].map((item, i) => (
                  <button key={i} className="w-full p-4 bg-white rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <span className="font-medium text-slate-700">{item}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">© 2024 Unlock'd. All rights reserved.</p>
            </div>
          </ProfileSubPage>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProfileSubPage({ title, onBack, children }: { title: string, onBack: () => void, children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-slate-50 z-[60] flex flex-col"
    >
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h2 className="text-xl font-bold font-display text-brand-navy">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {children}
      </div>
    </motion.div>
  );
}

function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Background Panels for the "Door" effect */}
      <motion.div 
        className="absolute inset-y-0 left-0 w-1/2 bg-white z-0"
        initial={{ x: 0 }}
        exit={{ x: '-100%', transition: { duration: 0.8, ease: [0.7, 0, 0.3, 1] } }}
      />
      <motion.div 
        className="absolute inset-y-0 right-0 w-1/2 bg-white z-0"
        initial={{ x: 0 }}
        exit={{ x: '100%', transition: { duration: 0.8, ease: [0.7, 0, 0.3, 1] } }}
      />

      <motion.div 
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 1 }}
        exit={{ 
          opacity: 0, 
          scale: 1.1,
          filter: "blur(10px)",
          transition: { duration: 0.5, ease: "easeIn" } 
        }}
      >
        <div className="relative flex items-center justify-center h-48 mb-12">
          <motion.img
            src="/logo.png"
            alt="Unlock'd Logo"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              filter: "blur(0px)",
              rotate: [0, -5, 5, -5, 5, 0], // Shake animation
            }}
            transition={{ 
              opacity: { duration: 1.2, delay: 0.2 },
              scale: { duration: 1.2, delay: 0.2 },
              filter: { duration: 1.2, delay: 0.2 },
              rotate: { delay: 1.8, duration: 0.4, ease: "easeInOut" } // Key turn shake
            }}
            className="h-32 md:h-40 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Tagline and Progress Bar - Sits BELOW the arcs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <p className="text-xs md:text-sm font-medium text-slate-500 whitespace-nowrap px-4 text-center">
            Real people. Trusted <span className="text-brand-blue">recommendations</span>
          </p>
          
          {/* Loading Progress Bar */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "140px", opacity: 1 }}
            transition={{ delay: 1.8, duration: 1.2, ease: "easeInOut" }}
            className="h-[3px] bg-brand-blue/10 mt-8 rounded-full overflow-hidden relative"
          >
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-brand-blue"
            />
          </motion.div>
        </motion.div>
      </motion.div>


    </motion.div>
  );
}
