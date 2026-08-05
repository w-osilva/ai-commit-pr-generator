# Changelog

All notable changes to the **AI Commit & PR Generator** extension are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-08-05

### Added

- This changelog, surfaced on the Marketplace listing.

### Changed

- Reworked the README around the Marketplace layout: a features section up front, requirements, a commands table, and Marketplace badges. The OpenRouter explainer moved into the quick start instead of leading the page.
- Documented the built-in PR template fallback and where each ✨ action lives.
- New extension icon.

## [0.2.1] - 2026-06-04

### Added

- **Claude CLI backend.** Generate commit messages and PR descriptions without an API key, reusing the session your local `claude` CLI is already logged into — SSO included. Pick it with the new `aiCommitPr.provider` setting, and point `aiCommitPr.claudeCliPath` at the binary when `claude` is not on the extension host's PATH.
- Backend dispatch behind an `AiProvider` interface, so commit and PR generation both route through whichever provider is selected.
- Tolerant JSON extraction for PR responses. A model that wraps its JSON in prose no longer loses the whole generation.

### Changed

- Rewrote the built-in commit and PR prompts. They are stricter about the output shape and no longer assume a particular stack.
- Default prompts now live inside the extension instead of as setting defaults, so `aiCommitPr.commitPrompt` and `aiCommitPr.prPrompt` start empty and only hold your overrides.
- The packaged `.vsix` no longer carries the docs and test directories.

### Fixed

- The extension host could crash when the `claude` process exited before draining stdin. The runner now swallows the EPIPE and cannot settle its promise twice.
- A failed preflight check showed two error dialogs instead of one.

## [0.1.4] - 2026-04-23

### Changed

- Default model switched to `openai/gpt-oss-120b:free`.
- Default prompts embedded in the extension rather than duplicated in the settings schema.

## [0.1.3] - 2026-04-21

### Added

- Extension icon.
- [DEVELOPMENT.md](DEVELOPMENT.md) with the build, watch and packaging workflow.
- The release script now pushes the tag, creates a GitHub Release with the `.vsix` attached, and prints the Marketplace publishing link.

### Fixed

- Repository URL in the extension manifest.

## [0.1.2] - 2026-04-21

### Added

- MIT license.

### Fixed

- Publisher ID in the manifest and the repository link in the README.

## [0.1.1] - 2026-04-21

### Added

- Initial release.
- Commit message generation from the staged diff, following Conventional Commits, from the ✨ action in the Source Control title bar.
- PR description generation from the commits between the current branch and its base branch.
- Automatic PR template detection, with a built-in Summary / Motivation / Changes / Test plan fallback.
- OpenRouter backend, with configurable model and base branch.

[Unreleased]: https://github.com/w-osilva/ai-commit-pr-generator/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/w-osilva/ai-commit-pr-generator/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/w-osilva/ai-commit-pr-generator/compare/v0.1.4...v0.2.1
[0.1.4]: https://github.com/w-osilva/ai-commit-pr-generator/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/w-osilva/ai-commit-pr-generator/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/w-osilva/ai-commit-pr-generator/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/w-osilva/ai-commit-pr-generator/releases/tag/v0.1.1
