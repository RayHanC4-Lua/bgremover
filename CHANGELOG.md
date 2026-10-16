# Changelog

**English** | [Bahasa Indonesia](CHANGELOG.id.md)

## 1.0.1 (2026-10-16)

### Added
- Android app for Google Play: native WebView shell with the system photo picker, saving straight to the gallery, offline screen, and system bars that follow the theme
- App mode on the website: animated loading screen, simplified layout, and native-feeling touch behavior
- Processing animation: the photo blurs with drifting light particles, then the background dissolves dot by dot
- Tester sign-up page at `/testers` backed by Supabase
- Maskable icons, Digital Asset Links, and an offline fallback in the service worker
- Google Play store graphics in `store/`
- GitHub Actions workflow that builds a signed AAB and APK

### Fixed
- Page overflowing sideways on phones after an image was processed

### Changed
- New app icon
- Donation links and ads are hidden inside the Android app

## 1.0.0

- First public release of the website: automatic background removal, Portrait HD, editing tools, compare slider, PNG/JPG/WebP export, light and dark mode, PWA
