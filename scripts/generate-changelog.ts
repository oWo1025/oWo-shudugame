import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

interface ChangelogEntry {
  hash: string
  date: string
  message: string
}

const getChangelog = (): ChangelogEntry[] => {
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

const changelog = getChangelog()
writeFileSync('src/changelog.json', JSON.stringify(changelog, null, 2))
console.log(`Generated changelog with ${changelog.length} entries`)
