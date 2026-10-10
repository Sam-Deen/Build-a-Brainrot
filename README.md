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

## Application health

The image runs `/app/healthcheck.py` every 30 seconds. It prints one compact
`application-health/v1` report, valid for 180 seconds, for Status Server's
**Docker Container** monitors. Use a 60-second monitor interval and inspect it with
`docker inspect --format '{{json .State.Health}}' YOUR_CONTAINER_NAME`.

The check requests the built entry page, JavaScript/CSS assets, and every bundled
video from Nginx over loopback. A build manifest verifies the content size and
first 64 bytes, catching missing files, incorrect content, and HTML fallbacks
without downloading whole videos. `application` and `assets` are critical;
their failure reports Down and exits 1. Missing bundled videos report Degraded
and exit 0 because the app and other video sources remain available.

Checks run without visitors: the entry page is measured every 30 seconds, assets
every 60 seconds, and bundled videos every five minutes. Measurements and
failure/recovery counters persist in `/dev/shm/brainrot-health.json` (memory,
without disk writes). A file lock prevents concurrent healthcheck processes from
probing together. Cached responses retain their original measurement timestamps.
Each component reports attempt, success, failure, measurement, and status-change
times. An unavailable cache only loses continuity; a container restart resets it.

Configure `HEALTH_APPLICATION_PROBE_MS`, `HEALTH_ASSETS_PROBE_MS`, and
`HEALTH_VIDEOS_PROBE_MS`; corresponding `*_STALE_MS` defaults are 90000, 180000,
and 900000, and `*_SLOW_MS` defaults are 1500 for all components. All are milliseconds.
`HEALTH_PROBE_TIMEOUT_MS` defaults to 1500 per request. Freshness is at least twice
the interval plus two request timeouts and a five-second scheduling margin.
Published component freshness allows at least 180 seconds for Docker/proxy
delivery; shorter local freshness limits are enforced before publishing.
`HEALTH_FAILURE_THRESHOLD` and `HEALTH_RECOVERY_THRESHOLD` default to 1, preserving
the existing immediate failure/recovery behavior. Slow successful checks report
Degraded and retain core availability. Keep Docker's interval at or below the
smallest component interval; its 10-second timeout must cover all probe batches.

This image publishes JSON directly through Docker; there is no HTTP health
endpoint. Browser playback, YouTube, fonts, and user-supplied video sources are
not measured by this server-side check.

Run the healthcheck regression tests with Python 3:

```sh
python3 -m unittest discover -s tests
```

Choose **1**, **4**, **9**, or **12** beside Fullscreen to fill the screen with that many videos. The fullscreen controls let you switch counts or exit; Escape also leaves fullscreen. Fullscreen starts with the videos on your wall and temporarily fills any remaining spaces from the library. Your saved wall stays the same. Click **Pop out** in Edge or Chrome to move the wall into a draggable, resizable picture-in-picture window that stays above other windows. Browsers without Document Picture-in-Picture open a regular pop-out window. The page window itself can also be dragged by its top bar.

YouTube tiles require an internet connection. Videos chosen from your computer stay available only until the tab is closed; linked videos and the layout persist.

The sea otter cam uses Monterey Bay Aquarium's live feed from 7 a.m. to 7 p.m. Pacific time and its after-hours replay at other times. The tile switches automatically at those times.

## Verify the video library

```powershell
npm run check:videos
```

This checks that all 21 presets have unique IDs, bundled files exist and have video headers, and YouTube embeds return metadata. The [research and source audit](RESEARCH.md) explains the preset selection and lists the original six playback checks. Every preset's creator link is also available under **Video credits** in the app.

The kinetic-sand clip is by [Serenity In sand](https://commons.wikimedia.org/wiki/File:Very_soothing_and_relaxing_%EF%BD%9C_Oddly_Satisfying_kineticsand_421.webm) under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/); it is shown unmodified and looped in the player. The bundled Pexels clips are available under the [Pexels license](https://www.pexels.com/license/). YouTube clips play through YouTube's embedded player.
