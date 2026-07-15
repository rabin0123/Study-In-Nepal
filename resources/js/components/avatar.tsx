type AvatarProps = {
    name: string;
    size?: number;
};

// A small fixed palette in the Partner Portal family (sky blue, amber,
// plus a few complementary tones) so avatars stay on-brand instead of
// looking like random colors were picked.
const PALETTE = [
    '#0ea5e9', // sky
    '#f59e0b', // amber
    '#6366f1', // indigo
    '#10b981', // emerald
    '#ec4899', // pink
    '#0c2d48', // deep navy (matches header gradient)
    '#f97316', // orange
    '#14b8a6', // teal
];

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = 40 }: AvatarProps) {
    const initials = getInitials(name || '?');
    const color = PALETTE[hashString(name || '') % PALETTE.length];

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: size * 0.38,
                letterSpacing: '0.02em',
                flexShrink: 0,
                userSelect: 'none',
            }}
            aria-hidden="true"
        >
            {initials}
        </div>
    );
}