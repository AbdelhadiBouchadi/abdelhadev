export interface Violation {
  rule: string;
  line: number;
  match: string;
}
export function radiusTokens(globalsCss: string): Set<string>;
export function colourViolations(text: string): Violation[];
export function motionViolations(text: string): Violation[];
export function radiusViolations(text: string, tokens: Set<string>): Violation[];
export function checkFile(path: string, text: string, tokens: Set<string>): Violation[];
