import { FeatureGrid } from '@/src/widgets/marketing/ui/FeatureGrid';
import { HeroSection } from '@/src/widgets/marketing/ui/HeroSection';
import { MarketingHeader } from '@/src/widgets/marketing/ui/MarketingHeader';
import { ProductFooter } from '@/src/widgets/marketing/ui/ProductFooter';

export default function Home() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2b1d11_0%,#120f0b_42%,#0c0a08_100%)]">
            <MarketingHeader />
            <HeroSection />
            <FeatureGrid />
            <ProductFooter />
        </div>
    );
}
