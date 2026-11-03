import React, { useRef } from 'react';
import { View, PanResponder } from 'react-native';

/**
 * SwipeTabWrapper enables smooth horizontal swipe gestures between main tabs
 * without interfering with vertical scrolling of FlatList / ScrollView.
 */
export default function SwipeTabWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  style,
}) {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture if gesture is distinctly horizontal and passes threshold
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.8;
        const hasMinDistance = Math.abs(gestureState.dx) > 25;
        return isHorizontal && hasMinDistance;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const minSwipeDistance = 45;
        if (gestureState.dx < -minSwipeDistance && onSwipeLeft) {
          onSwipeLeft();
        } else if (gestureState.dx > minSwipeDistance && onSwipeRight) {
          onSwipeRight();
        }
      },
    })
  ).current;

  return (
    <View style={[{ flex: 1 }, style]} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
