# Contributing to BG Remover

**English** | [Bahasa Indonesia](CONTRIBUTING.id.md)

Thanks for wanting to help. Bug reports, ideas, translations and pull requests are all welcome.

## Reporting a bug

Open an [issue](https://github.com/RayHanC4-Lua/bgremover/issues/new/choose) and pick **Bug report**. Please include:

- Where it happened: website or Android app
- Device and browser, for example "Samsung A52, Chrome 141"
- Steps to reproduce
- A screenshot if possible

Do not upload private photos. Use the sample images in the app instead.

## Suggesting a feature

Open an issue and pick **Feature request**. Describe the problem you want to solve, not only the solution.

## Development setup

```bash
git clone https://github.com/RayHanC4-Lua/bgremover.git
cd bgremover
python -m http.server 8080 -d public
```

Open http://localhost:8080. There is no build step.

## Code style

- Vanilla HTML, CSS and JavaScript only. No frameworks, bundlers or new runtime dependencies.
- Keep everything running on the device. Never send user images to a server.
- Match the existing formatting: two-space indentation, single quotes in JavaScript.
- The codebase does not use inline code comments. Explain your reasoning in the pull request instead.
- Test on a phone-sized screen (360 px wide) in both light and dark mode.
- If you change files in `public/`, bump `CACHE` in `public/sw.js`.

## Pull requests

1. Fork the repo and create a branch from `main`, for example `fix/brush-undo`.
2. Keep each pull request focused on one change.
3. Describe what changed and how you tested it. Add before and after screenshots for UI changes.
4. Make sure the site still works offline after the first load.

## Android app

The Android app in `android/` is a thin WebView shell. Most changes belong in `public/`. Only touch `android/` for native features such as file picking, saving to the gallery, or system bars. The GitHub Actions workflow builds it, so you do not need Android Studio for web changes.

## License

By contributing, you agree that your contributions are released under the [MIT License](LICENSE).
