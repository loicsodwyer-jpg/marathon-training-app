import type { ExerciseVisualType } from '../../utils/exerciseVisualUtils'

type ExerciseIllustrationProps = {
  title: string
  variant: ExerciseVisualType
  className?: string
}

function ExerciseIllustration({
  className = '',
  title,
  variant,
}: ExerciseIllustrationProps) {
  return (
    <svg
      aria-label={`${title} illustration`}
      className={className}
      role="img"
      viewBox="0 0 320 220"
    >
      <title>{`${title} illustration`}</title>
      <defs>
        <linearGradient id={`skin-${variant}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id={`accent-${variant}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect fill="rgba(255,255,255,0.05)" height="188" rx="28" width="288" x="16" y="16" />
      <path d="M36 184h248" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.28" strokeWidth="6" />
      <MovementFigure variant={variant} />
      <MovementArrows variant={variant} />
    </svg>
  )
}

function MovementFigure({ variant }: { variant: ExerciseVisualType }) {
  if (variant === 'bike_warmup') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="98" cy="154" r="31" strokeOpacity="0.88" strokeWidth="8" />
        <circle cx="224" cy="154" r="31" strokeOpacity="0.88" strokeWidth="8" />
        <path d="M98 154l48-58h44l34 58M146 96l22 58H98m70 0h56" strokeOpacity="0.9" strokeWidth="8" />
        <circle cx="158" cy="50" fill={`url(#skin-${variant})`} r="14" stroke="none" />
        <path d="M154 66l-22 30m28-28l34 28m-42-12l20 38" strokeOpacity="0.95" strokeWidth="8" />
      </g>
    )
  }

  if (variant === 'split_squat') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <Bench x={206} y={139} />
        <circle cx="143" cy="55" fill={`url(#skin-${variant})`} r="14" stroke="none" />
        <path d="M141 72l-10 45M137 88l-42 24m39-20l40 24" strokeWidth="9" />
        <path d="M131 117l-45 54h58m-13-54l53 31 32-2" strokeWidth="9" />
        <path d="M92 171h58m54-23h44" strokeOpacity="0.45" strokeWidth="5" />
      </g>
    )
  }

  if (variant === 'hinge' || variant === 'single_leg_hinge') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <Barbell x1="74" x2="232" y="132" />
        <circle cx="126" cy="62" fill={`url(#skin-${variant})`} r="14" stroke="none" />
        <path d="M138 72l54 34M191 106l-48 58m48-58l48 55" strokeWidth="9" />
        {variant === 'single_leg_hinge' ? (
          <path d="M180 112l-74 10" strokeWidth="9" />
        ) : (
          <path d="M152 91l-38 30m42-26l32 32" strokeWidth="9" />
        )}
      </g>
    )
  }

  if (variant === 'squat_press' || variant === 'step_up') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {variant === 'step_up' ? <Box x={188} y={139} /> : <WeightPlate cx={238} cy={107} />}
        <circle cx="141" cy="54" fill={`url(#skin-${variant})`} r="14" stroke="none" />
        <path d="M141 70v54M139 87l-42 30m44-28l44 25" strokeWidth="9" />
        {variant === 'step_up' ? (
          <path d="M141 124l43 44 34-28m-77-16l-36 50h57" strokeWidth="9" />
        ) : (
          <path d="M141 124l-36 48h52m-16-48l42 48h54" strokeWidth="9" />
        )}
      </g>
    )
  }

  if (variant === 'calf_raise' || variant === 'soleus_raise' || variant === 'tibialis_raise') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <StepPlatform />
        <circle cx="152" cy="53" fill={`url(#skin-${variant})`} r="14" stroke="none" />
        <path d="M152 70v58M152 128l-28 46m28-46l33 46" strokeWidth="9" />
        <path d="M136 86l-34 31m53-30l39 25" strokeWidth="9" />
        {variant === 'soleus_raise' ? <path d="M151 129c20 12 31 26 34 45" strokeOpacity="0.6" strokeWidth="5" /> : null}
        {variant === 'tibialis_raise' ? <path d="M116 172c14-18 29-18 45 0" stroke={`url(#accent-${variant})`} strokeWidth="6" /> : null}
      </g>
    )
  }

  if (variant === 'plank' || variant === 'side_plank' || variant === 'copenhagen') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {variant === 'copenhagen' ? <Bench x={205} y={127} /> : null}
        <circle cx="92" cy="103" fill={`url(#skin-${variant})`} r="13" stroke="none" />
        <path d="M106 108l70 26 60-5M176 134l-44 33m44-33l34 33" strokeWidth="9" />
        <path d="M71 164h158" strokeOpacity="0.35" strokeWidth="5" />
      </g>
    )
  }

  if (variant === 'hip_thrust' || variant === 'glute_bridge') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {variant === 'hip_thrust' ? <Bench x={62} y={119} /> : null}
        <circle cx="104" cy="92" fill={`url(#skin-${variant})`} r="13" stroke="none" />
        <path d="M116 99l67 14 50 47M183 113l-44 49m44-49l44 50" strokeWidth="9" />
        <path d="M72 164h170" strokeOpacity="0.35" strokeWidth="5" />
      </g>
    )
  }

  if (variant === 'hamstring_curl') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <Bench x={64} y={112} />
        <circle cx="104" cy="86" fill={`url(#skin-${variant})`} r="13" stroke="none" />
        <path d="M118 93l72 15 52 8M190 108l-30 46m33-45l50 35" strokeWidth="9" />
        <path d="M236 146c20-20 20-39 0-58" stroke={`url(#accent-${variant})`} strokeWidth="6" />
      </g>
    )
  }

  if (variant === 'pallof_press') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M52 78v100" strokeOpacity="0.45" strokeWidth="8" />
        <path d="M54 110h108" stroke={`url(#accent-${variant})`} strokeWidth="5" />
        <circle cx="170" cy="64" fill={`url(#skin-${variant})`} r="14" stroke="none" />
        <path d="M170 80v58m-2-38l-45 15m47-15l51 15m-51 23l-34 42m34-42l37 42" strokeWidth="9" />
      </g>
    )
  }

  if (variant === 'dead_bug') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="151" cy="111" fill={`url(#skin-${variant})`} r="13" stroke="none" />
        <path d="M149 126l-5 39m4-30l-46-34m45 35l51-34m-54 63l-46 6m46-6l48 6" strokeWidth="9" />
        <path d="M83 82c15 11 31 11 48 0m59 0c16 11 32 11 48 0" stroke={`url(#accent-${variant})`} strokeWidth="5" />
      </g>
    )
  }

  if (variant === 'clamshell') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="106" cy="112" fill={`url(#skin-${variant})`} r="13" stroke="none" />
        <path d="M120 118l58 22 52 23M178 140l-55 27m55-27l41-45" strokeWidth="9" />
        <path d="M218 95c21 18 21 45 0 68" stroke={`url(#accent-${variant})`} strokeWidth="6" />
      </g>
    )
  }

  if (variant === 'mobility') {
    return (
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="151" cy="55" fill={`url(#skin-${variant})`} r="14" stroke="none" />
        <path d="M151 72v54m0-33l-48 11m48-11l48-21m-48 54l-46 42m46-42l43 42" strokeWidth="9" />
        <path d="M82 76c33-35 82-42 128-14" stroke={`url(#accent-${variant})`} strokeWidth="5" />
        <path d="m213 62-24-3 12 22" stroke={`url(#accent-${variant})`} strokeWidth="5" />
      </g>
    )
  }

  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <WeightPlate cx={218} cy={120} />
      <circle cx="142" cy="55" fill={`url(#skin-${variant})`} r="14" stroke="none" />
      <path d="M142 72v53m-1-37-44 26m46-26 45 26m-46 11-35 48m35-48 38 48" strokeWidth="9" />
    </g>
  )
}

function MovementArrows({ variant }: { variant: ExerciseVisualType }) {
  const verticalVariants: ExerciseVisualType[] = [
    'calf_raise',
    'soleus_raise',
    'tibialis_raise',
    'squat_press',
    'step_up',
  ]

  if (verticalVariants.includes(variant)) {
    return (
      <path
        d="M267 152V72m0 0-14 18m14-18 14 18"
        fill="none"
        stroke="#22d3ee"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="6"
      />
    )
  }

  return (
    <path
      d="M237 66c28 28 29 66 3 96m0 0 3-24m-3 24 24-4"
      fill="none"
      stroke="#22d3ee"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="6"
    />
  )
}

function Bench({ x, y }: { x: number; y: number }) {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.65">
      <path d={`M${x} ${y}h58`} strokeWidth="9" />
      <path d={`M${x + 8} ${y + 6}v36m${x + 42} ${y + 6}v36`} strokeWidth="6" />
    </g>
  )
}

function Box({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y}h64v38h-64z`}
      fill="rgba(255,255,255,0.08)"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeOpacity="0.65"
      strokeWidth="7"
    />
  )
}

function StepPlatform() {
  return (
    <path
      d="M90 177h112v14H90z"
      fill="rgba(255,255,255,0.08)"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeOpacity="0.55"
      strokeWidth="5"
    />
  )
}

function Barbell({ x1, x2, y }: { x1: string; x2: string; y: string }) {
  return (
    <g stroke="currentColor" strokeLinecap="round" strokeOpacity="0.68">
      <path d={`M${x1} ${y}H${x2}`} strokeWidth="7" />
      <path d={`M${Number(x1) - 8} ${Number(y) - 18}v36M${Number(x2) + 8} ${Number(y) - 18}v36`} strokeWidth="6" />
    </g>
  )
}

function WeightPlate({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g fill="none" stroke="currentColor" strokeOpacity="0.55">
      <circle cx={cx} cy={cy} r="17" strokeWidth="6" />
      <circle cx={cx} cy={cy} r="5" strokeWidth="4" />
    </g>
  )
}

export default ExerciseIllustration
