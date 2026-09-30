# Bubu & Dudu: Sky Garden Hop

## Run

Double-click `sky-hop.html`, or open `index.html` and choose **Sky Garden Hop (3D)**. A WebGL-capable browser is required. All scripts, including Three.js r128, are local: no server, npm, build step, network connection, imported artwork, or models are required.

The supplied original `BubuDudu.html` is untouched. `index.html` is its arcade entry-point copy with the fourth navigation link, updated menu wording, and identical CSS extracted into `css/base.css`. Existing 2D gameplay scripts are otherwise unchanged.

## GitHub and Vercel deployment

This repository is a plain static website. No `package.json`, framework, dependency installation, or build step is needed. `vercel.json` selects the **Other** framework preset, disables install/build commands, and serves the repository root. Explicit `.html` routes are retained so existing navigation continues to work. Do not add a catch-all rewrite: the arcade and 3D game are separate pages, not a single-page app.

### Upload to GitHub

Create a GitHub repository, then upload the project files with their directory structure intact. Include dotfiles, `index.html`, `sky-hop.html`, `css/`, `js/`, and `vendor/` (including the Three.js license). Do not upload `.env` files, local `.vercel/` settings, or test screenshots. `.gitignore` handles these exclusions when using Git; manual browser uploads must exclude them yourself.

Alternatively, from PowerShell:

```powershell
Set-Location 'D:\Documents\System Projects\Bubu & Dudu Game'
git init
git add .
git status
git commit -m "Add Bubu and Dudu arcade and Sky Garden Hop"
git branch -M main
```

Then use the remote URL supplied by your GitHub repository's setup page with `git remote add origin`, followed by `git push -u origin main`. If Git requests your author name/email, configure those using your own details before committing. No repository has been initialized or pushed automatically.

### Deploy on Vercel

1. Import the GitHub repository as a new Vercel project.
2. Set **Root Directory** to the repository root (the directory containing `index.html` and `vercel.json`).
3. Use **Framework Preset: Other**. Leave Build and Install Commands empty, with no dashboard overrides. The configuration sets **Output Directory** to `.`.
4. No environment variables are required. Deploy the project.
5. Verify `/` opens the arcade, `/sky-hop.html` opens the 3D game, and **Back to Arcade** returns to the arcade. Test sound after tapping/clicking and test the mobile controls.

The included `.vercelignore` excludes development-only files from uploads; do not treat ignore rules as a substitute for keeping secrets out of the repository. Retain `vendor/THREE-LICENSE.txt`. The original `BubuDudu.html` also remains available as a static page.

No GitHub Actions workflow is required for this deployment. Actual publishing requires your GitHub/Vercel accounts and has not been performed locally. Local validation cannot substitute for checking the resulting live deployment.

Saved scores are browser-local and tied to the site's origin. Records from a local file or a Vercel preview domain will not transfer automatically to the production domain.

Deployment support files: `.gitignore`, `.vercelignore`, `.gitattributes`, and `vercel.json`.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move relative to camera | WASD / arrows | Left joystick |
| Jump | Space | Jump |
| Double jump (Bubu) | Space again in air | Jump again |
| Glide (Bubu) | Hold Space while falling | Hold Jump |
| Ground pound (Dudu) | Down/S + Space in air | Pound in air |
| Swap | Q / Tab | Swap |
| Orbit camera | Mouse drag | Drag empty sky |
| Respawn | R | Pause → Replay restarts the level; falls automatically respawn |
| Pause / resume | P / Escape or HUD pause | HUD pause |
| Mute | M or sound button | Sound button |

The always-visible volume slider controls synthesized audio. Sound unlocks on the first interaction. Focus the slider to adjust it with keyboard arrows without moving the player.

## Puzzle routes

1. **Sunny Steps:** hop along the hearts, ride the blue moving island, visit the flower checkpoint, and use the pink mushroom to reach the higher island and heart flag. Either buddy can navigate the route.
2. **Honey Hill:** crumbling tiles last longer for Bubu. Stand on the mint plate to permanently open the gate and raise the blue island. Cross the long gap as Bubu with a double jump. Either buddy can finish at the flag.
3. **Together Tower:** use Dudu to push the crate straight ahead onto the gold plate. Leave it there to hold the gate open and lift up. Use Bubu to double-jump the long gap and reach the tower lid. Swap to Dudu above the cracked lid and ground-pound into the enclosed goal garden.

“Both characters” does not mean solo completion of every puzzle: the later levels deliberately require switching abilities. Falling never ends the game. Checkpoints retain collected items and puzzle progress; Replay resets the whole level.

## Files

- `index.html`, `sky-hop.html`
- `css/base.css`, `css/skyhop.css`
- `js/skyhop/main.js`: CONFIG, bootstrap, fixed-step loop, state, camera
- `js/skyhop/input.js`: keyboard, pointer orbit, multitouch controls
- `js/skyhop/player.js`: jump buffer, coyote time, abilities, swapping
- `js/skyhop/physics.js`: AABB collision, crate pushing, triggers
- `js/skyhop/levels.js`: editable level data
- `js/skyhop/entities.js`: reusable puzzle entities and scenery
- `js/skyhop/characters.js`: primitive bear meshes and animation
- `js/skyhop/audio.js`: guarded Web Audio synth
- `js/skyhop/ui.js`: menus, HUD, summaries, toasts
- `vendor/three.min.js`, `vendor/THREE-LICENSE.txt`: Three.js r128 and MIT license
- `tests/browser-check.cjs`: dependency-free browser checks (Node 22+)
- `tests/mobile-check.png`: generated mobile viewport screenshot (ignored by Git and deployment uploads)

Add levels to `SkyHop.levels`. Entity positions are center coordinates; spawn/checkpoint positions are foot coordinates. Moving platforms accept `path`, `speed`, and optional `circular`. Plates accept `heavy`, `latch`, and target entity IDs. Lift targets use `raisedY`. Change physics/camera values in CONFIG at the top of `main.js`.

## Validation and limits

The browser test connects to an already-running Chromium/Edge browser with remote debugging on port 9222 and `sky-hop.html` open. Run `node tests/browser-check.cjs`. No test framework or project dependencies are installed.

Checks cover direct `file://` loading, WebGL boot, island-to-island fixed-step jump trajectories, character abilities, actual crate pushing, gate/lift paths, tower-lid descent, moving-platform riding, checkpoints, fall respawn, summaries, pause/resume, real touch joystick/Jump/Swap/orbit events at 390×844, landscape resize, and startup of the original three 2D modes. Route checks reset the player between jumps and freeze moving paths for reachability; they are not an uninterrupted human playthrough. Physical phones, subjective level duration, audio quality, and sustained 60 fps still need hands-on device testing.

Geometry/materials are shared across instances. Static meshes are kept separate rather than merged, supporting per-entity collision and edits. Reduced-motion mode suppresses sparkles/petals and decorative motion. Best times and heart totals are stored per level with guarded localStorage; storage blocking does not prevent play.