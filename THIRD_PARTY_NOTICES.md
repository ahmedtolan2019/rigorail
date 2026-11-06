# Third-party notices

Rigorail is designed and engineered by Ahmed Tolan and licensed under the
[MIT License](LICENSE). This file credits work it draws on.

## Inspiration

The project began from the idea in
[kston83/react-ai-template](https://github.com/kston83/react-ai-template) by Kris
Stone: a React starter with instructions for AI coding agents. Rigorail's
architecture, modules, screens, design system, checks, documentation and tooling
are original work. A review on 2026-11-06 found that none of that project's
application code remains; only standard tool configuration (Vite/TypeScript
config, the default shadcn theme tokens, a one-line Husky hook) overlaps. Its
notice is reproduced here for those portions:

> MIT License. Copyright (c) 2025 Kristopher Stone. Permission is hereby granted,
> free of charge, to any person obtaining a copy of this software and associated
> documentation files, to deal in the Software without restriction, subject to
> including this copyright notice and permission notice in all copies or
> substantial portions of the Software. The software is provided "as is", without
> warranty of any kind.

## Bundled agent skills

`.agents/skills/` contains optional third-party guidance for coding agents, each
under the MIT License as declared in its `SKILL.md`:

| Skill | Source |
| --- | --- |
| frontend-design | [anthropics/skills](https://github.com/anthropics/skills) |
| shadcn | [shadcn/ui](https://github.com/shadcn-ui/ui) |
| tailwind-design-system | [wshobson/agents](https://github.com/wshobson/agents) |
| vercel-composition-patterns | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| web-design-guidelines | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |

## Dependencies

npm dependencies keep their own licenses; see each package in `node_modules` or
run `npx license-checker --summary`. Fonts (Inter, Noto Sans Arabic) are
distributed under the SIL Open Font License through Fontsource.
