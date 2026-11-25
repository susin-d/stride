import { useState } from 'react'
import { Terminal } from 'lucide-react'
import { eveCapabilities, eveDemoMessages, eveTerminalLines } from '../data'

export function Eve() {
  const [selectedTrace, setSelectedTrace] = useState(0)

  return (
    <section id="eve" className="broadsheet__section" aria-labelledby="eve-title">
      <div className="broadsheet__container">
        <div className="bs-section-header">
          <div>
            <h2 id="eve-title" className="bs-h2">
              An assistant that lives inside your work.
            </h2>
            <p className="bs-lead">
              Not a separate tab. Eve reads workspace files, recalls semantic memory, browses the web,
              triages WhatsApp, and calls you when schedules fire.
            </p>
          </div>
          <span className="bs-section-meta">03 / EVE AI DOSSIER</span>
        </div>

        <div className="bs-eve__grid">
          <div className="bs-eve__console">
            <div className="bs-workbench__label">
              <span>Tool Loop Trace</span>
              <span>6 Providers</span>
            </div>

            <div className="bs-eve__trace-list" role="list" aria-label="Eve tool calls">
              {eveTerminalLines.map((line, i) => (
                <button
                  key={line}
                  type="button"
                  role="listitem"
                  className={`bs-eve__trace-item${selectedTrace === i ? ' is-active' : ''}`}
                  onClick={() => setSelectedTrace(i)}
                >
                  <Terminal size={13} aria-hidden="true" />
                  <span>{line}</span>
                </button>
              ))}
            </div>

            <div className="bs-eve__transcript" aria-label="Example Eve conversation">
              {eveDemoMessages.map((msg, i) => (
                <div key={`${msg.from}-${i}`} className="bs-eve__msg">
                  <span className="bs-eve__msg-role">{msg.from}</span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bs-eve__ledger">
            {eveCapabilities.map((cap) => (
              <article key={cap.title} className="bs-eve__cap">
                <div className="bs-eve__cap-head">
                  <cap.icon size={16} aria-hidden="true" />
                  <h3>{cap.title}</h3>
                </div>
                <p>{cap.desc}</p>
                <ul className="bs-eve__cap-points">
                  {cap.points.map((pt) => (
                    <li key={pt}>· {pt}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
