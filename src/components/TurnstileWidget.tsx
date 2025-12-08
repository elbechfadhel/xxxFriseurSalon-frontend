// src/components/TurnstileWidget.tsx
import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: HTMLElement,
                options: {
                    sitekey: string;
                    callback?: (token: string) => void;
                    "error-callback"?: () => void;
                    "expired-callback"?: () => void;
                    language?: string;
                }
            ) => void;
            reset?: (widget?: any) => void;
        };
    }
}

interface TurnstileWidgetProps {
    onToken: (token: string) => void;
    languageCode?: string; // e.g. "de" or "en"
}

const TurnstileWidget = ({ onToken, languageCode }: TurnstileWidgetProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!SITE_KEY) {
            console.error("VITE_TURNSTILE_SITE_KEY is missing");
            return;
        }

        const scriptId = "cf-turnstile-script";

        // Load script once
        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const el = containerRef.current;
        if (!el) return;

        const renderWidget = () => {
            if (!window.turnstile || el.childElementCount > 0) return;
            window.turnstile.render(el, {
                sitekey: SITE_KEY,
                callback: (token: string) => {
                    onToken(token);
                },
                "error-callback": () => {
                    onToken("");
                },
                "expired-callback": () => {
                    onToken("");
                },
                language: languageCode,
            });
        };

        if (window.turnstile) {
            renderWidget();
        } else {
            const interval = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(interval);
                    renderWidget();
                }
            }, 200);
            return () => clearInterval(interval);
        }
    }, [onToken, languageCode]);

    return <div ref={containerRef} />;
};

export default TurnstileWidget;
