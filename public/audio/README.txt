Aspect Studio VPN offline soundtrack

Bundled files:
  track-1.mp3  - Ad Infinitum — Dreamstate Logic
  track-2.mp3  - Reflections Of Reality — Dreamstate Logic

Vite copies these files into dist/audio/. The .NET publish step places the
built frontend in wwwroot/audio/, and the Windows installer includes that
folder. Local playback is used first and does not depend on YouTube or the VPN
network route.

The online player remains a fallback if a local audio file is missing or fails
to load. The app's Music setting controls enable/disable, track selection and
volume.

The MP3s were supplied by the project owner for this private test package.
Confirm redistribution rights before distributing an installer containing
them to other people.