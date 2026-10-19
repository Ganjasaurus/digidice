# DIGIDICE · RETROFLESHED

A standalone browser version of the original physical dice roller recovered from the DIGIDICE navigation page at https://diecardtemp.wordpress.com/digidice/.

## Open it

The preview for this Codex chat is **http://127.0.0.1:8765/**.

To reopen the downloaded app on this Windows computer, unzip `retro-fleshed-digidice.zip`, open the `digidice` folder and double-click **Start DIGIDICE.cmd**. It uses the Node runtime already bundled with Codex and opens a local browser preview. Keep its small window open while using the app; close it to stop the preview. If a DIGIDICE preview is already running, use its address.

The app includes its libraries, original textures and audio. It needs no internet connection, account or build step. Other computers can serve the `digidice` folder with any static web server. The plain `index.html` is designed for browsers that allow local files; direct file opening could not be verified because the Codex browser permits HTTP and HTTPS URLs only.

## Use it

Choose a shape, colour and whole amount for each set, then hit **ROLL**. Zero omits a set. Amounts are limited to 12 per set to keep the physical simulation manageable. Both sets cannot be zero.

**Space** rolls from the tray or the focused Roll button. **Enter** rolls from an amount field. All controls work with Tab and show a visible focus outline.

Music is optional; the original dice and coin sounds play on a roll. Fullscreen falls back to an expanded app view on browsers without the fullscreen API. Motion is optional and asks for browser permission where required; physical device sensors were not available for a handset test.

The original standard tetrahedron reads from below: choosing it switches the whole tray to **UNDERSIDE VIEW**. The TeeJayhedron retains its transparent outer tetrahedron and smaller numbered inner tetrahedron. Results describe the faces visible from the current view. A `?` means a die landed at an angle; reroll to resolve it. Results are read from the physical dice rather than generated separately.

## Files

- `digidice/` — the working app, launcher and all required assets.
- `recovered-original/` — untouched surviving WordPress page data and a decoded copy; the original is damaged and not executable.
- `RECOVERY.md` — source provenance, original mechanics, repairs and verification limits.
- `mechanics-checks.json` and `ui-checks.json` — check results.
- `screenshots/desktop.jpg` and `screenshots/mobile.jpg` — saved app views.

Nothing was published, and no domain or other website/game project was changed.

The app's final brand spelling is **RetroFleshed / RETROFLESHED**. The saved screenshots and browser check observations predate that final text-only correction. They were retained without another browser run or capture, as requested.
