// pnpm test:e2e:full: the CI suite plus responsive and a11y at 360 and 430 (docs/quality.md).
import { e2eConfig } from "./playwright.config";

export default e2eConfig("full");
