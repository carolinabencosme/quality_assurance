import { BRAND } from '@/lib/brand';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'light' | 'dark';
};

const sizes = { sm: 32, md: 40, lg: 52 };

export default function BrandMark({ size = 'md', showLabel = false, variant = 'light' }: Props) {
  const px = sizes[size];

  return (
    <div className={`brand-mark-wrap ${variant} brand-mark-wrap--${size}`} aria-label={BRAND.name}>
      <div className="brand-mark" style={{ width: px, height: px }} aria-hidden>
        <span className="brand-mark-inner" />
      </div>
      {showLabel && <span className="brand-label">{BRAND.name}</span>}
    </div>
  );
}
