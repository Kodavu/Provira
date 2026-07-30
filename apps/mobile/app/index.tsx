import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import { routeForRoles } from "@/lib/roles";
import { colors } from "@/lib/theme";

// Entry: route a returning user to their role dashboard, else to login.
export default function Index() {
  useEffect(() => {
    (async () => {
      const userId = await session.userId();
      if (!userId) {
        router.replace("/login");
        return;
      }
      try {
        const user = await api.getUser(userId);
        router.replace(routeForRoles(user.roles.map((r) => r.role)));
      } catch {
        router.replace("/login");
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas }}>
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}
