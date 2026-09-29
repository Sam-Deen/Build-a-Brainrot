# Video preset research and audit

Checked on 28 September 2026. “Used more” means formats with evidence of broad viewing or recurring use in short-form video. These sources do not provide a reliable cross-platform ranking of the exact clips, so the library is a curated mix rather than a numbered popularity chart.

The sea otter cam was added on 29 September 2026. [Monterey Bay Aquarium's cam page](https://www.montereybayaquarium.org/cams-videos/live-cams/sea-otter-cam) lists separate live and after-hours YouTube embeds and a 7 a.m.–7 p.m. Pacific live schedule. Both embeds returned YouTube metadata during the source check. This addition is a live animal feed, not a popularity-ranked brainrot preset.

## What informed the 20 presets

- **Gameplay loops:** [YouTube's Minecraft retrospective](https://blog.youtube/culture-and-trends/minecraft-15/) explicitly notes parkour in Shorts. The [official Subway Surfers gameplay upload](https://www.youtube.com/watch?v=i0M4ARe9v0Y) is a widely viewed, embeddable example. The app keeps both existing presets and adds Geometry Dash.
- **ASMR and satisfying processes:** [TikTok's creative guidance](https://ads.tiktok.com/business/creativecenter/quicktok/online/tiktok_creative_accelerator/pc/en) identifies ASMR and oddly satisfying clips as popular formats. [YouTube's culture report](https://blog.youtube/culture-and-trends/culture-trends-report-gen-z-multiformat-shorts-creator-pop-culture/) reports that 83% of surveyed Gen Z viewers had used YouTube for soothing content. This supports sand, soap, slime, paint, ink, dominoes, and marble racing.
- **Cleaning and object transformations:** TikTok highlights satisfying before/after processes in the same guidance. [YouTube's Hydraulic Press Channel retrospective](https://blog.youtube/culture-and-trends/hydraulic-press/) describes the press genre's long-running appeal. The library adds rug cleaning, pressure washing, car washing, and a hydraulic press compilation.
- **Food and craft:** [YouTube reported more than 250 million views](https://blog.youtube/culture-and-trends/youtube-bento-box-meal-prep-trend/) of videos with “bento box” or “#bentobox” in the title in the first half of 2026. Cake decorating, lemon slicing, pottery, and 3D printing add more process clips. These are adjacent options, not a claim that they outrank the gameplay and ASMR presets.

## Original six: source and playback check

| Preset | Check | Fit with research |
| --- | --- | --- |
| Kinetic sand | Bundled WebM played in Edge; [source and CC BY 3.0 license](https://commons.wikimedia.org/wiki/File:Very_soothing_and_relaxing_%EF%BD%9C_Oddly_Satisfying_kineticsand_421.webm) checked | Core satisfying/ASMR format |
| Minecraft parkour | [YouTube embed](https://www.youtube.com/watch?v=LofyMQts7hY) resolved and played in Edge | Core gameplay format |
| Subway Surfers | [YouTube embed](https://www.youtube.com/watch?v=i0M4ARe9v0Y) resolved and played in Edge | Core gameplay format |
| Paint mixing | Bundled MP4 played in Edge; [Pexels source](https://www.pexels.com/video/colored-paint-mixing-5877408/) checked | Satisfying visual process |
| Ink clouds | Bundled MP4 played in Edge; [Pexels source](https://www.pexels.com/video/colored-paint-mixing-in-the-water-7565449/) checked | Satisfying visual process |
| Parkour | Bundled MP4 played in Edge; [Pexels source](https://www.pexels.com/video/man-doing-parkour-at-the-park-6004317/) checked | Motion variety; less directly tied to split-screen gameplay |

The new bundled cake clip and the new soap-carving YouTube embed were also visually checked in Edge. The source checker in `scripts/check-presets.mjs` covers all 20 IDs and local files. YouTube availability can change after this check.

## New preset sources

| Preset | Original source |
| --- | --- |
| Soap carving | [The Best Satisfying](https://www.youtube.com/watch?v=8UYcbAP5TQw) |
| Slime ASMR | [Ana Aster ASMR](https://www.youtube.com/watch?v=lcI5PlByGrk) |
| Rug cleaning | [Make It Clean](https://www.youtube.com/watch?v=Bl0H_gHF_kM) |
| Hydraulic press | [Hydraulic Press Channel](https://www.youtube.com/watch?v=OgYLRyu22v4) |
| Domino chain | [Hevesh5](https://www.youtube.com/watch?v=DQQN_79QrDY) |
| Marble race | [Jelle's Marble Runs](https://www.youtube.com/watch?v=Iqb4HWSOTpE) |
| Sand ASMR | [Luxe Mia ASMR](https://www.youtube.com/watch?v=TmB8L5mPgj0) |
| Geometry Dash | [IDK Daniel](https://www.youtube.com/watch?v=Bc337KosgrI) |
| Cake decorating | [SHVETS production / Pexels](https://www.pexels.com/video/person-putting-a-frosting-on-the-cake-7525479/) |
| Pressure washing | [K / Pexels](https://www.pexels.com/video/man-washing-floor-with-water-pressure-machine-6160419/) |
| 3D printing | [Pixabay / Pexels](https://www.pexels.com/video/3d-printer-printing-855255/) |
| Pottery wheel | [KoolShooters / Pexels](https://www.pexels.com/video/close-up-of-a-person-using-a-pottery-wheel-9736574/) |
| Car wash | [Tima Miroshnichenko / Pexels](https://www.pexels.com/video/man-pressure-washing-a-white-car-6872072/) |
| Lemon slicing | [Phillip Dillow / Pexels](https://www.pexels.com/video/person-slicing-lemons-on-a-chopping-board-5540318/) |
