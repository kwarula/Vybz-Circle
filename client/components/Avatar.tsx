import React from "react";
import { StyleSheet, View, Image, Pressable } from "react-native";

import { BorderRadius } from "@/constants/theme";

interface AvatarProps {
  uri: string;
  size?: number;
  onPress?: () => void;
}

export function Avatar({ uri, size = 40, onPress }: AvatarProps) {
  const imageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        <Image source={{ uri }} style={imageStyle} />
      </Pressable>
    );
  }

  return <Image source={{ uri }} style={imageStyle} />;
}

const styles = StyleSheet.create({
  container: {},
});
