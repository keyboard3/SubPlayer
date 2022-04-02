/* Global definitions for development */
import React from 'react';
import ffmpeg from '@ffmpeg/ffmpeg';
declare global {
  const React: typeof React;
  const FFmpeg: typeof ffmpeg;
}
