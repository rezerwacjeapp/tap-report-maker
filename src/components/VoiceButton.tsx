import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface Props {
  onResult: (text: string) => void;
}

export function VoiceButton({ onResult }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  // Dictation outlives many renders: hand each phrase to the latest onResult, so it is added
  // to the current text, not to the text from when dictation started (which kept only the last phrase)
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

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
      // Only process NEW final results — e.resultIndex marks where new ones start
      let newText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          newText += e.results[i][0].transcript;
        }
      }
      if (newText.trim()) {
        onResultRef.current(newText.trim());
      }
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
