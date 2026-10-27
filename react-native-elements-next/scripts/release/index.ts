import path from 'path';
import fs from 'fs';
import semver from 'semver';
import inquirer from 'inquirer';
import { recommendVersion, updateChangelog } from '@lerna/conventional-commits';

const rootPath = path.resolve(__dirname, '../..');
const pkgRootPath = path.resolve(rootPath, 'packages');
const websiteRootPath = path.resolve(rootPath, 'website');
const pkgScope = '@rneui';

type TPkg = {
  name: string;
  version: string;
  location: string;
  manifestLocation: string;
};

function safeReadJSON(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Failed to read or parse JSON at ${filePath}:`, e);
    return null;
  }
}

function safeWriteJSON(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Failed to write JSON at ${filePath}:`, e);
  }
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

class Release {
  static async bump(pkg: TPkg) {
    const manifest = safeReadJSON(pkg.manifestLocation);
    if (!manifest) return;

    const oldVersion = manifest.version;
    manifest.version = pkg.version;

    if (pkg.name === 'themed') {
      manifest.devDependencies = manifest.devDependencies || {};
      manifest.peerDependencies = manifest.peerDependencies || {};
      manifest.devDependencies['@rneui/base'] = pkg.version;
      manifest.peerDependencies['@rneui/base'] = pkg.version;
    }
    if (pkg.name === 'base') {
      await this.updateWebsiteDocs(oldVersion, pkg.version);
    }

    safeWriteJSON(pkg.manifestLocation, manifest);

    await updateChangelog(pkg, 'independent', {
      changelogPreset: 'conventional-changelog-angular',
      rootPath,
      tagPrefix: 'v',
      version: pkg.version,
    });
  }

  static async updateWebsiteDocs(oldVersion: string, newVersion: string): Promise<void> {
    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: `Have you updated the website docs for version ${newVersion}?`,
    });

    if (!confirm) {
      console.log('Please update the website docs before proceeding.');
      process.exit(1);
    }

    const semverDiff = semver.diff(oldVersion, newVersion);
    const docsPath = path.resolve(websiteRootPath, 'docs');
    const versionsPath = path.resolve(websiteRootPath, 'versions.json');

    if (semverDiff === 'patch' || semverDiff === 'minor') {
      const oldVersionPath = path.resolve(websiteRootPath, `versioned_docs/version-${oldVersion}`);
      const newVersionPath = path.resolve(websiteRootPath, `versioned_docs/version-${newVersion}`);
      if (fs.existsSync(oldVersionPath)) {
        fs.renameSync(oldVersionPath, newVersionPath);
        console.log(`Renamed docs: ${oldVersionPath} -> ${newVersionPath}`);
      }
      copyDir(docsPath, newVersionPath);

      const oldSidebar = path.resolve(websiteRootPath, `versioned_sidebars/version-${oldVersion}-sidebars.json`);
      const newSidebar = path.resolve(websiteRootPath, `versioned_sidebars/version-${newVersion}-sidebars.json`);
      if (fs.existsSync(oldSidebar)) {
        fs.renameSync(oldSidebar, newSidebar);
        console.log(`Renamed sidebar: ${oldSidebar} -> ${newSidebar}`);
      }

      const versions = safeReadJSON(versionsPath) || [];
      const idx = versions.indexOf(oldVersion);
      if (idx !== -1) versions[idx] = newVersion;
      else versions.unshift(newVersion);
      safeWriteJSON(versionsPath, versions);
    } else if (semverDiff === 'major') {
      const newVersionPath = path.resolve(websiteRootPath, `versioned_docs/version-${newVersion}`);
      const newSidebar = path.resolve(websiteRootPath, `versioned_sidebars/version-${newVersion}-sidebars.json`);
      if (!fs.existsSync(newVersionPath)) {
        fs.mkdirSync(newVersionPath, { recursive: true });
      }
      if (!fs.existsSync(newSidebar)) {
        safeWriteJSON(newSidebar, {});
      }
      copyDir(docsPath, newVersionPath);

      const versions = safeReadJSON(versionsPath) || [];
      if (!versions.includes(newVersion)) versions.unshift(newVersion);
      safeWriteJSON(versionsPath, versions);
    }
  }

  static async recommendVersion(pkg: TPkg): Promise<string> {
    return recommendVersion(pkg, 'independent', {
      changelogPreset: 'conventional-changelog-angular',
      rootPath,
      tagPrefix: 'v',
      prereleaseId: '',
    });
  }

  static async getVersion(): Promise<TPkg[]> {
    const pkgs: TPkg[] = [];
    for (const pkg of fs.readdirSync(pkgRootPath)) {
      const location = path.resolve(pkgRootPath, pkg);
      const manifestLocation = path.resolve(location, 'package.json');
      if (!fs.existsSync(manifestLocation)) continue;
      const { version } = safeReadJSON(manifestLocation) || {};
      if (!version) continue;
      const recommendedVersion = await this.recommendVersion({
        name: pkg,
        version,
        location,
        manifestLocation,
      });
      console.log(` - ${pkgScope}/${pkg}:  ${version} => ${recommendedVersion}`);
      pkgs.push({ name: pkg, version, location, manifestLocation });
    }
    return pkgs;
  }

  static questions({ name, version }: TPkg): inquirer.QuestionCollection {
    return [
      {
        type: 'list',
        name,
        message: `${pkgScope}/${name} `,
        choices: [
          { name: 'major ' + semver.inc(version, 'major'), value: semver.inc(version, 'major') },
          { name: 'minor ' + semver.inc(version, 'minor'), value: semver.inc(version, 'minor') },
          { name: 'patch ' + semver.inc(version, 'patch'), value: semver.inc(version, 'patch') },
          'premajor',
          'preminor',
          'prepatch',
          'prerelease',
        ],
        suffix: version,
      },
      {
        askAnswered: true,
        when: (answers) => answers[name]?.startsWith('pre'),
        name,
        message: ' ',
        suffix: 'prerelease',
        type: 'list',
        choices: (ans) => [
          semver.inc(version, ans[name], 'alpha'),
          semver.inc(version, ans[name], 'beta'),
          semver.inc(version, ans[name], 'rc'),
          semver.inc(version, ans[name]),
          'manual',
        ],
      },
      {
        askAnswered: true,
        when: (answers) => answers[name] === 'manual',
        name,
        validate: (input) => Boolean(semver.valid(input)) || 'Invalid version',
        message: ' ',
        suffix: 'manual',
        type: 'input',
      },
    ];
  }
}

async function main() {
  try {
    const pkgs = await Release.getVersion();
    const prompts = pkgs.map(Release.questions).flat();
    const versions = await inquirer.prompt([
      ...prompts,
      { type: 'confirm', name: 'confirm', message: 'confirm' },
    ]);
    if (!versions.confirm) {
      console.log('Aborted.');
      return;
    }
    for (const pkg of pkgs) {
      if (!semver.gt(versions[pkg.name], pkg.version)) {
        throw new Error(`${pkg.name} version is not greater than current version`);
      }
      pkg.version = versions[pkg.name];
      await Release.bump(pkg);
    }
    console.log('Release process completed.');
    console.log('Remember to exec `yarn` to update yarn.lock');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
