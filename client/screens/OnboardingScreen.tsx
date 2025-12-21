
import React, { useRef, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    FadeIn,
    FadeInDown,
    Layout,
    SharedValue
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Kenya’s Google Maps\nof Events',
        description: 'Stop scrolling aimlessly. Find exactly what’s happening in your city with AI-powered discovery.',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2670&auto=format&fit=crop',
    },
    {
        id: '2',
        title: 'Your Night,\nGamified',
        description: 'Scout events, earn rewards, and compete with your crew for neighborhood dominance.',
        image: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=2574&auto=format&fit=crop',
    },
    {
        id: '3',
        title: 'Party with\nPeace of Mind',
        description: 'Integrated SOS triggers, live location sharing, and trusted emergency contacts.',
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2670&auto=format&fit=crop',
    },
];

interface SlideItemProps {
    item: typeof SLIDES[0];
    index: number;
    scrollX: SharedValue<number>;
}

const SlideItem = ({ item, index, scrollX }: SlideItemProps) => {
    const imageStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [-width * 0.4, 0, width * 0.4]
        );
        return {
            transform: [{ translateX }],
        };
    });

    const contentStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollX.value,
            [(index - 0.5) * width, index * width, (index + 0.5) * width],
            [0, 1, 0]
        );
        const translateY = interpolate(
            scrollX.value,
            [(index - 0.5) * width, index * width, (index + 0.5) * width],
            [100, 0, -100]
        );
        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    return (
        <View style={{ width, height }}>
            {/* Image Wrapper for Parallax */}
            <View style={StyleSheet.absoluteFill}>
                <Animated.Image
                    source={{ uri: item.image }}
                    style={[styles.image, imageStyle]}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)', '#000000']}
                    style={StyleSheet.absoluteFill}
                    locations={[0, 0.6, 0.95]}
                />
            </View>

            {/* Content Body */}
            <SafeAreaView style={styles.contentContainer}>
                <Animated.View style={[styles.textWrapper, contentStyle]}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

export default function OnboardingScreen() {
    const scrollX = useSharedValue(0);
    const flatListRef = useRef<Animated.FlatList<any>>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigation = useNavigation<any>();

    const onScroll = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            navigation.replace('SignUp');
        }
    };

    const handleSkip = () => {
        navigation.replace('SignUp');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                renderItem={({ item, index }) => (
                    <SlideItem item={item} index={index} scrollX={scrollX} />
                )}
            />

            {/* Premium Footer */}
            <View style={styles.footer}>
                {/* Pager Indicators */}
                <View style={styles.indicatorContainer}>
                    {SLIDES.map((_, index) => {
                        const animatedIndicatorStyle = useAnimatedStyle(() => {
                            const indicatorWidth = interpolate(
                                scrollX.value,
                                [(index - 1) * width, index * width, (index + 1) * width],
                                [8, 30, 8],
                                Extrapolate.CLAMP
                            );
                            const opacity = interpolate(
                                scrollX.value,
                                [(index - 1) * width, index * width, (index + 1) * width],
                                [0.3, 1, 0.3],
                                Extrapolate.CLAMP
                            );
                            return {
                                width: indicatorWidth,
                                opacity,
                            };
                        });
                        return (
                            <Animated.View
                                key={index}
                                style={[styles.indicator, animatedIndicatorStyle]}
                            />
                        );
                    })}
                </View>

                {/* Primary Action */}
                <TouchableOpacity
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <BlurView intensity={30} tint="light" style={styles.nextButton}>
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <Text style={styles.nextButtonText}>
                            {currentIndex === SLIDES.length - 1 ? 'Start Your Vybz' : 'Continue'}
                        </Text>
                        <Feather
                            name={currentIndex === SLIDES.length - 1 ? 'zap' : 'arrow-right'}
                            size={20}
                            color="#FFF"
                        />
                    </BlurView>
                </TouchableOpacity>
            </View>

            {/* Skip Option */}
            <SafeAreaView style={styles.skipContainer}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    image: {
        width: width * 1.5, // Wider for parallax effect
        height: height,
        opacity: 0.8,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 160, // Space for footer
        paddingHorizontal: Spacing.xl,
    },
    textWrapper: {
        maxWidth: '90%',
    },
    title: {
        color: '#FFF',
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: -1.5,
        lineHeight: 46,
        marginBottom: 16,
    },
    divider: {
        width: 40,
        height: 4,
        backgroundColor: '#8B5CF6',
        borderRadius: 2,
        marginBottom: 20,
    },
    description: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '400',
        letterSpacing: -0.2,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    indicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicator: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#8B5CF6',
        marginRight: 6,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        marginRight: 8,
    },
    skipContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    skipButton: {
        padding: Spacing.xl,
    },
    skipText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        fontWeight: '600',
    },
});
