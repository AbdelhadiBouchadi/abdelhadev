// ESLint flat config: Next (core web vitals), typescript-eslint strict, jsx-a11y strict, Prettier
// compatibility, and the architecture rules from docs/architecture.md and AGENTS.md.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

// ---------- banned libraries (AGENTS.md "Not allowed") ----------
// Anchored regexes: gitignore-style groups would also match "@/lib/motion" or "@/lib/gsap".
/** Bans the named packages (exact name or any subpath). Names are regex fragments. */
const pkg = (names, message) => ({
  regex: `^(?:${names.join("|")})(?:/.*)?$`,
  message,
});

const BANNED_LIBRARIES = [
  pkg(["framer-motion", "motion"], "GSAP is the only animation engine."),
  pkg(["locomotive-scroll"], "Smooth scroll is Lenis (src/lib/lenis.ts)."),
  pkg(["@splinetool/[^/]+"], "No Spline runtime: the 3D scene is plain three.js."),
  pkg(["lottie-web", "lottie-react", "react-lottie[\\w-]*", "@lottiefiles/[^/]+"], "No Lottie."),
  pkg(["jquery"], "No jQuery."),
  pkg(
    [
      "styled-components",
      "@emotion/[^/]+",
      "@stitches/[^/]+",
      "@vanilla-extract/[^/]+",
      "styled-jsx",
    ],
    "No CSS-in-JS: Tailwind and the tokens.",
  ),
  pkg(
    [
      "react-icons",
      "@heroicons/[^/]+",
      "@phosphor-icons/[^/]+",
      "@tabler/icons-react",
      "@radix-ui/react-icons",
    ],
    "UI icons come from lucide-react only.",
  ),
  pkg(
    [
      "@mui/[^/]+",
      "@chakra-ui/[^/]+",
      "antd",
      "@mantine/[^/]+",
      "@headlessui/[^/]+",
      "@nextui-org/[^/]+",
      "@heroui/[^/]+",
    ],
    "No UI kit: components live in src/components/ui.",
  ),
];

const GSAP = pkg(
  ["gsap", "@gsap/[^/]+"],
  "Import GSAP, its plugins and useGSAP from @/lib/gsap (plugins are registered once there).",
);
const NEXT_LINK = {
  name: "next/link",
  message: "Use Link from @/i18n/navigation (locale-aware pathnames).",
};
const PARENT_RELATIVE = {
  group: ["../*", "../**"],
  message: "Use the @/ alias for cross-folder imports.",
};

// ---------- import boundaries (docs/architecture.md) ----------
const deny = (paths, message) => ({ group: paths, message });
const SECTION_PAGES = ["home", "work", "case", "about", "contact"];

/** Banned @/ imports per folder (each folder gets its own config block). */
const BOUNDARIES = {
  "src/lib": [
    deny(
      [
        "@/components/*",
        "@/components/**",
        "@/primitives/*",
        "@/primitives/**",
        "@/hooks/*",
        "@/hooks/**",
        "@/app/*",
        "@/app/**",
        "@/actions/*",
        "@/i18n/*",
        "!@/i18n/routing",
      ],
      "lib may import @/i18n/routing and nothing else from the app.",
    ),
  ],
  "src/i18n": [
    deny(
      [
        "@/components/*",
        "@/components/**",
        "@/primitives/*",
        "@/primitives/**",
        "@/hooks/*",
        "@/hooks/**",
        "@/app/*",
        "@/app/**",
        "@/actions/*",
      ],
      "i18n sits at the bottom with lib.",
    ),
  ],
  "src/hooks": [
    deny(
      [
        "@/components/*",
        "@/components/**",
        "@/primitives/*",
        "@/primitives/**",
        "@/app/*",
        "@/app/**",
        "@/actions/*",
        "@/i18n/*",
      ],
      "hooks may import lib only.",
    ),
  ],
  "src/components/{ui,brand}": [
    deny(
      [
        "@/components/layout/*",
        "@/components/sections/**",
        "@/components/three/*",
        "@/primitives/*",
        "@/primitives/**",
        "@/hooks/*",
        "@/i18n/*",
        "@/app/**",
        "@/actions/*",
      ],
      "ui and brand may import lib only.",
    ),
  ],
  "src/primitives": [
    deny(
      [
        "@/components/*",
        "@/components/**",
        "@/app/**",
        "@/actions/*",
        "@/i18n/request",
        "@/i18n/routing",
      ],
      "primitives may import hooks, lib and i18n navigation.",
    ),
  ],
  "src/components/layout": [
    deny(
      ["@/components/sections/**", "@/components/three/*", "@/app/**", "@/actions/*"],
      "layout may import ui, brand, primitives, hooks, lib and i18n.",
    ),
  ],
  "src/components/three": [
    deny(
      ["@/components/sections/**", "@/components/layout/*", "@/app/**", "@/actions/*"],
      "three may import ui, brand, primitives, hooks, lib and i18n.",
    ),
  ],
  "src/actions": [
    deny(
      [
        "@/components/*",
        "@/components/**",
        "@/primitives/*",
        "@/primitives/**",
        "@/hooks/*",
        "@/app/**",
      ],
      "actions may import lib and i18n.",
    ),
  ],
  ...Object.fromEntries(
    SECTION_PAGES.map((page) => [
      `src/components/sections/${page}`,
      [
        deny(
          [
            ...SECTION_PAGES.filter((p) => p !== page).map((p) => `@/components/sections/${p}/**`),
            "@/app/**",
          ],
          "Page sections never import another page's sections.",
        ),
      ],
    ]),
  ),
};

function restrictedImports({ gsap = true, extra = [] } = {}) {
  return [
    "error",
    {
      paths: [NEXT_LINK],
      patterns: [PARENT_RELATIVE, ...BANNED_LIBRARIES, ...(gsap ? [GSAP] : []), ...extra],
    },
  ];
}

const INLINE_SVG = {
  selector: "JSXOpeningElement[name.name='svg']",
  message:
    "Inline <svg> lives in src/components/brand/ or src/components/sections/**/diagrams/. Icons come from lucide-react.",
};

// The same colour rule as `pnpm check:tokens`, surfaced in the editor: a string that is a hex
// colour or contains a colour function. Colour values live in src/styles/tokens.css only.
const COLOUR_PATTERN = String.raw`/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|\b(?:rgba?|hsla?|hwb|oklch|oklab)\(/`;
const COLOUR_LITERAL = [
  {
    selector: `Literal[value=${COLOUR_PATTERN}]`,
    message: "Colour values live in src/styles/tokens.css. Use a token.",
  },
  {
    selector: `TemplateElement[value.raw=${COLOUR_PATTERN}]`,
    message: "Colour values live in src/styles/tokens.css. Use a token.",
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.strict,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "docs/**",
    "brand/**",
    "test-results/**",
    "playwright-report/**",
    ".lighthouseci/**",
    ".agents/**",
    ".claude/**",
  ]),
  {
    // eslint-config-next already registers the jsx-a11y plugin; add its strict rule set on top.
    files: ["**/*.{ts,tsx}"],
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "import/no-default-export": "off",
      "no-restricted-imports": restrictedImports(),
      "no-restricted-syntax": ["error", INLINE_SVG, ...COLOUR_LITERAL],
      "react/button-has-type": "error",
    },
  },
  ...Object.entries(BOUNDARIES).map(([dir, extra]) => ({
    files: [`${dir}/**/*.{ts,tsx}`],
    rules: { "no-restricted-imports": restrictedImports({ extra }) },
  })),
  {
    // The single module allowed to import GSAP packages.
    files: ["src/lib/gsap.ts"],
    rules: {
      "no-restricted-imports": restrictedImports({
        gsap: false,
        extra: BOUNDARIES["src/lib"],
      }),
    },
  },
  {
    files: ["src/components/brand/**/*.tsx", "src/components/sections/**/diagrams/**/*.tsx"],
    rules: { "no-restricted-syntax": ["error", ...COLOUR_LITERAL] },
  },
  {
    // Tests assert real colour values (the manifest, the token checker's own cases).
    files: ["tests/**/*.ts"],
    rules: { "no-restricted-syntax": ["error", INLINE_SVG] },
  },
  {
    // Node scripts and configs.
    files: ["scripts/**/*.mjs", "*.config.{mjs,ts}", "lighthouserc.cjs"],
    rules: { "no-restricted-imports": "off" },
  },
  prettier,
]);
