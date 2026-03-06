import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface Props {
  onResult: (text: string) => void;
}

export function VoiceButton({ onResult }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "pl-PL";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      onResult(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant={listening ? "accent" : "outline"}
      size="default"
      onClick={toggle}
      className="w-full"
    >
      {listening ? <MicOff className="h-5 w-5 mr-1" /> : <Mic className="h-5 w-5 mr-1" />}
      {listening ? "Zatrzymaj dyktowanie" : "Dyktuj notatkę"}
    </Button>
  );
}
