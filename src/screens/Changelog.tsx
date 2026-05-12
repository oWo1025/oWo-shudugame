import { CHANGELOG } from 'virtual:changelog'
import { APP_VERSION } from '../version'
import { Button } from '../ui'
import { playSound } from '../sound'

export const ChangelogScreen = ({
  soundOn,
  onBack,
}: {
  soundOn: boolean
  onBack: () => void
}) => {
  const btnClick = () => playSound(soundOn, 'click')

  const latestDate = CHANGELOG.length > 0 ? CHANGELOG[0].date : '-'

  return (
    <div className="app">
      <div className="topbar">
        <Button onClick={() => { btnClick(); onBack() }}>返回</Button>
        <div className="title">更新内容</div>
        <div />
      </div>

      <div className="changelogHeader">
        <div className="changelogVersion">
          <span className="changelogVersionLabel">版本</span>
          <span className="changelogVersionNum">v{APP_VERSION}</span>
        </div>
        <div className="changelogDate">
          <span className="changelogVersionLabel">更新时间</span>
          <span className="changelogDateValue">{latestDate}</span>
        </div>
      </div>

      <div className="changelogList">
        {CHANGELOG.map((entry, i) => (
          <div key={entry.hash} className="changelogItem" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}>
            <div className="changelogItemDot" />
            <div className="changelogItemContent">
              <div className="changelogItemMsg">{entry.message}</div>
              <div className="changelogItemMeta">
                <span>{entry.date}</span>
                <span className="changelogItemHash">{entry.hash}</span>
              </div>
            </div>
          </div>
        ))}
        {CHANGELOG.length === 0 && (
          <div className="changelogEmpty">暂无更新记录</div>
        )}
      </div>
    </div>
  )
}
