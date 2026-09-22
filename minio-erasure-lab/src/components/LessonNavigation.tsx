import { ArrowRight, Check, ChevronRight, Code2, Gauge, Layers3 } from 'lucide-react'
import { lessons } from '../data/lessons'

export function LessonRail({ active, onSelect }: { active: number; onSelect: (index: number) => void }) {
  return (
    <nav className="lesson-rail" aria-label="学习章节">
      <div className="lesson-rail__label">LEARNING PATH</div>
      {lessons.map((lesson, index) => (
        <button
          key={lesson.id}
          className={active === index ? 'is-active' : ''}
          onClick={() => onSelect(index)}
        >
          <span>{index < active ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span>
          <div><strong>{lesson.eyebrow.split('/ ')[1]}</strong><small>{lesson.title}</small></div>
          <ChevronRight size={14} />
        </button>
      ))}
    </nav>
  )
}

export function LessonIntro({ index, onNext }: { index: number; onNext: () => void }) {
  const lesson = lessons[index]
  return (
    <section className="lesson-intro">
      <div className="lesson-intro__copy">
        <span className="kicker">{lesson.eyebrow}</span>
        <h1>{lesson.title}</h1>
        <p>{lesson.summary}</p>
        <div className="insight"><span>记住</span>{lesson.insight}</div>
        <a href="#lab">进入实验台 <ArrowRight size={16} /></a>
      </div>
      <div className="concept-card">
        <div className="concept-card__grid" />
        <div className="concept-object"><Code2 /><span>OBJECT</span></div>
        <ArrowRight />
        <div className="concept-split">
          <div><i />D1</div><div><i />D2</div><div><i />D3</div><div><i />D4</div>
          <div className="parity"><i />P1</div><div className="parity"><i />P2</div><div className="parity"><i />P3</div><div className="parity"><i />P4</div>
        </div>
        <div className="concept-card__meta">
          <span><Layers3 size={14} /> OBJECT-LEVEL</span>
          <span><Gauge size={14} /> ANY D OF N</span>
        </div>
      </div>
      <button className="lesson-next" onClick={onNext} disabled={index === lessons.length - 1}>
        下一章 <ChevronRight size={16} />
      </button>
    </section>
  )
}
