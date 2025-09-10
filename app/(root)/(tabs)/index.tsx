import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="my-10 text-3xl font-rubik-bold">Welcome to ReState</Text>
    </View>
  );
}
