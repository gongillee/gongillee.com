import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
    threshold?: number;
    rootMargin?: string;
    freezeOnceVisible?: boolean;
}

export const useIntersectionObserver = ({
    threshold = 0.1,
    rootMargin = '0px',
    freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        if (freezeOnceVisible && isVisible) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isIntersecting = entry.isIntersecting;
                if (isIntersecting && freezeOnceVisible) {
                    setIsVisible(true);
                    observer.disconnect();
                } else {
                    setIsVisible(isIntersecting);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin, freezeOnceVisible, isVisible]);

    return { ref, isVisible };
};
