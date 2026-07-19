# Agent Guidelines: Ponytail Protocol

All AI coding assistants working in this repository MUST follow the **Ponytail Decision Ladder** before writing, editing, or refactoring code.

## The Ponytail Decision Ladder

Before adding, editing, or refactoring code, evaluate the task against this decision hierarchy and stop at the first applicable rung:

1. **YAGNI (Does this need to exist?):** If a feature, parameter, or abstraction is not strictly needed right now, skip it.
2. **Reuse Existing Code:** Search existing helper functions, components, services, and hooks across `/client`, `/server`, `/python-ai`, and `/database` before writing new ones.
3. **Use Standard Library First:** Use language standard libraries (Node/JS/TypeScript/Python built-ins) over custom utility functions.
4. **Native Platform Capabilities:** Use native Web APIs, HTML5 standards, and platform features instead of third-party wrappers.
5. **No Unnecessary Dependencies:** Use dependencies already installed in `package.json` or `requirements.txt`. Do not install new packages unless strictly required.
6. **One-Liners & Minimal Code:** Prefer straightforward, concise solutions over complex, multi-layered abstractions.
7. **Absolute Minimum Code:** Write the minimal amount of code needed to achieve the goal securely, accessibly, and correctly.

## Transparency & Intentional Shortcuts
When choosing a simple shortcut over a complex pattern, document it with:
`// ponytail: [rationale and optional future upgrade path]`
