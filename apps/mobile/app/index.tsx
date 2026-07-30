import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { session } from "@/lib/session";
import { colors } from "@/lib/theme";

// Entry: route to the worker dashboard if signed in, else the login screen.
export default function Index() {
  useEffect(() => {
    (async () => {
      const userId = await session.userId();
      router.replace(userId ? "/worker" : "/login");
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas }}>
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}
