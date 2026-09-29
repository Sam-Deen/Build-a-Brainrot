// Each library theme keeps its original clip and rotates through these two alternatives.
// These are embedded from their creators' YouTube uploads; no YouTube media is copied locally.
const youtube = (videoId, clipTitle, credit) => ({
  type: 'youtube', videoId, clipTitle, credit, portrait: false,
  sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
});

export const rotations = {
  sand: [
    youtube('DVS-0Xr_OjE', 'Kinetic sand cutting ASMR compilation', 'Squish ASMR · YouTube'),
    youtube('8BYrvVeejzg', 'Kinetic sand compilation 109', 'Sand Tagious · YouTube'),
  ],
  minecraft: [
    youtube('XBIaqOm0RKQ', 'Minecraft parkour gameplay 65', 'GameplaysForFree · YouTube'),
    youtube('__NQWLBA7Co', '10 minutes of Minecraft parkour', 'GianLeco Minecraft Gameplay · YouTube'),
  ],
  subway: [
    youtube('YcRxA0IOrE4', 'Subway Surfers pro run', 'Hoviak · YouTube'),
    youtube('82dJFqPy2Ng', 'Subway Surfers gameplay 1', 'EMVEX · YouTube'),
  ],
  paint: [
    youtube('IHaaFSKNyto', 'Mixing 24 paint colors', 'PaintMixEverything · YouTube'),
    youtube('mNf8GWc1pN4', 'Mixing all paint colors', 'Oddly Obsess ASMR · YouTube'),
  ],
  ink: [
    youtube('ICxC5ekWnUc', 'Ink in motion', 'Macro Room · YouTube'),
    youtube('VS4r2MWHrvU', 'Colored ink in water', 'ALA-SLOW MOTION · YouTube'),
  ],
  parkour: [
    youtube('oIJ5m1_6E24', 'Extreme parkour and freerunning', 'StuntsAmazing · YouTube'),
    youtube('NX7QNWEGcNI', "The world's best parkour", 'StuntsAmazing · YouTube'),
  ],
  soap: [
    youtube('U_hphURGJ8U', 'Dry soap carving ASMR', 'NadiaASMR Soap · YouTube'),
    youtube('i8ke8NeynaM', 'Soap carving ASMR', 'CUT ASMR PLUS · YouTube'),
  ],
  slime: [
    youtube('UY4u0n-p7sQ', '10 minutes of slime 2', '10 Minutes of Slime · YouTube'),
    youtube('Gutewy2GE2U', 'Satisfying slime ASMR', 'Talisa Tossell · YouTube'),
  ],
  rug: [
    youtube('RiqUB3FIrTU', 'Satisfying rug cleaning ASMR', 'Hernandez Carpet Cleaning · YouTube'),
    youtube('IVlaAxFIi8s', 'The dirtiest rug cleaning', 'Cleaning The Dirtiest · YouTube'),
  ],
  hydraulic: [
    youtube('q9BtYEnrkg4', 'Top 100 hydraulic press moments', 'Hydraulic Press Channel · YouTube'),
    youtube('2jJznk-pRVk', 'Best hydraulic press moments', 'Hydraulic Press Channel · YouTube'),
  ],
  domino: [
    youtube('GFzvmwvYaqM', 'Domino tricks with planks', 'Hevesh5 · YouTube'),
    youtube('lo6x4eulY9g', 'The amazing triple spiral', 'Hevesh5 · YouTube'),
  ],
  marble: [
    youtube('JONvYf3NfI8', 'Animal marble race', "Jelle's Marble Runs · YouTube"),
    youtube('0sHu99vdz-A', 'Sand marble race', "Jelle's Marble Runs · YouTube"),
  ],
  'sand-asmr': [
    youtube('C_PWdv5Bluw', 'Kinetic sand ASMR compilation 298', 'Sand Tagious · YouTube'),
    youtube('rF6awqlStl4', 'Kinetic sand ASMR compilation 275', 'Sand Tagious · YouTube'),
  ],
  geometry: [
    youtube('fjW2bonZOpQ', 'Geometry Dash levels 1–3', 'Hypo Mobile · YouTube'),
    youtube('MEglyRfe1j4', 'Geometry Dash full version', 'Neiro · YouTube'),
  ],
  cake: [
    youtube('HHtuYQxJMUQ', 'Colorful cake decorating compilation', 'Ruby Cake · YouTube'),
    youtube('TsBy0DUAY1M', 'Soothing cake frosting', 'BuzzFeedVideo · YouTube'),
  ],
  pressure: [
    youtube('kpFovsGdJJ4', 'Satisfying pressure washing', 'WOW Pressure Washing Services · YouTube'),
    youtube('N1tV-nKd8vc', 'Pressure washing a salon', 'Grace Under Pressure · YouTube'),
  ],
  printer: [
    youtube('1qvK1T69uKY', '3D printing timelapses', 'WildRoseBuilds · YouTube'),
    youtube('NPxRMQnzEA0', 'Cool 3D prints timelapses', 'Marc3DP · YouTube'),
  ],
  pottery: [
    youtube('7N1YOMPhGIo', 'Pottery wheel ASMR', 'Rural Pottery · YouTube'),
    youtube('F8VZG1ChKoo', 'Clay jar pottery ASMR', 'Rural Pottery · YouTube'),
  ],
  carwash: [
    youtube('C2s19bTH7BI', 'BMW detailing ASMR', 'NET Auto Detailer · YouTube'),
    youtube('GIN8d91kPOg', 'Relaxing car detailing', 'NET Auto Detailer · YouTube'),
  ],
  lemons: [
    youtube('zLCc1SJTM3o', 'Slicing a lemon', 'SAMUKICHI · YouTube'),
    youtube('CYRcDR6jaos', 'Lemon cutting in slow motion', 'Unripe Content · YouTube'),
  ],
};
