import React from "react";
import {
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Video,
  Share2,
  Globe,
  MessageCircle,
} from "lucide-react";
import type { SocialPlatform } from "@/lib/social-media";

interface SocialIconProps {
  platform: SocialPlatform | string;
  className?: string;
  size?: number;
}

export function SocialPlatformIcon({ platform, className = "size-5", size }: SocialIconProps) {
  const p = platform.toLowerCase();

  if (p === "instagram") {
    return <Instagram className={className} size={size} aria-hidden="true" />;
  }
  if (p === "youtube") {
    return <Youtube className={className} size={size} aria-hidden="true" />;
  }
  if (p === "facebook") {
    return <Facebook className={className} size={size} aria-hidden="true" />;
  }
  if (p === "twitter" || p === "x") {
    return <Twitter className={className} size={size} aria-hidden="true" />;
  }
  if (p === "tiktok") {
    return <Video className={className} size={size} aria-hidden="true" />;
  }
  if (p === "whatsapp") {
    return <MessageCircle className={className} size={size} aria-hidden="true" />;
  }
  return <Share2 className={className} size={size} aria-hidden="true" />;
}

export function getSocialBadgeColorClass(platform: SocialPlatform | string): {
  badgeBg: string;
  badgeText: string;
  hoverGlow: string;
  brandName: string;
} {
  const p = platform.toLowerCase();
  switch (p) {
    case "instagram":
      return {
        badgeBg:
          "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-md shadow-pink-500/20",
        badgeText: "text-white",
        hoverGlow: "hover:shadow-pink-500/40 hover:scale-105",
        brandName: "Instagram",
      };
    case "youtube":
      return {
        badgeBg: "bg-[#FF0000] shadow-md shadow-red-600/20",
        badgeText: "text-white",
        hoverGlow: "hover:shadow-red-600/40 hover:scale-105",
        brandName: "YouTube",
      };
    case "tiktok":
      return {
        badgeBg: "bg-black text-[#25F4EE] border border-pink-500/40 shadow-md shadow-cyan-500/20",
        badgeText: "text-[#25F4EE]",
        hoverGlow: "hover:shadow-cyan-500/40 hover:scale-105",
        brandName: "TikTok",
      };
    case "facebook":
      return {
        badgeBg: "bg-[#1877F2] shadow-md shadow-blue-600/20",
        badgeText: "text-white",
        hoverGlow: "hover:shadow-blue-600/40 hover:scale-105",
        brandName: "Facebook",
      };
    case "twitter":
    case "x":
      return {
        badgeBg: "bg-black text-white border border-neutral-700 shadow-md shadow-neutral-800/20",
        badgeText: "text-white",
        hoverGlow: "hover:shadow-neutral-600/40 hover:scale-105",
        brandName: "X / Twitter",
      };
    case "whatsapp":
      return {
        badgeBg: "bg-[#25D366] shadow-md shadow-emerald-500/20",
        badgeText: "text-white",
        hoverGlow: "hover:shadow-emerald-500/40 hover:scale-105",
        brandName: "WhatsApp",
      };
    default:
      return {
        badgeBg: "bg-primary shadow-md shadow-primary/20",
        badgeText: "text-primary-foreground",
        hoverGlow: "hover:scale-105",
        brandName: "Red Social",
      };
  }
}
