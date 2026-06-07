# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets).

## How to create a changeset

After making changes to one or more packages, run:

```bash
pnpm changeset
```

Follow the prompts to select affected packages and write a summary of the change. This creates a Markdown file in this directory that describes what changed and whether it's a patch, minor, or major bump.

## Release process

The `release.yml` GitHub Action automatically opens a "Release PR" that bumps versions and updates changelogs based on accumulated changesets. Merging that PR publishes packages to npm.
