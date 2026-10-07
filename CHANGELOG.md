# Changelog

All notable changes to Soundbox will be documented in this file.

This project follows Semantic Versioning and uses Conventional Commits to
calculate releases.

## v0.2.0 (2026-10-07)

### Feat

- **TimeIntensity.tsx**: add timeseries component
- **generateRmsAdnPeak.ts**: add waveform analysis tools
- **global.css**: add global css files for app theme

### Fix

- **TimeIntensity.tsx**: refactor and add time scrolling
- **components**: retrieve color within the draw loop instead of using globalvar references
- **App.tsx**: cleanup app initialisation demo
- **theme.tsx**: adjust dependencies on color theme
- **src/util**: add color and theme management via tsx
- **colors.tsx**: add darkmode decetion support
- **colors.tsx**: generalise darkening function to also allow uplifting
- **App.tsx**: add component to main app layout
- **SpectrumCanvas.tsx**: big improvements and renaming move
- **SpetrumCanvas.tsx**: add initial example of using FFT to create a spectrum

### Refactor

- **TimeIntensity.tsx**: use a formatTime function to modify time stamps
- **darkmode.tsx**: improve naming of darkmode settings
- **SpectrumCanvas.tsx**: add css module
- **SpectrumCanvas.tsx**: move to widget folder

## v0.1.0 (2026-10-03)

### Refactor

- **pull-request-template.md**: add a template for github PRs
- **public/music**: add dir for storing local data music files
- **.gitignore**: add python node and data gitignore
