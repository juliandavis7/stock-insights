# Claude Code System Instructions

## CRITICAL SYSTEM INSTRUCTIONS - READ FIRST

### Mandatory Process Requirements
**These instructions MUST be followed for every interaction:**

1. **Activity Logging**: Before and after every action, update `docs/activity.md` with:
   - User prompt received
   - Actions taken
   - Files created/modified
   - Next steps planned
   - Any decisions made or assumptions

2. **HTML ID Requirements**: Every HTML div element MUST have a unique, descriptive ID following this pattern:
   - Format: `id="section-description-element"`
   - Examples: `id="header-navigation-menu"`, `id="search-results-container"`, `id="chart-revenue-display"`
   - Use kebab-case formatting
   - Be descriptive enough for easy identification

3. **Documentation Updates**: After completing any task, update relevant documentation in the `docs/` folder

**IMPORTANT**: Acknowledge these requirements in your first response and confirm you will follow them throughout the project.

## Documentation Structure

### Primary Documents to Read
1. **`docs/prd.md`** - Complete Product Requirements Document with all project specifications
2. **`docs/activity.md`** - Project activity log (READ BEFORE EVERY SESSION)
3. **`docs/ui_setup.md`** - Current UI development task guide

### File Organization
- `docs/prd.md` - Main requirements and specifications
- `docs/activity.md` - Session logs and context preservation
- `docs/ui_setup.md` - UI Guide
- `docs/api/` - API documentation
- `docs/user/` - End user documentation

## Development Workflow Checklist

For every interaction, Claude Code must:

- [ ] Read `docs/activity.md` to understand previous context
- [ ] Read `docs/PRD.md` for complete project understanding
- [ ] Log the user's prompt in `docs/activity.md`
- [ ] Complete the requested task
- [ ] Ensure all HTML divs have unique IDs in format `id="section-description-element"`
- [ ] Update `docs/activity.md` with actions taken
- [ ] Update any relevant documentation
- [ ] Confirm completion and next steps

**Failure to follow this checklist will require starting over.**

## Project Context
This is a stock analysis web application project. All detailed requirements, technical specifications, user stories, and acceptance criteria are located in `docs/prd.md`. Always refer to that document for complete project context before beginning any work.

## Session Startup Protocol
1. Read `docs/activity.md` for previous session context
2. Read `docs/prd.md` for complete project requirements
3. Confirm understanding of system instructions
4. Proceed with user's requested task