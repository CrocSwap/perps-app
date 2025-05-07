import { useState, useEffect, type CSSProperties, type JSX} from 'react';
import { Link } from 'react-router';
import styles from './home.module.css';

import btcImage from '../../assets/tokens/btc.svg';
import ethImage from '../../assets/tokens/eth.svg';
import daiImage from '../../assets/tokens/dai.svg';
import usdtImage from '../../assets/tokens/usdt.svg';

interface FloatingTokenProps {
  src: string;
  size?: number;
  top?: string;
  left?: string;
  duration?: number;
  delay?: number;
  direction?: number;
}

interface TokenData {
  src: string;
  size: number;
  top: string;
  left: string;
  duration: number;
  delay: number;
  direction: number;
}

interface TradingPair {
  pair: string;
  price: string;
  change: string;
}

function FloatingBgToken({ 
  src, 
  size = 90, 
  top = '50%', 
  left = '50%', 
  duration = 60, 
  delay = 0, 
  direction = 1 
}: FloatingTokenProps): JSX.Element {
  return (
    <div 
      className={styles.floatingToken}
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        opacity: 0.06,
        zIndex: 4,
        filter: 'blur(1px)',
        pointerEvents: 'none',
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        animationDirection: direction === 1 ? 'normal' : 'reverse'
      } as CSSProperties}
    >
      <img src={src} alt="token-bg" width={size} height={size} />
    </div>
  );
}

// Token data
const tokenData: TokenData[] = [
  { src: btcImage, size: 100, top: '5%', left: '-10%', duration: 90, delay: 0, direction: 1 },
  { src: ethImage, size: 90, top: '65%', left: '-15%', duration: 60, delay: 3, direction: -1 },
  { src: usdtImage, size: 130, top: '85%', left: '-10%', duration: 60, delay: 5, direction: 1 },
  { src: daiImage, size: 95, top: '30%', left: '-12%', duration: 60, delay: 7, direction: -1 },
  { src: ethImage, size: 85, top: '20%', left: '-5%', duration: 60, delay: 1.5, direction: 1 }
];

// Trading pair data
const tradingPairs: TradingPair[] = [
  { pair: "BTC-USD", price: "$57,890", change: "+2.4%" },
  { pair: "ETH-USD", price: "$3,241", change: "-0.8%" },
  { pair: "SOL-USD", price: "$128.45", change: "+5.6%" },
  { pair: "AVAX-USD", price: "$35.67", change: "+1.3%" },
  { pair: "BNB-USD", price: "$456.78", change: "-0.2%" },
  { pair: "LINK-USD", price: "$18.34", change: "+3.7%" }
];

export default function Home(): JSX.Element {
  const [tradingVolume] = useState<string>("$1.24B");
  const [traders, setTraders] = useState<number>(42617);
  const [countdown, setCountdown] = useState<number>(300);
  const [hasVisited, setHasVisited] = useState<boolean>(false);
  
  // Check for visited state and simulate changing data
  useEffect(() => {
    try {
      const visited = sessionStorage.getItem('hasVisitedHome') === 'true';
      setHasVisited(visited);
      
      if (!visited) {
        sessionStorage.setItem('hasVisitedHome', 'true');
      }
    } catch (e) {
      console.error('Session storage error:', e);
    }
    
    // Simulate changing data
    const interval = setInterval(() => {
      setTraders(prev => prev + Math.floor(Math.random() * 3));
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.hero}>
      {/* Background with your specified gradient */}
      <div className={styles.gradient}></div>
      <div className={styles.glowLeft}></div>
      <div className={styles.glowRight}></div>
      <div className={styles.glowTop}></div>
      
      {/* Floating tokens */}
      {tokenData.map((token, index) => (
        <FloatingBgToken
          key={`token-${index}`}
          src={token.src}
          size={token.size}
          top={token.top}
          left={token.left}
          duration={token.duration}
          delay={token.delay}
          direction={token.direction}
        />
      ))}
      
      {/* Main content container */}
      <div className={styles.container}>
        {/* Left side: Headline and CTA */}
        <div className={styles.leftContent}>
          <h1 className={styles.heading}>Trade Perps With Confidence</h1>
          <p className={styles.subheading}>Fast execution. Low fees. Up to 50x leverage.</p>
          
          {/* Stats Bar */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>24h Volume</p>
              <p className={styles.statValue}>{tradingVolume}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>Active Traders</p>
              <p className={styles.statValue}>{traders.toLocaleString()}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>Avg. Execution</p>
              <p className={styles.statValue}>48ms</p>
            </div>
          </div>
          
          {/* CTAs */}
          <div className={styles.ctaContainer}>
            <Link to="/trade" className={styles.primaryButton}>Start Trading</Link>
            <button className={styles.secondaryButton}>Learn More</button>
          </div>
          
          {/* Social Proof */}
          <div className={styles.socialProof}>
            <span className={styles.activeDot}></span>
            <span>{Math.floor(Math.random() * 40) + 10} new traders joined in the last hour</span>
          </div>
        </div>
        
        {/* Right side: Platform Preview */}
        <div className={styles.rightContent}>
          {/* Main Trading Interface Preview */}
          <div className={styles.platformPreview}>
            <div className={styles.platformGlow}></div>
            <Link to="/trade">
              <img 
                src="https://cdn-img.panewslab.com/panews/2025/05/05/images/Eqst2Pr9xq.png" 
                alt="Trading Platform" 
                className={styles.platformImage}
                width="600"
                height="400"
              />
            </Link>
            
            {/* Price Tickers Overlay */}
            <div className={styles.priceTicker}>
              <div className={styles.tickerItem}>
                <span className={styles.tickerPair}>BTC-USD</span>
                <span className={styles.tickerPositive}>+2.4%</span>
                <span className={styles.tickerPrice}>$57,890</span>
              </div>
              <div className={styles.tickerItem}>
                <span className={styles.tickerPair}>ETH-USD</span>
                <span className={styles.tickerNegative}>-0.8%</span>
                <span className={styles.tickerPrice}>$3,241</span>
              </div>
            </div>
            
            {/* Feature Badge */}
            <div className={styles.featureBadge}>
              New: Instant Leverage
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className={styles.trustIndicators}>
            <div className={styles.trustItem}>
              <div className={styles.trustLabel}>Audited by</div>
              <div className={styles.trustValue}>Auditer</div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustLabel}>Insurance</div>
              <div className={styles.trustValue}>$50M+</div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustLabel}>Uptime</div>
              <div className={styles.trustValue}>99.9%</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Pairs Ticker */}
      <div className={styles.marketTicker}>
        <div className={styles.tickerContainer}>
          <div className={styles.tickerScroll}>
            {tradingPairs.map((item, index) => (
              <div key={index} className={styles.marketTickerItem}>
                <span className={styles.marketPair}>{item.pair}</span>
                <span className={styles.marketPrice}>{item.price}</span>
                <span className={item.change.startsWith('+') ? styles.marketPositive : styles.marketNegative}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Promotional Overlay */}
      {countdown > 0 && (
        <div className={styles.promoOverlay}>
          <div className={styles.promoTitle}>Launch Promo: {Math.floor(countdown/60)}:{(countdown % 60).toString().padStart(2, '0')}</div>
          <div className={styles.promoDesc}>50% fee discount for new traders</div>
        </div>
      )}
    </section>
  );
}