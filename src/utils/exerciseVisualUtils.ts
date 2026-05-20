export type ExerciseVisualType =
  | 'split_squat'
  | 'hinge'
  | 'squat_press'
  | 'calf_raise'
  | 'soleus_raise'
  | 'tibialis_raise'
  | 'plank'
  | 'side_plank'
  | 'hip_thrust'
  | 'single_leg_hinge'
  | 'hamstring_curl'
  | 'step_up'
  | 'copenhagen'
  | 'pallof_press'
  | 'dead_bug'
  | 'glute_bridge'
  | 'clamshell'
  | 'mobility'
  | 'bike_warmup'
  | 'generic_strength'

export interface ExerciseVisualMeta {
  type: ExerciseVisualType
  label: string
  cues: string[]
  accentClassName: string
}

const visualMeta: Record<ExerciseVisualType, Omit<ExerciseVisualMeta, 'type'>> = {
  split_squat: {
    label: 'Split stance',
    cues: ['Front foot flat', 'Control the descent', 'Drive through mid-foot'],
    accentClassName: 'from-purple-400/35 via-fuchsia-300/20 to-slate-950/0',
  },
  hinge: {
    label: 'Hip hinge',
    cues: ['Soft knees', 'Hips back', 'Neutral back'],
    accentClassName: 'from-violet-400/35 via-purple-300/20 to-slate-950/0',
  },
  squat_press: {
    label: 'Squat pattern',
    cues: ['Whole foot pressure', 'Knees track cleanly', 'Smooth tempo'],
    accentClassName: 'from-purple-400/35 via-blue-300/20 to-slate-950/0',
  },
  calf_raise: {
    label: 'Ankle extension',
    cues: ['Full range', 'Pause at top', 'Slow lower'],
    accentClassName: 'from-orange-400/35 via-amber-300/20 to-slate-950/0',
  },
  soleus_raise: {
    label: 'Bent-knee calf',
    cues: ['Knee stays bent', 'Smooth reps', 'No bouncing'],
    accentClassName: 'from-orange-400/35 via-lime-300/20 to-slate-950/0',
  },
  tibialis_raise: {
    label: 'Shin control',
    cues: ['Lift toes high', 'Control down', 'Keep range comfortable'],
    accentClassName: 'from-cyan-400/35 via-blue-300/20 to-slate-950/0',
  },
  plank: {
    label: 'Core brace',
    cues: ['Ribs down', 'Long spine', 'Quiet hips'],
    accentClassName: 'from-emerald-400/35 via-cyan-300/20 to-slate-950/0',
  },
  side_plank: {
    label: 'Side support',
    cues: ['Hips stacked', 'Shoulder packed', 'Breathe steadily'],
    accentClassName: 'from-emerald-400/35 via-purple-300/20 to-slate-950/0',
  },
  hip_thrust: {
    label: 'Hip drive',
    cues: ['Ribs down', 'Squeeze glutes', 'No back arch'],
    accentClassName: 'from-fuchsia-400/35 via-purple-300/20 to-slate-950/0',
  },
  single_leg_hinge: {
    label: 'Single-leg hinge',
    cues: ['Hips square', 'Reach long', 'Use support if needed'],
    accentClassName: 'from-violet-400/35 via-cyan-300/20 to-slate-950/0',
  },
  hamstring_curl: {
    label: 'Hamstring pull',
    cues: ['Slow eccentric', 'No cramping', 'Control the return'],
    accentClassName: 'from-blue-400/35 via-purple-300/20 to-slate-950/0',
  },
  step_up: {
    label: 'Step and control',
    cues: ['Whole foot on box', 'Drive tall', 'Control step down'],
    accentClassName: 'from-purple-400/35 via-orange-300/20 to-slate-950/0',
  },
  copenhagen: {
    label: 'Adductor hold',
    cues: ['Short lever if needed', 'Hips high', 'No twisting'],
    accentClassName: 'from-rose-400/35 via-purple-300/20 to-slate-950/0',
  },
  pallof_press: {
    label: 'Anti-rotation',
    cues: ['Tall posture', 'Press straight out', 'Slow return'],
    accentClassName: 'from-cyan-400/35 via-emerald-300/20 to-slate-950/0',
  },
  dead_bug: {
    label: 'Core control',
    cues: ['Ribs down', 'Slow reach', 'Back stays quiet'],
    accentClassName: 'from-emerald-400/35 via-blue-300/20 to-slate-950/0',
  },
  glute_bridge: {
    label: 'Glute bridge',
    cues: ['Feet planted', 'Pause at top', 'Control down'],
    accentClassName: 'from-green-400/35 via-purple-300/20 to-slate-950/0',
  },
  clamshell: {
    label: 'Hip activation',
    cues: ['Hips stacked', 'Small clean range', 'Feel glutes'],
    accentClassName: 'from-lime-400/35 via-emerald-300/20 to-slate-950/0',
  },
  mobility: {
    label: 'Mobility flow',
    cues: ['Move gently', 'Stay relaxed', 'No forcing range'],
    accentClassName: 'from-cyan-400/35 via-emerald-300/20 to-slate-950/0',
  },
  bike_warmup: {
    label: 'Easy warm-up',
    cues: ['Easy spin', 'Check stiffness', 'Breathe calmly'],
    accentClassName: 'from-blue-400/35 via-cyan-300/20 to-slate-950/0',
  },
  generic_strength: {
    label: 'Controlled strength',
    cues: ['Clean reps', 'Stop before form breaks', 'Keep it repeatable'],
    accentClassName: 'from-purple-400/35 via-slate-300/20 to-slate-950/0',
  },
}

export function getExerciseVisualType(exerciseName: string): ExerciseVisualType {
  const name = exerciseName.toLowerCase()

  if (name.includes('split squat')) return 'split_squat'
  if (name.includes('single-leg romanian') || name.includes('single leg romanian')) return 'single_leg_hinge'
  if (name.includes('romanian deadlift')) return 'hinge'
  if (name.includes('leg press') || name.includes('goblet') || name.includes('squat')) return 'squat_press'
  if (name.includes('seated calf') || name.includes('soleus') || name.includes('bent-knee')) return 'soleus_raise'
  if (name.includes('tibialis')) return 'tibialis_raise'
  if (name.includes('eccentric calf') || name.includes('calf')) return 'calf_raise'
  if (name.includes('side plank')) return 'side_plank'
  if (name.includes('copenhagen') || name.includes('adductor')) return 'copenhagen'
  if (name.includes('plank')) return 'plank'
  if (name.includes('hip thrust')) return 'hip_thrust'
  if (name.includes('hamstring curl')) return 'hamstring_curl'
  if (name.includes('step-up') || name.includes('step up')) return 'step_up'
  if (name.includes('pallof')) return 'pallof_press'
  if (name.includes('dead bug')) return 'dead_bug'
  if (name.includes('glute bridge')) return 'glute_bridge'
  if (name.includes('clamshell') || name.includes('banded side')) return 'clamshell'
  if (name.includes('bike') || name.includes('walk') || name.includes('rowing')) return 'bike_warmup'
  if (name.includes('mobility') || name.includes('stretch') || name.includes('airplanes')) return 'mobility'

  return 'generic_strength'
}

export function getExerciseVisualMeta(visualType: string): ExerciseVisualMeta {
  const type = isExerciseVisualType(visualType) ? visualType : 'generic_strength'

  return {
    type,
    ...visualMeta[type],
  }
}

function isExerciseVisualType(value: string): value is ExerciseVisualType {
  return Object.hasOwn(visualMeta, value)
}
