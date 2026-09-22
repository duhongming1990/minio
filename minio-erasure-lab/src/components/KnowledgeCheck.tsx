import { useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { quizQuestions } from '../data/lessons'

export function KnowledgeCheck() {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const score = quizQuestions.filter((question, index) => answers[index] === question.correct).length
  const complete = Object.keys(answers).length === quizQuestions.length

  return (
    <section className="quiz">
      <div className="section-heading">
        <div><span className="kicker">KNOWLEDGE CHECK</span><h2>现在，你真的理解了吗？</h2></div>
        <p>选错不可怕——解释会把你带回源码中的关键判断。</p>
      </div>
      <div className="quiz__grid">
        {quizQuestions.map((question, questionIndex) => {
          const selected = answers[questionIndex]
          return (
            <article className="quiz-card" key={question.question}>
              <div className="quiz-card__number">0{questionIndex + 1}</div>
              <h3>{question.question}</h3>
              <div className="quiz-card__options">
                {question.options.map((option, optionIndex) => {
                  const answered = selected !== undefined
                  const correct = question.correct === optionIndex
                  const chosen = selected === optionIndex
                  return (
                    <button
                      key={option}
                      disabled={answered}
                      className={answered && correct ? 'correct' : answered && chosen ? 'wrong' : ''}
                      onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                    >
                      <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                      {answered && correct && <Check size={15} />}
                      {answered && chosen && !correct && <X size={15} />}
                    </button>
                  )
                })}
              </div>
              {selected !== undefined && <p className={selected === question.correct ? 'is-correct' : 'is-wrong'}>{question.explanation}</p>}
            </article>
          )
        })}
      </div>
      {complete && (
        <div className="quiz-result">
          <div><span>{score}/{quizQuestions.length}</span><div><strong>{score === quizQuestions.length ? '源码链路已打通' : '再实验一次，会更牢固'}</strong><small>你已经完成从对象到恢复的学习路径</small></div></div>
          <button onClick={() => setAnswers({})}><RotateCcw size={15} />重新作答</button>
        </div>
      )}
    </section>
  )
}
