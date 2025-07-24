import {
  Bot,
  Settings,
  SquareLibrary,
  type LucideIcon,
  TestTubeDiagonal,
  Send
} from 'lucide-react';
import { IconName } from "./Icon.types";

export const iconMapper: Record<IconName, LucideIcon> = {
  bot: Bot,
  settings: Settings,
  'test-tubes': TestTubeDiagonal,
  'square-library': SquareLibrary,
  send: Send
};