"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Confetti() {
    const [pieces, setPieces] = useState<number[]>([]);

    useEffect(() => {
        // Generate 30 pieces
        setPieces(Array.from({ length: 30 }, (_, i) => i));
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {pieces.map((i) => (
                <ConfettiPiece key={i} index={i} />
            ))}
        </div>
    );
}

function ConfettiPiece({ index }: { index: number }) {
    const randomColor = [
        "#FF4D94", // Primary Pink
        "#3B82F6", // Blue
        "#10B981", // Green
        "#F59E0B", // Yellow
        "#FFFFFF"  // White
    ][index % 5];

    const randomX = Math.random() * 100 - 50; // -50% to +50%
    const randomRotate = Math.random() * 360;

    return (
        <motion.div
            initial={{
                y: 0,
                x: 0,
                opacity: 1,
                scale: Math.random() * 0.5 + 0.5,
                rotate: 0
            }}
            animate={{
                y: -100 - Math.random() * 100, // Move up
                x: randomX,
                opacity: 0,
                rotate: randomRotate + 180 + Math.random() * 180
            }}
            transition={{
                duration: 0.8 + Math.random() * 0.5,
                ease: "easeOut"
            }}
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '8px',
                height: '8px',
                backgroundColor: randomColor,
                borderRadius: index % 2 === 0 ? '50%' : '2px', // Mix circles and squares
            }}
        />
    );
}
