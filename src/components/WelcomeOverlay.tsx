'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Clock, Target, Zap, Brain, Shield, Trophy, ChevronRight } from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { PHASE_DESCRIPTIONS } from '@/lib/gamification';
import type { PlayerArchetype, PhaseName } from '@/lib/types';

const archetypeIcons: Record<PlayerArchetype, typeof Brain> = {
  tactician: Zap,
  positionalGrinder: Shield,
  aggressiveAttacker: Target,
  endgameSpecialist: Trophy,
  chaoticBlitzer: Zap,
  allRounder: Brain,
};

const phaseConfig: { phase: number; name: PhaseName; weeks: string; icon: typeof Target }[] = [
  { phase: 1, name: 'Foundation', weeks: 'Weeks 1-3', icon: Shield },
  { phase: 2, name: 'Development', weeks: 'Weeks 4-6', icon: Target },
  { phase: 3, name: 'Mastery', weeks: 'Weeks 7-8', icon: Trophy },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function WelcomeOverlay() {
  const { trainingPlan, dismissWelcome } = useChess();
  if (!trainingPlan || trainingPlan.welcomeDismissed) return null;

  const { diagnosis, diagnostic } = trainingPlan;
  const ArchetypeIcon = archetypeIcons[diagnosis.archetype] || Brain;
  const archetypeName = diagnosis.archetype.replace(/([A-Z])/g, ' $1').trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 22, 35, 0.95)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6"
        style={{ backgroundColor: Colors.card, border: `1px solid ${Colors.border}` }}
      >
        {/* Header */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${Colors.gold}15` }}
          >
            <GraduationCap size={32} style={{ color: Colors.gold }} />
          </motion.div>
          <AnimatedShinyText className="text-2xl font-extrabold mb-2">
            Welcome, {diagnostic.username}!
          </AnimatedShinyText>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            Your personalized 8-week chess improvement program is ready.
          </p>
        </motion.div>

        {/* Archetype Card */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
          <NeonGradientCard borderSize={1} neonColors={{ firstColor: '#10B981', secondColor: '#059669' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${Colors.gold}15` }}>
                <ArchetypeIcon size={20} style={{ color: Colors.gold }} />
              </div>
              <div>
                <p className="text-white text-sm font-bold capitalize">{archetypeName}</p>
                <p className="text-xs" style={{ color: Colors.textTertiary }}>
                  {diagnostic.currentRating} rating
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: Colors.textSecondary }}>
              {diagnosis.archetypeDescription}
            </p>
          </NeonGradientCard>
        </motion.div>

        {/* Phase Roadmap */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: Colors.textTertiary }}>
            Your Journey
          </p>
          <div className="space-y-2">
            {phaseConfig.map((p, i) => {
              const PhaseIcon = p.icon;
              return (
                <motion.div
                  key={p.phase}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: Colors.surface }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${Colors.gold}15` }}
                  >
                    <PhaseIcon size={16} style={{ color: Colors.gold }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold">Phase {p.phase}: {p.name}</p>
                    <p className="text-[11px]" style={{ color: Colors.textTertiary }}>{p.weeks}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: Colors.textTertiary }} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Daily Commitment */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-3 p-3 rounded-xl mb-6"
          style={{ backgroundColor: Colors.surface }}
        >
          <Clock size={18} style={{ color: Colors.gold }} />
          <div>
            <p className="text-white text-sm font-semibold">~30-45 min/day</p>
            <p className="text-[11px]" style={{ color: Colors.textTertiary }}>
              Daily puzzles, study, and practice games
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <ShimmerButton
            onClick={dismissWelcome}
            shimmerColor="#10B981"
            background="rgba(30, 42, 58, 0.95)"
            shimmerDuration="2.5s"
            className="w-full py-4 text-base font-bold"
          >
            <span className="flex items-center justify-center gap-2" style={{ color: Colors.gold }}>
              <GraduationCap size={20} />
              Start Your Journey
            </span>
          </ShimmerButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
