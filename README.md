# Dopamine Wall

A draggable video dashboard with **21 video presets** and room for **12 simultaneous tiles**. The library includes Minecraft parkour, Subway Surfers, a [live sea otter cam](https://www.montereybayaquarium.org/cams-videos/live-cams/sea-otter-cam), sand cutting, soap carving, slime, cleaning, dominoes, marble racing, craft clips, and more. You can search the library, duplicate, remove, shuffle, reorder, mute, and pause tiles; choose 2, 3, or 4 columns; and add YouTube links, direct MP4/WebM/Ogg links, or files from your computer. Your linked videos and layout are saved in this browser.

## Run

Requires Node.js 20 or newer.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (normally <http://127.0.0.1:5173/>).

## Docker image

The GitHub Actions workflow **build and push** builds the site for `linux/amd64`
and `linux/arm64`, then publishes both architectures under
`<Docker Hub username>/dopamine-wall:latest` and a commit-SHA tag on pushes to
`master` or `main`. It can also be run manually from the Actions tab. Add these
repository secrets before running it:

- `DOCKERHUB_USERNAME`: your Docker Hub username
- `DOCKERHUB_TOKEN`: a Docker Hub access token with permission to push

Run the published image with `docker run --rm -p 8080:80 <Docker Hub username>/dopamine-wall:latest`, then open <http://localhost:8080/>.

To run the published image with Compose on port 6969, set your Docker Hub
username in the shell and start the service:

```powershell
$env:DOCKERHUB_USERNAME = 'your-username'
docker compose up -d
```

Open <http://localhost:6969/>. To pull a newer `latest` image later, run
`docker compose up -d --pull always`.

Click **Fullscreen** to fill the screen. Escape or **Exit** leaves fullscreen. Click **Pop out** in Edge or Chrome to move the wall into a draggable, resizable picture-in-picture window that stays above other windows. Browsers without Document Picture-in-Picture open a regular pop-out window. The page window itself can also be dragged by its top bar.

YouTube tiles require an internet connection. Videos chosen from your computer stay available only until the tab is closed; linked videos and the layout persist.

The sea otter cam uses Monterey Bay Aquarium's live feed from 7 a.m. to 7 p.m. Pacific time and its after-hours replay at other times. The tile switches automatically at those times.

## Verify the video library

```powershell
npm run check:videos
```

This checks that all 21 presets have unique IDs, bundled files exist and have video headers, and YouTube embeds return metadata. The [research and source audit](RESEARCH.md) explains the preset selection and lists the original six playback checks. Every preset's creator link is also available under **Video credits** in the app.

The kinetic-sand clip is by [Serenity In sand](https://commons.wikimedia.org/wiki/File:Very_soothing_and_relaxing_%EF%BD%9C_Oddly_Satisfying_kineticsand_421.webm) under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/); it is shown unmodified and looped in the player. The bundled Pexels clips are available under the [Pexels license](https://www.pexels.com/license/). YouTube clips play through YouTube's embedded player.
