import type { Plugin } from 'vite'
import { execSync } from 'child_process'

interface ChangelogEntry {
  hash: string
  date: string
  message: string
}

export default function changelogPlugin(): Plugin {
  const generateChangelog = (): ChangelogEntry[] => {
    try {
      const output = execSync(
        'git log --pretty=format:"%H|%ai|%s" --no-merges -50',
        { encoding: 'utf-8', maxBuffer: 1024 * 1024 }
      )
      return output
        .trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [hash, date, ...msgParts] = line.split('|')
          return {
            hash: hash.slice(0, 7),
            date: date.slice(0, 16).replace('T', ' '),
            message: msgParts.join('|'),
          }
        })
    } catch {
      return []
    }
  }

  let changelog: ChangelogEntry[] = []

  return {
    name: 'vite-plugin-changelog',
    buildStart() {
      changelog = generateChangelog()
    },
    resolveId(id) {
      if (id === 'virtual:changelog') return '\0virtual:changelog'
    },
    load(id) {
      if (id === '\0virtual:changelog') {
        return `export const CHANGELOG = ${JSON.stringify(changelog)}`
      }
    },
  }
}
