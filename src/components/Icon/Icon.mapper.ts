import {
  Bot,
  Settings,
  SquareLibrary,
  type LucideIcon,
  TestTubeDiagonal
} from 'lucide-react';
import { IconName } from "./Icon.types";

export const iconMapper: Record<IconName, LucideIcon> = {
  bot: Bot,
  settings: Settings,
  'test-tubes': TestTubeDiagonal,
  'square-library': SquareLibrary,
};