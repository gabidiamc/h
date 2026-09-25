import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Clock,
  Check,
  CheckCheck,
  User,
  Phone,
  ShieldCheck,
  Trash2,
  CornerDownRight,
  ExternalLink,
  ChevronLeft,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Upload,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Type,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ChatConversation } from "../types";
import { fileToOptimizedImage } from "../lib/imageUpload";
import { FormattedChatMessage } from "./FormattedChatMessage";

interface InternalChatDrawerProps {
  onOpenAuth?: (mode?: "login" | "register") => void;
}

export const InternalChatDrawer: React.FC<InternalChatDrawerProps> = ({ onOpenAuth }) => {
  const {
    isChatOpen,
    setIsChatOpen,
    chatConversations,
    sendChatMessage,
    markChatAsRead,
    deleteChatConversation,
    currentUser,
    isAdmin,
    siteSettings,
    chatDraftMessage,
    setChatDraftMessage,
  } = useApp();

  // Active conversation selection
  const [selectedConvoId, setSelectedConvoId] = useState<string>("conv-1");
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string>("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [inspectingImage, setInspectingImage] = useState<string | null>(null);

  // Typography font style for input/preview
  const [selectedFontStyle, setSelectedFontStyle] = useState<"sans" | "serif" | "mono" | "cursive">("sans");

  // Sync draft message if opened with a pre-filled text
  useEffect(() => {
    if (chatDraftMessage) {
      setInputText(chatDraftMessage);
      setChatDraftMessage("");
    }
  }, [chatDraftMessage, setChatDraftMessage]);

  // Quote Modal for Admin (Dar Precio & Tiempo de Entrega)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteTime, setQuoteTime] = useState("3 a 5 días hábiles");
  const [quoteNotes, setQuoteNotes] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selected conversation for current user
  useEffect(() => {
    if (!isChatOpen) return;

    if (isAdmin) {
      if (chatConversations.length > 0) {
        const exists = chatConversations.some((c) => c.id === selectedConvoId);
        if (!exists) {
          setSelectedConvoId(chatConversations[0].id);
        }
      }
    } else if (currentUser) {
      const userConvo = chatConversations.find(
        (c) => c.customerId === currentUser.id || c.customerEmail === currentUser.email,
      );
      if (userConvo) {
        setSelectedConvoId(userConvo.id);
      } else {
        const customId = `conv-user-${currentUser.id}`;
        setSelectedConvoId(customId);
      }
    }
  }, [chatConversations, selectedConvoId, currentUser, isAdmin, isChatOpen]);

  // Mark as read whenever selected conversation changes or messages arrive
  useEffect(() => {
    if (isChatOpen && selectedConvoId) {
      markChatAsRead(selectedConvoId);
    }
  }, [isChatOpen, selectedConvoId, chatConversations.length]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isChatOpen && currentUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isChatOpen, selectedConvoId, chatConversations, currentUser]);

  if (!isChatOpen) return null;

  const currentConvo =
    chatConversations.find((c) => c.id === selectedConvoId) ||
    (currentUser
      ? {
          id: `conv-user-${currentUser.id}`,
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          customerPhone: currentUser.phone,
          unreadByAdmin: 0,
          unreadByCustomer: 0,
          updatedAt: new Date().toISOString(),
          messages: [],
        }
      : chatConversations[0]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || !currentConvo || !currentUser) return;

    sendChatMessage({
      targetConversationId: currentConvo.id,
      text: inputText.trim() || (attachedImage ? "📸 Imagen adjunta" : ""),
      imageUrl: attachedImage || undefined,
      role: isAdmin ? "admin" : "customer",
      senderName: isAdmin ? "Monce (Dueña)" : currentUser.name,
      fontStyle: selectedFontStyle,
    });
    setInputText("");
    setAttachedImage("");
  };

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    try {
      const optimized = await fileToOptimizedImage(file);
      setAttachedImage(optimized);
    } catch (err) {
      console.error("Error optimizando imagen para chat:", err);
    } finally {
      setIsProcessingImage(false);
      e.target.value = "";
    }
  };

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotePrice || !currentConvo) return;

    const formattedQuote = [
      `🌸 **COTIZACIÓN OFICIAL DEL TALLER (Monce)**`,
      `💰 **Precio:** $${Number(quotePrice).toFixed(2)} USD`,
      `⏱️ **Tiempo de Confección & Entrega:** ${quoteTime}`,
      quoteNotes.trim() ? `📝 **Detalles:** ${quoteNotes.trim()}` : null,
      `\n✨ *Si estás de acuerdo con este precio y plazo, confírmalo respondiendo a este mensaje para comenzar la confección de tu ramo artesanal.*`,
    ]
      .filter(Boolean)
      .join("\n");

    sendChatMessage({
      targetConversationId: currentConvo.id,
      text: formattedQuote,
      role: "admin",
      senderName: "Monce (Dueña)",
    });

    setIsQuoteModalOpen(false);
    setQuotePrice("");
    setQuoteNotes("");
  };

  // Helper to wrap selected text or insert markdown typography syntax
  const applyTypographyFormat = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = "texto") => {
    const input = inputRef.current;
    if (!input) {
      setInputText((prev) => `${prev}${prefix}${defaultPlaceholder}${suffix}`);
      return;
    }

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const selectedText = input.value.substring(start, end);
    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${defaultPlaceholder}${suffix}`;

    const newText = input.value.substring(0, start) + replacement + input.value.substring(end);
    setInputText(newText);

    // Reposition cursor inside wrapped text
    setTimeout(() => {
      input.focus();
      const newCursorPos = selectedText ? start + replacement.length : start + prefix.length;
      input.setSelectionRange(newCursorPos, newCursorPos + (selectedText ? 0 : defaultPlaceholder.length));
    }, 10);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsChatOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-stone-200"
          >
            {/* Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-xs shrink-0">
                  <div className="w-full h-full bg-stone-900 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-rose-300" />
                  </div>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base flex items-center gap-1.5 leading-tight">
                    <span>
                      {isAdmin ? "Bandeja de Mensajes del Taller" : "Atención con Monce (Dueña)"}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-[11px] text-stone-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                    <span>Hecho Por Monse • Chat en vivo</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isAdmin && currentConvo && (
                  <button
                    onClick={() => setIsQuoteModalOpen(true)}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-all mr-1"
                    title="Dar Precio y Tiempo de Entrega para este pedido especial"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Cotizar</span>
                  </button>
                )}

                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                  aria-label="Cerrar chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Admin: Conversation Selector Tabs if multiple */}
            {isAdmin && chatConversations.length > 1 && (
              <div className="bg-stone-100 p-2 border-b border-stone-200 flex gap-1.5 overflow-x-auto shrink-0">
                {chatConversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvoId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedConvoId === c.id
                        ? "bg-rose-700 text-white shadow-xs"
                        : "bg-white text-stone-700 hover:bg-stone-200 border border-stone-200"
                    }`}
                  >
                    <span>{c.customerName || "Cliente"}</span>
                    {(c.unreadByAdmin || 0) > 0 && (
                      <span className="px-1.5 py-0.2 text-[9px] bg-rose-500 text-white rounded-full font-bold">
                        {c.unreadByAdmin}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* If user is not logged in */}
            {!currentUser ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-stone-900">
                    Inicia Sesión para Chatear
                  </h4>
                  <p className="text-xs text-stone-500 max-w-xs mt-1">
                    Comunícate directamente con Monce para coordinar detalles de tus ramos de listón,
                    resolver dudas y recibir cotizaciones personalizadas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsChatOpen(false);
                    onOpenAuth?.("login");
                  }}
                  className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Identificarme / Iniciar Sesión
                </button>
              </div>
            ) : (
              <>
                {/* Context Sub-header */}
                {currentConvo && (
                  <div className="bg-rose-50/70 px-4 py-2 border-b border-rose-100 flex items-center justify-between text-xs text-stone-700 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-rose-950">
                        {isAdmin
                          ? `Cliente: ${currentConvo.customerName}`
                          : "Monce — Dueña del Taller"}
                      </span>
                      {currentConvo.relatedOrderNumber && (
                        <span className="bg-white border border-rose-200 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Orden #{currentConvo.relatedOrderNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        En línea
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => deleteChatConversation(currentConvo.id)}
                          className="text-stone-400 hover:text-rose-700 p-1 rounded cursor-pointer"
                          title="Eliminar conversación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50">
                  <div className="text-center my-2">
                    <span className="bg-stone-200/70 text-stone-600 text-[11px] px-3 py-1 rounded-full">
                      Chat directo con la artesana • Sin respuestas automáticas
                    </span>
                  </div>

                  {!currentConvo || currentConvo.messages.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <p className="text-xs text-stone-500">
                        Escribe a Monce para resolver dudas, coordinar detalles o recibir tu cotización.
                      </p>
                    </div>
                  ) : (
                    currentConvo.messages.map((msg) => {
                      const isCustomerMsg = msg.senderRole === "customer";
                      const isMe = isAdmin ? !isCustomerMsg : isCustomerMsg;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-end gap-1.5 max-w-[88%]">
                            {!isMe && (
                              <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-bold shrink-0 mb-1">
                                {isCustomerMsg ? "C" : "M"}
                              </div>
                            )}
                            <div
                              className={`rounded-2xl p-3 text-xs sm:text-sm shadow-2xs leading-relaxed ${
                                isMe
                                  ? "bg-rose-700 text-white rounded-br-2xs"
                                  : "bg-white border border-stone-200 text-stone-800 rounded-bl-2xs"
                              }`}
                            >
                              {/* Attached reference or shared image */}
                              {msg.imageUrl && (
                                <div className="mb-2.5 rounded-xl overflow-hidden border border-black/10 bg-black/5 max-h-56 flex items-center justify-center">
                                  <img
                                    src={msg.imageUrl}
                                    alt="Foto en el chat"
                                    onClick={() => setInspectingImage(msg.imageUrl || null)}
                                    className="w-full h-auto max-h-56 object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                  />
                                </div>
                              )}

                              {/* Formatted Message Rendering (**negrita**, *cursiva*, etc.) */}
                              <FormattedChatMessage text={msg.text} fontStyle={msg.fontStyle} />

                              <div
                                className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
                                  isMe ? "text-rose-200" : "text-stone-400"
                                }`}
                              >
                                <span>{msg.timestamp}</span>
                                {isMe && (
                                  <span>
                                    {msg.read ? (
                                      <CheckCheck className="w-3 h-3 text-rose-200" />
                                    ) : (
                                      <Check className="w-3 h-3 text-rose-300" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-stone-400 mt-0.5 px-1">
                            {msg.senderName}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Typography & Formatting Toolbar */}
                <div className="px-3 py-1.5 bg-stone-100/90 border-t border-stone-200/80 flex items-center justify-between gap-1 text-stone-600 text-xs shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase mr-1">Estilos:</span>
                    <button
                      type="button"
                      onClick={() => applyTypographyFormat("**", "**", "texto en negrita")}
                      className="p-1 rounded hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
                      title="Negrita (**texto**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTypographyFormat("*", "*", "texto en cursiva")}
                      className="p-1 rounded hover:bg-stone-200 text-stone-700 italic transition-colors cursor-pointer"
                      title="Cursiva (*texto*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTypographyFormat("__", "__", "texto subrayado")}
                      className="p-1 rounded hover:bg-stone-200 text-stone-700 underline transition-colors cursor-pointer"
                      title="Subrayado (__texto__)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTypographyFormat("~~", "~~", "texto tachado")}
                      className="p-1 rounded hover:bg-stone-200 text-stone-700 line-through transition-colors cursor-pointer"
                      title="Tachado (~~texto~~)"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTypographyFormat("`", "`", "código")}
                      className="p-1 rounded hover:bg-stone-200 text-stone-700 font-mono text-[11px] transition-colors cursor-pointer"
                      title="Monoespaciado (`texto`)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-[10px]">
                    <Type className="w-3 h-3 text-stone-400" />
                    <select
                      value={selectedFontStyle}
                      onChange={(e) => setSelectedFontStyle(e.target.value as any)}
                      className="bg-white border border-stone-200 rounded-md px-1.5 py-0.5 text-[10px] text-stone-700 font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="sans">Sans moderna</option>
                      <option value="serif">Serif elegante</option>
                      <option value="cursive">Cursiva romántica</option>
                      <option value="mono">Máquina mono</option>
                    </select>
                  </div>
                </div>

                {/* Pending Attached Image Preview */}
                {attachedImage && (
                  <div className="px-3 py-2 bg-rose-50 border-t border-rose-100 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <img
                        src={attachedImage}
                        alt="Adjunto"
                        className="w-10 h-10 object-cover rounded-lg border border-rose-200"
                      />
                      <span className="text-xs font-semibold text-rose-900">
                        Foto lista para enviar
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedImage("")}
                      className="p-1 text-rose-700 hover:text-rose-900 cursor-pointer"
                      title="Quitar foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0"
                >
                  <label
                    className="p-2 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors shrink-0"
                    title="Adjuntar foto de referencia desde dispositivo"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAttachImage}
                    />
                  </label>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isAdmin
                        ? "Escribe tu respuesta o cotización..."
                        : "Escribe tu mensaje a Monce..."
                    }
                    className={`flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white transition-all ${
                      selectedFontStyle === "serif"
                        ? "font-serif tracking-normal"
                        : selectedFontStyle === "cursive"
                          ? "font-serif italic tracking-wide"
                          : selectedFontStyle === "mono"
                            ? "font-mono"
                            : "font-sans"
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() && !attachedImage}
                    className="p-2.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 disabled:from-stone-300 disabled:to-stone-300 text-white rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(225,29,72,0.25)] disabled:shadow-none shrink-0"
                    aria-label="Enviar mensaje"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>

        {/* Modal: Monce Dar Precio & Tiempo de Entrega */}
        {isQuoteModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">
                      Dar Precio & Tiempo de Entrega
                    </h4>
                    <span className="text-[10px] text-stone-500">
                      Cliente: {currentConvo?.customerName}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendQuote} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Precio Acordado ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="Ej. 65.00"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-rose-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Tiempo en que lo puedes tener listo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 3 días hábiles, o Listo para el viernes 18"
                    value={quoteTime}
                    onChange={(e) => setQuoteTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Detalles o notas adicionales para la clienta
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Incluye listón satinado doble capa, envoltura de lujo y tarjeta personalizada..."
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(false)}
                    className="px-4 py-2 text-stone-600 rounded-xl font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Cotización</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: View Full Image */}
        {inspectingImage && (
          <div
            className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
            onClick={() => setInspectingImage(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] flex items-center justify-center">
              <img
                src={inspectingImage}
                alt="Imagen ampliada"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setInspectingImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
