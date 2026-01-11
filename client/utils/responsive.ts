import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard scale is based on iPhone 11/14/15 (375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Standard scale based on width
 */
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scale based on height
 */
const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scale with a factor to prevent extreme scaling
 */
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * For precise font scaling that respects user accessibility settings
 */
const fontScale = (size: number) => {
    const scaled = moderateScale(size);
    return PixelRatio.getFontScale() * scaled;
};

export { scale as s, verticalScale as vs, moderateScale as ms, fontScale as fs, SCREEN_WIDTH, SCREEN_HEIGHT };
