// Keep preset IDs stable: saved walls store the ID, not a copy of the preset.
export const presets = [
  {
    id: 'sand', title: 'Kinetic sand', subtitle: 'slice after slice', type: 'video',
    src: '/videos/sand-cutting.webm', category: 'SATISFYING', tint: 'sand', emoji: '✳',
    credit: 'Serenity In sand · CC BY 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Very_soothing_and_relaxing_%EF%BD%9C_Oddly_Satisfying_kineticsand_421.webm',
  },
  {
    id: 'minecraft', title: 'Minecraft parkour', subtitle: 'one more jump', type: 'youtube',
    videoId: 'LofyMQts7hY', portrait: true, category: 'GAMEPLAY', tint: 'minecraft', emoji: '◆',
    credit: 'BlockVista · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=LofyMQts7hY',
  },
  {
    id: 'subway', title: 'Subway Surfers', subtitle: 'keep running', type: 'youtube',
    videoId: 'i0M4ARe9v0Y', category: 'GAMEPLAY', tint: 'subway', emoji: '↗',
    credit: 'Subway Surfers · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=i0M4ARe9v0Y',
  },
  {
    id: 'otter', title: 'Sea otter cam', subtitle: 'live otter antics', type: 'youtube',
    videoId: 'abbR-Ttd-cA', offHoursVideoId: 'sq35qS1iVYU', live: true,
    category: 'LIVE CAM', tint: 'otter', emoji: '🦦',
    credit: 'Monterey Bay Aquarium · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=abbR-Ttd-cA',
    offHoursSourceUrl: 'https://www.youtube.com/watch?v=sq35qS1iVYU',
  },
  {
    id: 'paint', title: 'Paint mixing', subtitle: 'swirl therapy', type: 'video',
    src: '/videos/paint-mixing.mp4', category: 'SATISFYING', tint: 'paint', emoji: '◉',
    credit: 'ad urpina · Pexels', sourceUrl: 'https://www.pexels.com/video/colored-paint-mixing-5877408/',
  },
  {
    id: 'ink', title: 'Ink clouds', subtitle: 'color in motion', type: 'video',
    src: '/videos/ink-cloud.mp4', category: 'SATISFYING', tint: 'ink', emoji: '✺',
    credit: 'MART PRODUCTION · Pexels', sourceUrl: 'https://www.pexels.com/video/colored-paint-mixing-in-the-water-7565449/',
  },
  {
    id: 'parkour', title: 'Parkour', subtitle: 'just keep moving', type: 'video',
    src: '/videos/parkour.mp4', category: 'MOTION', tint: 'parkour', emoji: '↟',
    credit: 'Mary Taylor · Pexels', sourceUrl: 'https://www.pexels.com/video/man-doing-parkour-at-the-park-6004317/',
  },
  {
    id: 'soap', title: 'Soap carving', subtitle: 'clean cuts', type: 'youtube',
    videoId: '8UYcbAP5TQw', category: 'SATISFYING', tint: 'soap', emoji: '▧',
    credit: 'The Best Satisfying · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=8UYcbAP5TQw',
  },
  {
    id: 'slime', title: 'Slime ASMR', subtitle: 'squish and stretch', type: 'youtube',
    videoId: 'lcI5PlByGrk', category: 'SATISFYING', tint: 'slime', emoji: '◕',
    credit: 'Ana Aster ASMR · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=lcI5PlByGrk',
  },
  {
    id: 'rug', title: 'Rug cleaning', subtitle: 'the big reveal', type: 'youtube',
    videoId: 'Bl0H_gHF_kM', category: 'CLEANING', tint: 'rug', emoji: '▤',
    credit: 'Make It Clean · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=Bl0H_gHF_kM',
  },
  {
    id: 'hydraulic', title: 'Hydraulic press', subtitle: 'crush compilation', type: 'youtube',
    videoId: 'OgYLRyu22v4', category: 'SATISFYING', tint: 'hydraulic', emoji: '⬡',
    credit: 'Hydraulic Press Channel · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=OgYLRyu22v4',
  },
  {
    id: 'domino', title: 'Domino chain', subtitle: 'one after another', type: 'youtube',
    videoId: 'DQQN_79QrDY', category: 'SATISFYING', tint: 'domino', emoji: '▣',
    credit: 'Hevesh5 · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=DQQN_79QrDY',
  },
  {
    id: 'marble', title: 'Marble race', subtitle: 'pick your winner', type: 'youtube',
    videoId: 'Iqb4HWSOTpE', category: 'SATISFYING', tint: 'marble', emoji: '●',
    credit: "Jelle's Marble Runs · YouTube", sourceUrl: 'https://www.youtube.com/watch?v=Iqb4HWSOTpE',
  },
  {
    id: 'sand-asmr', title: 'Sand ASMR', subtitle: 'the softer side', type: 'youtube',
    videoId: 'TmB8L5mPgj0', category: 'SATISFYING', tint: 'sand-asmr', emoji: '✳',
    credit: 'Luxe Mia ASMR · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=TmB8L5mPgj0',
  },
  {
    id: 'geometry', title: 'Geometry Dash', subtitle: 'rhythm and reflex', type: 'youtube',
    videoId: 'Bc337KosgrI', category: 'GAMEPLAY', tint: 'geometry', emoji: '◇',
    credit: 'IDK Daniel · YouTube', sourceUrl: 'https://www.youtube.com/watch?v=Bc337KosgrI',
  },
  {
    id: 'cake', title: 'Cake decorating', subtitle: 'frosting in motion', type: 'video',
    src: '/videos/cake-decorating.mp4', category: 'CRAFT & FOOD', tint: 'cake', emoji: '✿',
    credit: 'SHVETS production · Pexels', sourceUrl: 'https://www.pexels.com/video/person-putting-a-frosting-on-the-cake-7525479/',
  },
  {
    id: 'pressure', title: 'Pressure washing', subtitle: 'wash it all away', type: 'video',
    src: '/videos/pressure-washing.mp4', category: 'CLEANING', tint: 'pressure', emoji: '≈',
    credit: 'K · Pexels', sourceUrl: 'https://www.pexels.com/video/man-washing-floor-with-water-pressure-machine-6160419/',
  },
  {
    id: 'printer', title: '3D printing', subtitle: 'layer by layer', type: 'video',
    src: '/videos/3d-printing.mp4', category: 'CRAFT & FOOD', tint: 'printer', emoji: '⬢',
    credit: 'Pixabay · Pexels (CC0)', sourceUrl: 'https://www.pexels.com/video/3d-printer-printing-855255/',
  },
  {
    id: 'pottery', title: 'Pottery wheel', subtitle: 'shape and spin', type: 'video',
    src: '/videos/pottery-wheel.mp4', category: 'CRAFT & FOOD', tint: 'pottery', emoji: '◌',
    credit: 'KoolShooters · Pexels', sourceUrl: 'https://www.pexels.com/video/close-up-of-a-person-using-a-pottery-wheel-9736574/',
  },
  {
    id: 'carwash', title: 'Car wash', subtitle: 'rinse and repeat', type: 'video',
    src: '/videos/car-wash.mp4', category: 'CLEANING', tint: 'carwash', emoji: '✧',
    credit: 'Tima Miroshnichenko · Pexels', sourceUrl: 'https://www.pexels.com/video/man-pressure-washing-a-white-car-6872072/',
  },
  {
    id: 'lemons', title: 'Lemon slicing', subtitle: 'perfect little cuts', type: 'video',
    src: '/videos/lemon-slicing.mp4', category: 'CRAFT & FOOD', tint: 'lemons', emoji: '✦',
    credit: 'Phillip Dillow · Pexels', sourceUrl: 'https://www.pexels.com/video/person-slicing-lemons-on-a-chopping-board-5540318/',
  },
];
