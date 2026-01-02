/**
 * Framer Motion 애니메이션 Variants
 * FSD 패턴: shared/animations - 재사용 가능한 애니메이션 정의
 */

import { Variants } from 'framer-motion';

/**
 * 페이드인 + 위로 슬라이드 (Hero 텍스트용)
 */
export const fadeInUp: Variants = {
    hidden: {
        opacity: 0,
        y: 30,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1], // Custom easing for smooth feel
        },
    },
};

/**
 * 페이드인 (기본)
 */
export const fadeIn: Variants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
};

/**
 * 스태거드 컨테이너 (자식 요소들을 순차적으로 애니메이션)
 */
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15, // 150ms 간격으로 자식 요소 애니메이션
            delayChildren: 0.1,
        },
    },
};

/**
 * 스케일 + 페이드인 (기능 카드용)
 */
export const scaleIn: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

/**
 * 좌측에서 슬라이드인
 */
export const slideInLeft: Variants = {
    hidden: {
        opacity: 0,
        x: -50,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

/**
 * 우측에서 슬라이드인
 */
export const slideInRight: Variants = {
    hidden: {
        opacity: 0,
        x: 50,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

/**
 * 3D 빨려들어가는 효과 (네이버 단 스타일)
 * Zoom in with perspective
 */
export const zoomInPerspective: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.5,
        rotateX: 20,
        z: -100,
    },
    visible: {
        opacity: 1,
        scale: 1,
        rotateX: 0,
        z: 0,
        transition: {
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for smooth zoom
        },
    },
};
