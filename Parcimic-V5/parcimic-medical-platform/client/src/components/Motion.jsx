// Motion.jsx - Reusable animation wrappers using Framer Motion
import React from 'react';
import { motion } from 'framer-motion';

// ─── Fade In Animation ───
export const FadeIn = ({ children, delay = 0, duration = 0.6 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay, duration, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Fade In Up Animation ───
export const FadeInUp = ({ children, delay = 0, duration = 0.6 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Fade In Down Animation ───
export const FadeInDown = ({ children, delay = 0, duration = 0.6 }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Fade In Left Animation ───
export const FadeInLeft = ({ children, delay = 0, duration = 0.6 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Fade In Right Animation ───
export const FadeInRight = ({ children, delay = 0, duration = 0.6 }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Scale In Animation ───
export const ScaleIn = ({ children, delay = 0, duration = 0.4 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Hover Lift Animation ───
export const HoverLift = ({ children, className = '' }) => (
  <motion.div
    className={className}
    whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Button Pulse Animation ───
export const PulseButton = ({ children, className = '', onClick }) => (
  <motion.button
    className={className}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.button>
);

// ─── Staggered Container ───
export const StaggerContainer = ({ children, delay = 0.1 }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ─── Animated Card ───
export const AnimatedCard = ({ children, className = '', delay = 0 }) => (
  <motion.div
    className={`card ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
  >
    {children}
  </motion.div>
);

// ─── Number Counter Animation ───
export const CounterUp = ({ to = 100, duration = 2, className = '' }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const increment = to / (duration * 60); // 60fps
    const interval = setInterval(() => {
      setCount((prev) => {
        const next = prev + increment;
        return next >= to ? to : next;
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [to, duration]);

  return <span className={className}>{Math.floor(count)}</span>;
};

// ─── Rotating Icon ───
export const RotatingIcon = ({ children, duration = 2 }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: 'linear' }}
  >
    {children}
  </motion.div>
);

// ─── Floating Animation ───
export const FloatingElement = ({ children, distance = 12 }) => (
  <motion.div
    animate={{ y: [-distance, distance] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

// ─── Slide In Animation ───
export const SlideIn = ({ children, from = 'left', delay = 0, duration = 0.5 }) => {
  const initialX = from === 'left' ? -100 : 100;
  return (
    <motion.div
      initial={{ opacity: 0, x: initialX }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// ─── Bounce In Animation ───
export const BounceIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.3 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      delay,
      duration: 0.6,
      ease: 'backOut',
    }}
  >
    {children}
  </motion.div>
);

// ─── Heartbeat Animation ───
export const Heartbeat = ({ children }) => (
  <motion.div
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

const motionComponents = {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  ScaleIn,
  HoverLift,
  PulseButton,
  StaggerContainer,
  AnimatedCard,
  CounterUp,
  RotatingIcon,
  FloatingElement,
  SlideIn,
  BounceIn,
  Heartbeat,
};

export default motionComponents;
