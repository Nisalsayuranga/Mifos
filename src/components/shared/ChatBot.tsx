"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Home, MapPin, DollarSign, Phone, ChevronDown, Minimize2, Sparkles } from "lucide-react";
import { PROPERTIES, DISTRICTS, PROPERTY_TYPES_OPTIONS, formatLKR, Property } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { adaptProperty } from "@/lib/adapters";
// ─── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  time: string;
  quickReplies?: string[];
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────
const PROPIX_KB = {
  name: "PROPIX",
  tagline: "Find the Right Property. Make the Right Move.",
  description: "Sri Lanka's most trusted digital real estate platform.",
  contact: {
    phone: "+94 11 234 5678",
    email: "info@propix.lk",
    address: "PROPIX Head Office, Colombo, Sri Lanka",
  },
  services: [
    { name: "Buy Property", path: "/properties", desc: "Browse verified properties for sale across Sri Lanka." },
    { name: "Rent Property", path: "/properties?type=rent", desc: "Find apartments, houses & commercial spaces for rent." },
    { name: "Sell Property", path: "/listings/new", desc: "List your property and reach thousands of buyers." },
    { name: "Property Valuation", path: "/valuation", desc: "Get a certified valuation from our professionals." },
    { name: "Book Consultation", path: "/consultation", desc: "Talk to a certified PROPIX agent for guidance." },
    { name: "Financing / Mortgage", path: "/financing", desc: "Explore home loan options and check eligibility." },
    { name: "Find an Agent", path: "/agents", desc: "Connect with verified real estate agents." },
    { name: "Map Search", path: "/map", desc: "Search properties by location on an interactive map." },
  ],
  districts: DISTRICTS,
  propertyTypes: PROPERTY_TYPES_OPTIONS.map((o) => o.label),
  stats: {
    totalProperties: PROPERTIES.filter((p) => p.status === "approved").length,
    featuredProperties: PROPERTIES.filter((p) => p.featured && p.status === "approved").length,
    districts: DISTRICTS.length,
  },
};

// ─── Intent Matching ─────────────────────────────────────────────────────────
function matchIntent(input: string, liveProperties: Property[] = PROPERTIES): { intent: string; data?: unknown } {
  const q = input.toLowerCase();

  if (/hi|hello|hey|good\s*(morning|evening|afternoon)|howdy/.test(q))
    return { intent: "greeting" };

  if (/buy|purchase|for sale|sale/.test(q) && !/how to sell/.test(q))
    return { intent: "buy" };

  if (/rent|lease|monthly/.test(q))
    return { intent: "rent" };

  if (/sell|list.*property|add.*property/.test(q))
    return { intent: "sell" };

  if (/valuat|apprais|price estimate|how much.*worth/.test(q))
    return { intent: "valuation" };

  if (/consult|agent|talk to|speak|expert/.test(q))
    return { intent: "consultation" };

  if (/financ|loan|mortgage|bank|credit/.test(q))
    return { intent: "financing" };

  if (/map|location|area|search by/.test(q))
    return { intent: "map" };

  if (/contact|phone|email|address|reach/.test(q))
    return { intent: "contact" };

  if (/district|area|city|where|region|province/.test(q))
    return { intent: "districts" };

  if (/type|kind|category|apartment|house|villa|land|commercial/.test(q))
    return { intent: "property_types" };

  // property search by district
  for (const d of DISTRICTS) {
    if (q.includes(d.toLowerCase())) {
      const props = liveProperties.filter(
        (p) => p.district.toLowerCase() === d.toLowerCase() && (p.status === "approved" || p.status === "published")
      );
      return { intent: "search_district", data: { district: d, props } };
    }
  }

  // price range queries
  if (/cheap|affordable|budget|low price/.test(q)) return { intent: "budget_properties" };
  if (/luxury|premium|expensive|high end/.test(q)) return { intent: "luxury_properties" };
  if (/featured|top|popular|best/.test(q)) return { intent: "featured_properties" };

  if (/how.*work|process|step|guide/.test(q)) return { intent: "how_it_works" };
  if (/about|who are you|what is propix/.test(q)) return { intent: "about" };
  if (/register|sign up|create account|login|sign in/.test(q)) return { intent: "auth" };
  if (/thank|thanks|great|awesome|perfect|bye|goodbye/.test(q)) return { intent: "thanks" };
  if (/help|what can you|options|menu/.test(q)) return { intent: "help" };

  return { intent: "fallback" };
}

// ─── Response Generator ───────────────────────────────────────────────────────
function generateResponse(input: string, liveProperties: Property[] = PROPERTIES): { text: string; quickReplies?: string[] } {
  const { intent, data } = matchIntent(input, liveProperties);
  const kb = {
    ...PROPIX_KB,
    stats: {
      ...PROPIX_KB.stats,
      totalProperties: liveProperties.filter(p => p.status === "approved" || p.status === "published").length,
      featuredProperties: liveProperties.filter((p) => p.featured && (p.status === "approved" || p.status === "published")).length,
    }
  };

  switch (intent) {
    case "greeting":
      return {
        text: `👋 Hello! Welcome to **PROPIX** — ${kb.tagline}\n\nI'm your AI property assistant. I can help you find properties, understand our services, get valuations, and much more across Sri Lanka!\n\nHow can I assist you today?`,
        quickReplies: ["Browse properties", "Sell my property", "Get a valuation", "Find an agent"],
      };

    case "buy":
      return {
        text: `🏠 Great! We have **${kb.stats.totalProperties} verified properties** for sale across Sri Lanka.\n\n**Popular districts:** Colombo, Gampaha, Kandy, Galle\n\n**Property types available:**\n• Houses & Villas\n• Apartments & Condominiums\n• Land (Residential & Commercial)\n• Agricultural Land\n\nYou can browse all listings or filter by district, price, and type.`,
        quickReplies: ["Properties in Colombo", "Properties in Galle", "Luxury properties", "Browse all listings"],
      };

    case "rent":
      return {
        text: `🔑 Looking to rent? We have rental listings across Sri Lanka:\n\n**Available rentals include:**\n• Studio apartments from **LKR 38,000/mo**\n• 2-bedroom apartments from **LKR 65,000/mo**\n• Commercial spaces from **LKR 180,000/mo**\n\nAll verified and managed by certified PROPIX agents.`,
        quickReplies: ["Apartments for rent", "Commercial spaces", "Houses for rent", "Search by location"],
      };

    case "sell":
      return {
        text: `💼 Ready to sell? Here's how PROPIX makes it simple:\n\n**1. Add Property** — Upload details & photos\n**2. Upload Docs** — Submit title & legal docs\n**3. Admin Review** — We verify everything\n**4. Go Live** — Your listing reaches thousands\n**5. Receive Offers** — Manage buyer interest\n**6. Close the Deal** — Secure and fast\n\nCreate a seller account to get started, or book a consultation for expert guidance!`,
        quickReplies: ["Add my property", "Book consultation", "Get valuation first", "Talk to an agent"],
      };

    case "valuation":
      return {
        text: `📊 Property valuation helps you sell at the right price and builds buyer trust.\n\n**PROPIX offers 2 types:**\n\n🖥️ **Digital Valuation** — Fast estimate based on comparable sales. Available online instantly.\n\n👔 **Professional Valuation** — Certified assessment by a licensed valuer. Accepted by banks & courts.\n\nVisit our Valuation page to request yours!`,
        quickReplies: ["Get digital valuation", "Book professional valuation", "How long does it take?", "Valuation costs"],
      };

    case "consultation":
      return {
        text: `🤝 Our certified PROPIX agents are here to guide you!\n\n**Consultation types:**\n• 🏠 Buying guidance\n• 💼 Selling strategy\n• 📈 Investment advice\n• 💬 General property queries\n\n**Our top agents:**\n• Dinesh Rajapaksa — +94 77 567 8901\n• Sachini Mendis — +94 75 678 9012\n\nBook a consultation and we'll match you with the right agent!`,
        quickReplies: ["Book a consultation", "Find agents", "Call an agent", "Investment advice"],
      };

    case "financing":
      return {
        text: `💰 PROPIX connects you with Sri Lanka's leading mortgage lenders!\n\n**Our financing support:**\n• Check your loan eligibility instantly\n• Compare rates from multiple banks\n• Get referred to the best lender for your needs\n\n**Typical loan terms:**\n• Up to 70–80% LTV financing\n• Tenures up to 30 years\n• Competitive interest rates\n\nFill out a quick form and we'll match you with the right bank!`,
        quickReplies: ["Check eligibility", "Learn about mortgages", "Talk to a finance expert", "Calculate EMI"],
      };

    case "map":
      return {
        text: `🗺️ Our interactive map lets you explore properties by exact location!\n\n**Map features:**\n• Visual property pins across Sri Lanka\n• Filter by district, type & price\n• View nearby amenities\n• Click any pin to see full listing details\n\nPerfect for finding properties near your workplace, school, or preferred neighborhood.`,
        quickReplies: ["Open map", "Search Colombo", "Search Kandy", "All listings"],
      };

    case "contact":
      return {
        text: `📞 **Contact PROPIX**\n\n🏢 **Head Office:**\n${kb.contact.address}\n\n📱 **Phone:** ${kb.contact.phone}\n📧 **Email:** ${kb.contact.email}\n\n⏰ **Office Hours:**\nMonday – Friday: 8:30 AM – 5:30 PM\nSaturday: 9:00 AM – 1:00 PM\n\nYou can also reach us through the Contact page on our website.`,
        quickReplies: ["Book a call", "Send email", "Visit office", "Chat with agent"],
      };

    case "districts":
      return {
        text: `📍 **PROPIX covers ${kb.stats.districts} districts across Sri Lanka:**\n\n${kb.districts.slice(0, 9).join(" • ")}\n\n…and many more! We cover all major provinces including Western, Central, Southern, North Western, Sabaragamuwa, and Uva.\n\nWhich district are you interested in?`,
        quickReplies: ["Colombo", "Kandy", "Galle", "Kurunegala"],
      };

    case "property_types":
      return {
        text: `🏗️ **Property types on PROPIX:**\n\n${kb.propertyTypes.map((t) => `• ${t}`).join("\n")}\n\nAll listings are verified and include detailed photos, floor plans, and legal status. Which type interests you?`,
        quickReplies: ["Houses", "Apartments", "Villas", "Land"],
      };

    case "search_district": {
      const { district, props } = data as { district: string; props: Property[] };
      if (props.length === 0) {
        return {
          text: `🔍 No current listings in **${district}**, but new properties are added daily!\n\nSet up a property alert or explore nearby districts.`,
          quickReplies: ["Search nearby", "Set alert", "Browse all", "Contact agent"],
        };
      }
      const listings = props
        .slice(0, 3)
        .map((p) => `• **${p.title}** — ${p.priceLabel}`)
        .join("\n");
      return {
        text: `🏠 Found **${props.length} properties** in **${district}**:\n\n${listings}${props.length > 3 ? `\n\n…and ${props.length - 3} more!` : ""}\n\nVisit the Properties page to see all listings with photos and details.`,
        quickReplies: [`More in ${district}`, "Filter by price", "Filter by type", "Book a viewing"],
      };
    }

    case "budget_properties": {
      const budget = liveProperties.filter((p) => (p.status === "approved" || p.status === "published") && p.price < 30000000)
        .slice(0, 3)
        .map((p) => `• ${p.title} — ${p.priceLabel}`)
        .join("\n");
      return {
        text: `💡 **Affordable Properties under LKR 30M:**\n\n${budget}\n\nWe also have rental options starting from **LKR 38,000/month**!`,
        quickReplies: ["See all budget", "Rental options", "Financing help", "Book consultation"],
      };
    }

    case "luxury_properties": {
      const luxury = liveProperties.filter((p) => (p.status === "approved" || p.status === "published") && p.price > 50000000)
        .slice(0, 3)
        .map((p) => `• ${p.title} — ${p.priceLabel}`)
        .join("\n");
      return {
        text: `✨ **Luxury Properties:**\n\n${luxury}\n\nAll our luxury listings are verified, professionally photographed, and handled by our senior agents.`,
        quickReplies: ["Villas in Colombo", "Beachfront properties", "Talk to premium agent", "Book private viewing"],
      };
    }

    case "featured_properties": {
      const featured = liveProperties.filter((p) => p.featured && (p.status === "approved" || p.status === "published"))
        .slice(0, 4)
        .map((p) => `• ${p.title} — ${p.priceLabel}`)
        .join("\n");
      return {
        text: `⭐ **Featured Properties:**\n\n${featured}\n\nThese are our most popular, verified listings with the highest buyer interest!`,
        quickReplies: ["Browse featured", "Filter by area", "Book a viewing", "Contact agent"],
      };
    }

    case "how_it_works":
      return {
        text: `⚙️ **How PROPIX Works:**\n\n**For Buyers:**\n1. Search or browse properties\n2. Shortlist your favorites\n3. Request a viewing or consultation\n4. Apply for financing if needed\n5. Make an offer & close the deal\n\n**For Sellers:**\n1. Register & list your property\n2. Upload title documents\n3. PROPIX verifies & publishes\n4. Receive buyer offers\n5. Close with our agent support\n\nSimple, secure, and transparent!`,
        quickReplies: ["I'm a buyer", "I'm a seller", "Talk to agent", "Learn more"],
      };

    case "about":
      return {
        text: `🌿 **About PROPIX**\n\n${kb.description}\n\nWe believe everyone deserves transparent, trustworthy real estate services. PROPIX brings together buyers, sellers, agents, and financial partners under one roof.\n\n**What makes us different:**\n• ✅ 100% verified listings\n• 🤝 Certified professional agents\n• 🏦 Bank-linked financing support\n• 📊 Free property valuations\n• 🗺️ Interactive map search`,
        quickReplies: ["Our services", "Find properties", "Contact us", "How it works"],
      };

    case "auth":
      return {
        text: `🔐 **Join PROPIX — It's Free!**\n\nCreate your account to:\n• Save favorite properties\n• Receive property alerts\n• Manage your listings (sellers)\n• Track consultation requests\n• Access financing tools\n\n**Demo Accounts available:**\n• Seller: priya@example.com\n• Buyer: amali@example.com\n• Agent: dinesh@propix.lk`,
        quickReplies: ["Sign up now", "Login", "Learn about roles", "Demo account"],
      };

    case "thanks":
      return {
        text: `😊 You're very welcome! It's my pleasure to help.\n\nIf you need anything else — property searches, service info, or expert advice — I'm always here.\n\n**Happy house hunting with PROPIX!** 🏡`,
        quickReplies: ["Browse properties", "Contact us", "Back to start"],
      };

    case "help":
      return {
        text: `💬 **Here's what I can help you with:**\n\n🏠 **Properties** — Find, filter & explore listings\n💼 **Selling** — List your property step-by-step\n📊 **Valuation** — Get your property assessed\n🤝 **Consultation** — Connect with expert agents\n💰 **Financing** — Explore mortgage options\n📍 **Areas** — Search by district or city\n📞 **Contact** — Get in touch with us\n\nJust ask me anything!`,
        quickReplies: ["Find properties", "Sell property", "Get valuation", "Contact PROPIX"],
      };

    default:
      return {
        text: `🤔 I'm not quite sure about that — but I'm here to help with anything PROPIX-related!\n\nYou can ask me about:\n• **Properties** for sale or rent\n• **Selling** your property\n• **Valuations** and **financing**\n• **Districts** and property types\n• **Contacting** our team\n\nWhat would you like to know?`,
        quickReplies: ["Browse properties", "Our services", "Contact us", "How it works"],
      };
  }
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
    );
    return (
      <span key={i}>
        {rendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

function formatTime() {
  return new Date().toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [liveProperties, setLiveProperties] = useState<Property[]>(PROPERTIES);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase.from("properties").select("*, property_images(storage_path)").in("status", ["approved", "published"]);
      if (data) {
        setLiveProperties(data.map(d => adaptProperty(d)));
      }
    }
    loadData();
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: `👋 Hi! I'm **PROPIX Assistant** — your AI guide for Sri Lankan real estate.\n\nHow can I help you today?`,
      time: formatTime(),
      quickReplies: ["Browse properties", "Sell my property", "Get a valuation", "Contact us"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) setHasUnread(true);
  }, [messages, isOpen]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text: text.trim(),
        time: formatTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      const delay = 700 + Math.random() * 600;
      setTimeout(() => {
        const response = generateResponse(text, liveProperties);
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          text: response.text,
          time: formatTime(),
          quickReplies: response.quickReplies,
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, delay);
    },
    [liveProperties]
  );

  const handleSend = () => sendMessage(input);
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="chatbot-toggle"
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? "opacity-0 pointer-events-none scale-75" : "opacity-100 scale-100"}`}
        style={{ background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)" }}
        aria-label="Open PROPIX Chat Assistant"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold animate-bounce">!</span>
        )}
      </button>

      {/* Chat Window */}
      <div
        id="chatbot-window"
        className={`fixed bottom-6 right-6 z-50 w-[370px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        } ${isMinimized ? "h-[64px]" : "h-[580px] max-h-[80vh]"}`}
        style={{ background: "#FFFFFF" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0 cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)" }}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm font-heading leading-tight">PROPIX Assistant</p>
            <p className="text-white/70 text-[10px] leading-tight">AI-powered · Usually replies instantly</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Minimize"
            >
              <ChevronDown className={`w-4 h-4 text-white transition-transform duration-300 ${isMinimized ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Quick nav pills */}
            <div className="flex gap-2 px-3 py-2 overflow-x-auto flex-shrink-0 scrollbar-none" style={{ background: "#F5F0E8" }}>
              {[
                { icon: Home, label: "Properties", q: "Browse properties" },
                { icon: DollarSign, label: "Valuation", q: "Get a valuation" },
                { icon: MapPin, label: "Map", q: "Map search" },
                { icon: Phone, label: "Contact", q: "Contact PROPIX" },
              ].map(({ icon: Icon, label, q }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(q)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border border-border bg-white hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shrink-0"
                  style={{ color: "#1B4332" }}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ background: "#FAF9F6" }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "bot" ? "bg-primary/10" : "bg-secondary/20"}`}>
                    {msg.role === "bot"
                      ? <Bot className="w-4 h-4" style={{ color: "#1B4332" }} />
                      : <User className="w-4 h-4" style={{ color: "#D4A574" }} />
                    }
                  </div>

                  <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "bot"
                          ? "rounded-tl-sm text-foreground"
                          : "rounded-tr-sm text-white"
                      }`}
                      style={
                        msg.role === "bot"
                          ? { background: "#FFFFFF", border: "1px solid #E8E3DC", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }
                          : { background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }
                      }
                    >
                      {renderText(msg.text)}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">{msg.time}</span>

                    {/* Quick Replies */}
                    {msg.quickReplies && msg.role === "bot" && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {msg.quickReplies.map((qr) => (
                          <button
                            key={qr}
                            onClick={() => sendMessage(qr)}
                            className="text-xs px-3 py-1.5 rounded-full border font-medium hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 active:scale-95"
                            style={{ borderColor: "#1B4332", color: "#1B4332", background: "white" }}
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" style={{ color: "#1B4332" }} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-border shadow-sm flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-3 border-t border-border bg-white">
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2 border border-border focus-within:border-primary transition-colors">
                <input
                  ref={inputRef}
                  id="chatbot-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about properties, services…"
                  className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  maxLength={300}
                />
                <button
                  id="chatbot-send"
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: input.trim() ? "linear-gradient(135deg, #1B4332, #2D6A4F)" : "#E8E3DC" }}
                  aria-label="Send message"
                >
                  <Send className={`w-4 h-4 ${input.trim() ? "text-white" : "text-muted-foreground"}`} />
                </button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                Powered by PROPIX AI · Sri Lanka Real Estate
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
