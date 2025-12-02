import { useState } from 'react';

import { Link } from 'react-router-dom';

interface DemoCardProps {
    to: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    hue: number;
    iconHue: number;
}

export function DemoCard({
    to,
    title,
    description,
    icon,
    hue,
    iconHue,
}: DemoCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const bgColor = `hsl(${hue}, 70%, ${isHovered ? 50 : 55}%)`;
    const iconBgColor = `hsl(${iconHue}, 70%, 45%)`;

    return (
        <Link
            to={to}
            className="block rounded-xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={{ backgroundColor: bgColor }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="mb-3 flex items-center gap-4">
                <div
                    className="rounded-lg p-3 text-white/90"
                    style={{ backgroundColor: iconBgColor }}
                >
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <p className="text-sm text-white/80">{description}</p>
        </Link>
    );
}
