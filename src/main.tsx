import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Native app initialization wrapper component
const NativeAppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const initNativeApp = async () => {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      try {
        // Import native modules dynamically to avoid issues on web
        const [{ SplashScreen }, { StatusBar, Style }, { initPushNotifications }, { initDeepLinks }] = await Promise.all([
          import("@capacitor/splash-screen"),
          import("@capacitor/status-bar"),
          import("./services/pushNotifications"),
          import("./services/deepLinks"),
        ]);

        // Configure status bar
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
        }

        // Initialize push notifications
        await initPushNotifications();

        // Initialize deep link handling
        initDeepLinks();

        // Hide splash screen after initialization
        await SplashScreen.hide();

        console.log("[Native] App initialization complete");
      } catch (error) {
        console.error("[Native] Failed to initialize:", error);
      }
    };

    initNativeApp();
  }, []);

  return <>{children}</>;
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NativeAppInitializer>
      <App />
    </NativeAppInitializer>
  </React.StrictMode>
);
