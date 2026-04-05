import React, { useState, useEffect } from "react";
import OneSignal from "react-onesignal";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";

export default function NavSubscribe() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOneSignalStatus = async () => {
      try {
        const isOptedIn = OneSignal.User?.PushSubscription?.optedIn ?? false;
        const hasExternalId = !!OneSignal.User?.externalId;
        setIsSubscribed(isOptedIn && hasExternalId);
      } catch (err) {
        console.error("Error checking OneSignal status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkOneSignalStatus();

    const handleSubscriptionChange = (event) => {
      console.log("Subscription status changed:", event);
      setIsSubscribed(event);
    };

    OneSignal.User.PushSubscription.addEventListener(
      "change",
      handleSubscriptionChange,
    );
    return () => {
      OneSignal.User.PushSubscription.removeEventListener(
        "change",
        handleSubscriptionChange,
      );
    };
  }, []);

  const handleToggle = async (checked) => {
    setIsLoading(true);
    try {
      if (checked) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (!userId) {
          console.log("No active session found for OneSignal");
          setIsSubscribed(false);
          return;
        }
        await OneSignal.Notifications.requestPermission();
        await OneSignal.login(userId);
        await OneSignal.User.PushSubscription.optIn();
        setIsSubscribed(true);

        console.log("OneSignal Login Success");
      } else {
        await OneSignal.User.PushSubscription.optOut();
        await OneSignal.logout();
        setIsSubscribed(false);
        console.log("OneSignal Logout Success");
      }
    } catch (error) {
      console.error("Error toggling OneSignal subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between max-w-40 gap-4 p-2">
      <Label
        htmlFor="notifications-mode"
        className={`text-sm leading-none ${isLoading && "cursor-not-allowed opacity-50"} `}
      >
        Subscribe
      </Label>
      <Switch
        disabled={isLoading}
        size="sm"
        className="cursor-pointer"
        id="notifications-mode"
        checked={isSubscribed}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}
