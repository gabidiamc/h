import React from "react";
import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { useApp } from "../context/AppContext";

interface FloatingChatWidgetProps {
  onOpenAuth?: () => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({ onOpenAuth }) => {
  const { isChatOpen, setIsChatOpen, chatConversations, isAdmin, currentUser, showToast } =
    useApp();

  const totalUnread = isAdmin
    ? chatConversations.reduce((acc, c) => acc + (c.unreadByAdmin || 0), 0)
    : chatConversations.reduce((acc, c) => acc + (c.unreadByCustomer || 0), 0);

  // If chat is open, do not display floating button
  if (isChatOpen) return null;

  const handleClick = () => {
    if (!currentUser) {
      if (onOpenAuth) {
        onOpenAuth();
      }
      showToast({
        title: "Cuenta requerida para el chat",
        subtitle:
          "Para chatear directamente con la dueña Monse necesitas crear o ingresar a tu cuenta.",
      });
      setIsChatOpen(true);
    } else {
      setIsChatOpen(true);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto">
      {/* Main Internal Chat Trigger Button (Icon only) */}
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        className="group relative w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-tr from-stone-950 via-stone-900 to-rose-950 text-white rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_32px_rgba(244,63,94,0.35)] transition-all duration-300 cursor-pointer border border-rose-500/30 animate-gentle-float"
        title={
          currentUser
            ? "Chat en vivo con Monse (Dueña del taller)"
            : "Inicia sesión para chatear con Monse"
        }
        aria-label="Chat con Monse"
      >
        <MessageCircle className="w-6 h-6 text-rose-300 group-hover:rotate-12 group-hover:text-rose-200 transition-all duration-300" />

        {/* Glowing aura */}
        <span className="absolute inset-0 rounded-full bg-rose-500/10 -z-10 blur-sm group-hover:bg-rose-500/25 transition-all" />

        {totalUnread > 0 ? (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-subtle-pulse shadow-[0_2px_8px_rgba(225,29,72,0.5)] border border-white/80">
            {totalUnread}
          </span>
        ) : (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-stone-900 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        )}
      </motion.button>
    </div>
  );
};
