import React from 'react';

/**
 * FMR-4 — Speed Race mode view.
 *
 * Speed Race is the baseline mode: it renders entirely through the shared
 * RoomQuizShell chrome (header, timer ring, answer grid, scoreboards, live
 * feed) and adds no mode-specific fragments. This component exists so every
 * mode in src/pages/room/views/ has an explicit composition entry; it
 * intentionally renders nothing.
 */
const SpeedRaceView: React.FC = () => null;

export default SpeedRaceView;
