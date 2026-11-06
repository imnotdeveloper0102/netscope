import { en } from './en';
import { vi, type Strings } from './vi';

export function getStrings(language: 'vi' | 'en'): Strings {
  return language === 'en' ? en : vi;
}

export type { Strings };
export { vi, en };
