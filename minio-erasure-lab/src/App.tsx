import { useState } from 'react'
import { BookOpen, GitBranch, Menu, X } from 'lucide-react'
import { ConceptDeepDive } from './components/ConceptDeepDive'
import { ErasureLab, SourcePanel } from './components/ErasureLab'
import { KnowledgeCheck } from './components/KnowledgeCheck'
import { LessonIntro, LessonRail } from './components/LessonNavigation'
import { lessons } from './data/lessons'
import { useSimulation } from './hooks/useSimulation'

const initialConfig = {
  dataBlocks: 4,
  parityBlocks: 4,
  objectText: 'Hello, MinIO!',
  objectKey: 'photos/2026/snow.jpg',
}

function App() {
  const [lessonIndex, setLessonIndex] = useState(0)
  const [navOpen, setNavOpen] = useState(false)
  const simulation = useSimulation(initialConfig)
  const progress = ((lessonIndex + 1) / lessons.length) * 100

  function selectLesson(index: number) {
    setLessonIndex(index)
    setNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="MinIO Erasure Lab 首页">
          <span className="brand__mark"><i /><i /><i /></span>
          <span><b>MinIO</b> ERASURE LAB</span>
        </a>
        <div className="topbar__status">
          <span>SOURCE-DRIVEN</span>
          <i />
          <span>MINIO / MASTER</span>
          <i />
          <span>7 CHAPTERS</span>
        </div>
        <a className="github-link" href="https://github.com/minio/minio" target="_blank" rel="noreferrer"><GitBranch size={16} />SOURCE</a>
        <button className="mobile-menu" onClick={() => setNavOpen((open) => !open)} aria-label="打开章节导航">
          {navOpen ? <X /> : <Menu />}
        </button>
      </header>

      <div className="progress-line"><i style={{ width: `${progress}%` }} /></div>

      <div className="workspace" id="top">
        <aside className={`sidebar ${navOpen ? 'is-open' : ''}`}>
          <LessonRail active={lessonIndex} onSelect={selectLesson} />
          <div className="sidebar__source">
            <BookOpen size={15} />
            <div><b>阅读基线</b><span>本地 MinIO master 源码</span></div>
          </div>
        </aside>

        <main>
          <div className="lesson-layout">
            <LessonIntro index={lessonIndex} onNext={() => selectLesson(Math.min(lessonIndex + 1, lessons.length - 1))} />
            <SourcePanel lessonIndex={lessonIndex} />
          </div>

          <ErasureLab
            config={simulation.config}
            drives={simulation.drives}
            stage={simulation.stage}
            playing={simulation.playing}
            mode={simulation.mode}
            onConfigChange={simulation.setConfig}
            onToggleDrive={simulation.toggleDrive}
            onTogglePlay={() => {
              if (simulation.stage >= 5) simulation.reset()
              simulation.setPlaying(!simulation.playing)
            }}
            onStep={simulation.advance}
            onReset={() => simulation.reset()}
            onRead={simulation.runRead}
            onHeal={simulation.runHeal}
          />

          <ConceptDeepDive />
          <KnowledgeCheck />

          <footer>
            <div className="brand brand--footer"><span className="brand__mark"><i /><i /><i /></span><span><b>MinIO</b> ERASURE LAB</span></div>
            <p>基于 MinIO 源码构建的独立教学演示 · 数学可视化为简化模型，工程规则映射真实实现</p>
            <a href="#top">回到顶部 ↑</a>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
