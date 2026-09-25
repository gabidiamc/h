import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, Delete, X, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

interface EnterprisePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CORRECT_PIN = "4321";

export const EnterprisePinModal: React.FC<EnterprisePinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setIsError(false);
      setIsUnlocked(false);
      setErrorMessage("");
    }
  }, [isOpen]);

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen || isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pin, isUnlocked]);

  // Validate PIN whenever pin updates
  const validatePin = (candidatePin: string) => {
    // Check if matches 4321 directly, or if 5 digits were entered and starts/ends with 4321
    if (candidatePin === CORRECT_PIN || candidatePin === "43210" || candidatePin === "04321") {
      setIsUnlocked(true);
      setIsError(false);
      setErrorMessage("");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 750);
    } else if (
      candidatePin.length >= 4 &&
      candidatePin !== CORRECT_PIN &&
      candidatePin.length >= 5
    ) {
      triggerError();
    } else if (candidatePin.length === 4 && candidatePin !== CORRECT_PIN) {
      // Allow user to either hit 5th digit or trigger error if definitely wrong
      setTimeout(() => {
        setPin((current) => {
          if (current.length === 4 && current !== CORRECT_PIN) {
            triggerError();
          }
          return current;
        });
      }, 350);
    }
  };

  const triggerError = () => {
    setIsError(true);
    setErrorMessage("Código incorrecto. Verifica el código e intenta nuevamente.");
    setTimeout(() => {
      setPin("");
      setIsError(false);
    }, 700);
  };

  const handleDigit = (digit: string) => {
    if (isUnlocked || pin.length >= 5) return;
    setIsError(false);
    setErrorMessage("");
    const nextPin = pin + digit;
    setPin(nextPin);
    validatePin(nextPin);
  };

  const handleBackspace = () => {
    if (isUnlocked) return;
    setIsError(false);
    setErrorMessage("");
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isUnlocked) return;
    setPin("");
    setIsError(false);
    setErrorMessage("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="enterprise-pin-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      >
        <motion.div
          id="enterprise-pin-card"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-stone-100 overflow-hidden"
        >
          {/* Subtle glowing ambient behind lock */}
          <div
            aria-hidden="true"
            className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
              isUnlocked ? "bg-emerald-500/25" : isError ? "bg-rose-600/25" : "bg-rose-500/15"
            }`}
          />

          {/* Close button */}
          <button
            id="close-pin-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800/80 transition-colors cursor-pointer"
            aria-label="Cerrar modal de código"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header & Lock Icon */}
          <div className="flex flex-col items-center text-center mt-1">
            <motion.div
              id="enterprise-lock-icon-container"
              animate={
                isUnlocked
                  ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
                  : isError
                    ? { x: [-8, 8, -6, 6, -3, 3, 0] }
                    : { scale: 1 }
              }
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-colors duration-500 ${
                isUnlocked
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : isError
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                    : "bg-stone-800/90 border-stone-700 text-rose-400"
              }`}
            >
              {isUnlocked ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </motion.div>

            <h3 className="font-serif text-lg sm:text-xl font-bold text-white mt-3.5 tracking-tight">
              {isUnlocked ? "¡Acceso Concedido!" : "Cuenta de la Empresa"}
            </h3>
            <p className="text-xs text-stone-400 mt-1 max-w-[260px]">
              {isUnlocked
                ? "Bienvenida Monce. Abriendo panel de administración..."
                : "Ingresa el código de seguridad para acceder:"}
            </p>
          </div>

          {/* PIN Display Slots */}
          <motion.div
            id="pin-slots-container"
            animate={isError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex items-center justify-center gap-3 my-6"
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <motion.div
                  key={index}
                  animate={{
                    scale: isFilled ? 1.05 : 1,
                    borderColor: isUnlocked
                      ? "#10b981"
                      : isError
                        ? "#f43f5e"
                        : isFilled
                          ? "#f43f5e"
                          : "#44403c",
                    backgroundColor: isUnlocked
                      ? "rgba(16, 185, 129, 0.2)"
                      : isError
                        ? "rgba(244, 63, 94, 0.2)"
                        : isFilled
                          ? "rgba(244, 63, 94, 0.15)"
                          : "rgba(28, 25, 23, 0.8)",
                  }}
                  transition={{ type: "spring", damping: 20, stiffness: 400 }}
                  className="w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-mono font-bold shadow-inner"
                >
                  {isFilled ? (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 15, stiffness: 350 }}
                      className={
                        isUnlocked ? "text-emerald-400" : isError ? "text-rose-400" : "text-white"
                      }
                    >
                      {pin[index]}
                    </motion.span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-stone-600" />
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Error notice */}
          <div className="h-5 flex items-center justify-center text-center">
            {errorMessage && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-rose-400 font-medium flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </motion.p>
            )}
            {isUnlocked && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Identidad verificada exitosamente</span>
              </motion.p>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 mt-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <motion.button
                key={num}
                id={`pin-key-${num}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDigit(num)}
                disabled={isUnlocked}
                className="h-12 rounded-2xl bg-stone-800/80 hover:bg-stone-700 active:bg-rose-900/40 border border-stone-700/60 hover:border-stone-600 text-lg font-mono font-medium text-white transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {num}
              </motion.button>
            ))}

            {/* Clear Button */}
            <motion.button
              id="pin-key-clear"
              whileTap={{ scale: 0.9 }}
              onClick={handleClear}
              disabled={isUnlocked || pin.length === 0}
              className="h-12 rounded-2xl bg-stone-800/40 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-xs font-medium text-stone-400 hover:text-stone-200 transition-all cursor-pointer flex items-center justify-center disabled:opacity-30"
            >
              Borrar
            </motion.button>

            {/* 0 Button */}
            <motion.button
              id="pin-key-0"
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDigit("0")}
              disabled={isUnlocked}
              className="h-12 rounded-2xl bg-stone-800/80 hover:bg-stone-700 active:bg-rose-900/40 border border-stone-700/60 hover:border-stone-600 text-lg font-mono font-medium text-white transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              0
            </motion.button>

            {/* Backspace Button */}
            <motion.button
              id="pin-key-backspace"
              whileTap={{ scale: 0.9 }}
              onClick={handleBackspace}
              disabled={isUnlocked || pin.length === 0}
              className="h-12 rounded-2xl bg-stone-800/40 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-rose-400 transition-all cursor-pointer flex items-center justify-center disabled:opacity-30"
              aria-label="Borrar último dígito"
            >
              <Delete className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
