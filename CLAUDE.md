# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Choppy is a client-side audio file splitting and download application built with React 19, TypeScript, and Vite. The app allows users to upload audio files (MP3, M4A, AAC, OGG, WAV) and split them into segments based on timestamp input, then download the segments as a ZIP file.

## Development Commands

### Primary Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript compilation then Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

### Important Notes
- The project uses Vite with React SWC plugin for fast refresh
- TypeScript compilation is part of the build process
- ESLint is configured with React hooks and refresh plugins

## Architecture Overview

This is a single-page application with a client-side architecture designed for audio processing:

### Key Technologies
- **React 19** with TypeScript for UI components
- **Vite** for development and build tooling
- **Web Audio API** and **AudioContext** for audio processing
- **music-metadata-browser** for metadata reading
- **lamejs** for MP3 encoding
- **JSZip** for ZIP file generation
- **Tailwind CSS** and **shadcn/ui** for styling (planned)

### Planned Application Structure
The app follows a component-based architecture:
- `FileUploader.tsx` - Handles drag & drop and file selection
- `TimestampEditor.tsx` - Text area for bulk timestamp input
- `AudioPlayer.tsx` - Audio preview and playback controls
- `MetadataDisplay.tsx` - Shows extracted audio metadata
- `ProgressBar.tsx` - Progress visualization during processing
- `DownloadButton.tsx` - Triggers processing and ZIP download

### Data Flow
1. User uploads audio file via drag & drop or file picker
2. Metadata is extracted and displayed
3. User enters timestamps in format: `startTime ~ endTime title`
4. Audio is split into segments with preserved metadata
5. Segments are packaged into ZIP for download

### Key Features
- **Client-side processing** - No server required
- **Metadata preservation** - Maintains artist, album, artwork, etc.
- **Flexible timestamp input** - Supports omitted start/end times
- **Multiple audio formats** - MP3 (priority), M4A, AAC, OGG, WAV
- **Real-time validation** - Timestamp validation and error handling

## Development Guidelines

### File Organization
- Place audio processing logic in `utils/` directory
- Use custom hooks in `hooks/` for reusable audio operations
- Keep components focused on UI concerns
- Implement proper TypeScript interfaces for audio data structures

### Audio Processing Considerations
- Handle large files with memory efficiency in mind
- Implement proper error handling for unsupported formats
- Use Web Workers for heavy processing if needed
- Validate timestamp ranges against audio duration

### Performance Requirements
- File loading: 5 seconds per 100MB
- Split processing: 10 seconds for 10 minutes → 5 segments
- UI responsiveness: <100ms
- Target Chrome browser compatibility

## Timestamp Format
The app uses a specific timestamp input format:
```
MM:SS ~ MM:SS Title
HH:MM:SS ~ HH:MM:SS Title
```

With support for omitted start/end times:
- Missing start time uses previous segment's end time
- Missing end time uses next segment's start time

## AI Interaction Guidelines
- レスポンスは全て日本語で