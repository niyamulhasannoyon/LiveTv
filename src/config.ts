/**
 * GOPLAY OTT Live Configuration File
 * 
 * এই ফাইল থেকে আপনি ওয়েবসাইটের সমস্ত লাইভ ম্যাচ, স্লাইডার, আপকামিং শিডিউল, 
 * চ্যানেল ক্যাটাগরি এবং স্ট্যাটিক পেজের কন্টেন্ট সহজেই পরিবর্তন করতে পারবেন।
 */

export interface Team {
  name: string;
  code: string; // e.g. "ARG", "EGY", "FRA", "MAR", "ZIM", "BAN"
  flagCode: string; // ISO 2-letter flag code e.g. "ar", "eg", "fr", "ma", "zw", "bd"
  logoUrl?: string; // ঐচ্ছিক কাস্টম লোগো
}

export interface StreamSource {
  id: string;
  name: string;
  url: string; // HLS (.m3u8) অথবা Iframe embed url
  isEmbed?: boolean;
  status: 'Stable' | 'Backup' | 'Offline';
}

export interface Channel {
  id: string;
  name: string;
  logoUrl: string; // বৃত্তাকার লোগোর জন্য ইমেজ URL
  category: string; // e.g. "FIFA", "WORLD CUP", "Sports", "Entertainment", "News"
  isLive?: boolean;
  metadata?: string; // e.g. "world-cup-bdix • Global"
  country?: string;  // e.g. "Bangladesh", "India", etc.
  sources: StreamSource[];
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  tournament: string; // e.g. "FIFA WORLD CUP 2026"
  group?: string; // e.g. "Group A"
  venue?: string; // e.g. "MetLife Stadium, New York"
  date: string; // Format: "YYYY-MM-DD"
  time: string; // Format: "HH:MM PM/AM" (BD time or local match time)
  startsIn?: string; // Countdown text e.g. "02h 42m 55s"
  liveScore?: string; // Live info e.g. "188'" or "2 - 1"
  status: 'live' | 'upcoming' | 'finished';
  watchCount?: string; // e.g. "1.2M watching"
  sources: StreamSource[];
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  description: string;
  logoText: string;
  contactEmail: string;
  
  // Featured match slides for home carousel
  featuredSlides: Match[];

  // Channels list
  channels: Channel[];

  // All schedules
  schedules: Match[];

  // Static pages
  pages: {
    about: {
      title: string;
      content: string[];
    };
    privacy: {
      title: string;
      lastUpdated: string;
      sections: { heading: string; text: string }[];
    };
    terms: {
      title: string;
      lastUpdated: string;
      sections: { heading: string; text: string }[];
    };
    contact: {
      title: string;
      subtitle: string;
      address: string;
      phone: string;
      email: string;
    };
  };
}

export const siteConfig: SiteConfig = {
  siteName: "LIVE TV",
  tagline: "Your Ultimate Destination for Live OTT Streaming",
  description: "Watch live matches, sports channels, and entertainment in premium dark layout with glassmorphic cards.",
  logoText: "LIVE TV",
  contactEmail: "support@livetv.com",

  featuredSlides: [
    {
      id: "match-feat-1",
      homeTeam: { name: "Argentina", code: "ARG", flagCode: "ar" },
      awayTeam: { name: "Egypt", code: "EGY", flagCode: "eg" },
      tournament: "FIFA WORLD CUP 2026",
      date: "2026-07-14",
      time: "10:00 PM",
      startsIn: "02h 42m 55s",
      status: "upcoming",
      sources: [
        { id: "src-arg-egy-1", name: "TSN SPORTS FHD", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }
      ]
    },
    {
      id: "match-feat-2",
      homeTeam: { name: "France", code: "FRA", flagCode: "fr" },
      awayTeam: { name: "Morocco", code: "MAR", flagCode: "ma" },
      tournament: "FIFA WORLD CUP 2026",
      date: "2026-07-14",
      time: "11:30 PM",
      startsIn: "04h 55m 41s",
      status: "upcoming",
      sources: [
        { id: "src-fra-mar-1", name: "FOX ONE - AQ", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }
      ]
    }
  ],

  channels: [
    {
      id: "ch-1",
      name: "TSN SPORTS FHD",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=150&auto=format&fit=crop",
      category: "Sports",
      isLive: true,
      metadata: "world-cup-bdix • Global",
      sources: [{ id: "src-ch1", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-2",
      name: "AlJazeera",
      logoUrl: "https://images.unsplash.com/photo-1495020689067-958852a6565d?q=80&w=150&auto=format&fit=crop",
      category: "News",
      isLive: true,
      metadata: "aljazeera-stream • Global",
      sources: [{ id: "src-ch2", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-3",
      name: "Somoy TV",
      logoUrl: "https://images.unsplash.com/photo-1546422904-90eabf3bac0a?q=80&w=150&auto=format&fit=crop",
      category: "News",
      isLive: true,
      metadata: "somoy-news • BD Local",
      sources: [{ id: "src-ch3", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-4",
      name: "FOX ONE - AQ",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=150&auto=format&fit=crop",
      category: "Sports",
      isLive: true,
      metadata: "fox-sports • US",
      sources: [{ id: "src-ch4", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-5",
      name: "Bijoy TV",
      logoUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=150&auto=format&fit=crop",
      category: "Entertainment",
      isLive: false,
      metadata: "bijoy-tv • BD Local",
      sources: [{ id: "src-ch5", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-6",
      name: "Asian TV",
      logoUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop",
      category: "Entertainment",
      isLive: false,
      metadata: "asian-tv • BD Local",
      sources: [{ id: "src-ch6", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-7",
      name: "Channel i",
      logoUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=150&auto=format&fit=crop",
      category: "Entertainment",
      isLive: false,
      metadata: "channel-i • BD Local",
      sources: [{ id: "src-ch7", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-8",
      name: "Pogo",
      logoUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=150&auto=format&fit=crop",
      category: "Entertainment",
      isLive: false,
      metadata: "pogo-cartoon • Kids",
      sources: [{ id: "src-ch8", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-9",
      name: "Zee Cinema",
      logoUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=150&auto=format&fit=crop",
      category: "Entertainment",
      isLive: true,
      metadata: "zee-cinema • Global",
      sources: [{ id: "src-ch9", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-10",
      name: "WOF 1",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=150&auto=format&fit=crop",
      category: "FIFA",
      isLive: true,
      metadata: "ayna-ott-playlists • Global",
      sources: [{ id: "src-ch10", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-11",
      name: "Golf Channel",
      logoUrl: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=150&auto=format&fit=crop",
      category: "Sports",
      isLive: true,
      metadata: "ayna-ott-playlists • Global",
      sources: [{ id: "src-ch11", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    },
    {
      id: "ch-12",
      name: "Xtrem Sports",
      logoUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=150&auto=format&fit=crop",
      category: "WORLD CUP",
      isLive: true,
      metadata: "ayna-ott-playlists • Global",
      sources: [{ id: "src-ch12", name: "Server 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }]
    }
  ],

  schedules: [
    {
      id: "match-1",
      homeTeam: { name: "Argentina", code: "ARG", flagCode: "ar" },
      awayTeam: { name: "Egypt", code: "EGY", flagCode: "eg" },
      tournament: "FIFA WORLD CUP 2026",
      date: "2026-07-14",
      time: "10:00 PM",
      startsIn: "02h 42m 55s",
      status: "upcoming",
      sources: [
        { id: "src-1a", name: "TSN SPORTS FHD", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }
      ]
    },
    {
      id: "match-2",
      homeTeam: { name: "Zimbabwe", code: "ZIM", flagCode: "zw" },
      awayTeam: { name: "Bangladesh", code: "BAN", flagCode: "bd" },
      tournament: "BANGLADESH TOUR OF ZIMBABWE 2026",
      date: "2026-07-13",
      time: "08:30 PM",
      liveScore: "188'",
      status: "live",
      sources: [
        { id: "src-2a", name: "FOX ONE - AQ", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }
      ]
    },
    {
      id: "match-3",
      homeTeam: { name: "India", code: "IND", flagCode: "in" },
      awayTeam: { name: "England", code: "ENG", flagCode: "gb-eng" },
      tournament: "INDIA TOUR OF ENGLAND 2026 - 4TH T20",
      date: "2026-07-15",
      time: "07:00 PM",
      startsIn: "1d 21h",
      status: "upcoming",
      sources: [
        { id: "src-3a", name: "Willow TV", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", status: "Stable" }
      ]
    }
  ],

  pages: {
    about: {
      title: "About LIVE TV",
      content: [
        "LIVE TV is a state-of-the-art sports streaming platform dedicated to bringing you the most exciting sports action from around the world in real-time.",
        "Our mission is to provide sports enthusiasts with a seamless, high-performance, and buffer-free viewing experience. With a minimalist design and a dark glassmorphic interface, we focus on what matters most—the game.",
        "Whether you are a fan of Football, Cricket, Tennis, or Basketball, LIVE TV ensures that you never miss a match, a goal, or a wicket. Join millions of fans worldwide and enjoy the game!"
      ]
    },
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "July 13, 2026",
      sections: [
        {
          heading: "1. Information We Collect",
          text: "We collect basic network configuration data to deliver video streams efficiently. We do not require account registration or store personal identifier data."
        },
        {
          heading: "2. Cookies and Tracking",
          text: "We use essential cookies to maintain player settings and track anonymous stream performance metrics to improve overall server stability."
        }
      ]
    },
    terms: {
      title: "Terms of Service",
      lastUpdated: "July 13, 2026",
      sections: [
        {
          heading: "1. Acceptance of Terms",
          text: "By accessing LIVE TV, you agree to comply with and be bound by these terms. If you do not agree, please do not use our services."
        },
        {
          heading: "2. Streaming & Fair Use",
          text: "Our platform aggregates publicly available live feeds and player links. All copyright ownership belongs to the respective content broadcasters."
        }
      ]
    },
    contact: {
      title: "Get in Touch",
      subtitle: "Have a question or feedback? We'd love to hear from you. Drop us a message!",
      address: "Dhaka, Bangladesh",
      phone: "+880 1234-567890",
      email: "support@livetv.com"
    }
  }
};
