# generator

`npm i @larner.dev/generator`

This is a tool for scaffolding / generating new projects and packages. It's different from other tools like yeoman because it makes upgrading existing projects easier when the base template changes.

## Usage

After installing, run:

`gen new typescript-nodejs`

This will generate a new node project with typescript. Right now this is the only template that's supported, but more are in the works.

Imagine a few weeks after you generated your typescript-nodejs project some of the dependencies changed (eg. there's a newer version of jest and you want to tweak the eslintrc). After updating the code in the template simply run:

`gen upgrade path/to/existing/project`

This will automatically upgrade files in your existing project and highlight the files where there conflicts that need to be addressed manually.

## How does it work?

Behind the scenes, generator hashes the contents of each file immediately after it is generated. These hashed files are stored in `.generator/hash`, which is a directory that mirrors the directory structure of the generated project.

When upgrading, the tool automatically compares the hash of the original file with the hash of the current file to see if it was changed. It only replaces files that you have not changed. For files that yo have changed, it generates git-style merge conflicts for you to resolve manually.

## Todo

I'm open to feedback on this project. If you think this could be useful for you or your team please share your thoughts or give it a star. Here are the improvements that are on my radar right now.

- [A better way to add custom templates](https://github.com/larner-dev/generator/issues/1)
- [Improve conflict resolution for config files (.json, .yml, etc)](https://github.com/larner-dev/generator/issues/2)
- [More templates](https://github.com/larner-dev/generator/issues/3)
