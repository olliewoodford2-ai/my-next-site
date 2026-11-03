'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'
import type { FormEvent } from 'react'
import { CustomCursor } from '@/components/cursor/CustomCursor'
import { AfterimageScene } from '@/components/scenes/AfterimageScene'
import { FinaleScene } from '@/components/scenes/FinaleScene'
import { GenesisScene } from '@/components/scenes/GenesisScene'
import { HeroScene } from '@/components/scenes/HeroScene'
import { OpeningScene } from '@/components/scenes/OpeningScene'
import { OracleScene } from '@/components/scenes/OracleScene'
import { SceneProvider } from '@/components/three/ThreeCanvas'
import { SCENES } from '@/types'
import { useLenis } from '@/hooks/useLenis'
import { useSoundManager } from '@/hooks/useSoundManager'
import { useScrollStore } from '@/store'

const DynamicCanvas = dynamic(
  () => import('@/components/three/ThreeCanvas').then((mod) => mod.ThreeCanvas),
  { ssr: false, loading: () => <div className="canvas-fallback" aria-hidden="true" /> },
)

const navItems = [
  ['Studio', 'studio'],
  ['Services', 'services'],
  ['Selected work', 'work'],
  ['Ventures', 'ventures'],
  ['Enquiries', 'enquiries'],
] as const

const services = [
  ['01', 'Creative direction', 'A clear point of view for brands, places and ideas that refuse to blend in.'],
  ['02', 'Digital experience', 'Editorial websites and digital worlds shaped around feeling, rhythm and intent.'],
  ['03', 'Creative technology', 'Generative systems, motion and interaction that make a distinctive identity move.'],
  ['04', 'Brand worlds', 'The language, visual system and launch moments that give ambitious work a longer life.'],
]

const sceneCaptions = {
  opening: ['Enter the impossible', 'A studio for the unseen'],
  hero: ['Meaning takes form', '01 / 06 — Hero'],
  genesis: ['Form, in motion', '02 / 06 — Genesis'],
  oracle: ['A signal, held', '03 / 06 — Oracle'],
  afterimage: ['What remains moves', '04 / 06 — Afterimage'],
  finale: ['Leave a trace', '05 / 06 — Finale'],
} as const

function SceneContainer() {
  return (
    <DynamicCanvas
      sceneConfig={{ fov: 50, near: 0.1, far: 1000, backgroundColor: 0x0a0a0a, enablePostProcessing: true }}
      className="fixed inset-0 z-0"
    >
      <Suspense fallback={null}>
        <ActiveScene />
      </Suspense>
    </DynamicCanvas>
  )
}

function ActiveScene() {
  const { currentScene } = useScrollStore()
  return (
    <SceneProvider sceneId={currentScene}>
      {currentScene === 'opening' && <OpeningScene />}
      {currentScene === 'hero' && <HeroScene />}
      {currentScene === 'genesis' && <GenesisScene />}
      {currentScene === 'oracle' && <OracleScene />}
      {currentScene === 'afterimage' && <AfterimageScene />}
      {currentScene === 'finale' && <FinaleScene />}
    </SceneProvider>
  )
}

function SceneRail() {
  const { scrollTo } = useLenis()
  const { currentScene } = useScrollStore()

  return (
    <nav className="scene-rail" aria-label="Experience progress">
      {SCENES.map((scene) => (
        <button
          key={scene.id}
          className={`scene-dot ${currentScene === scene.id ? 'is-active' : ''}`}
          onClick={() => scrollTo((scene.startProgress + scene.endProgress) / 2, { duration: 1.4 })}
          aria-label={`Jump to ${scene.name}`}
          aria-current={currentScene === scene.id ? 'step' : undefined}
        />
      ))}
    </nav>
  )
}

function SoundToggle() {
  const { isMuted, toggleMute } = useSoundManager()

  return (
    <button
      className="sound-hint"
      onClick={toggleMute}
      aria-pressed={isMuted}
      aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
    >
      <span aria-hidden="true">{isMuted ? '◌' : '◉'}</span>
      <span>{isMuted ? 'Sound off' : 'Sound on'}</span>
    </button>
  )
}

function CinematicCaption() {
  const { currentScene, sceneProgress } = useScrollStore()
  const [title, detail] = sceneCaptions[currentScene]
  const entrance = Math.min(1, Math.max(0, sceneProgress * 3.2))
  const exit = Math.min(1, Math.max(0, (sceneProgress - 0.72) * 3.6))
  const reveal = entrance * (1 - exit)

  return (
    <div
      className="scene-caption"
      aria-hidden="true"
      key={currentScene}
      style={{
        opacity: reveal,
        transform: `translate3d(0, ${(1 - entrance) * 30 - exit * 18}px, 0) scale(${0.96 + reveal * 0.04})`,
        filter: `blur(${(1 - reveal) * 8}px)`,
      }}
    >
      <span className="scene-caption-detail">{detail}</span>
      <strong>{title}</strong>
      <span className="scene-caption-line" />
    </div>
  )
}

function EnquiryForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.currentTarget.reset()
    setSubmitted(true)
  }

  return submitted ? (
    <div className="form-confirmation" role="status">
      <span className="eyebrow">Interface checked</span>
      <h3>Your project brief is ready for a connected endpoint.</h3>
      <p>This is a preview form only: no message was sent or stored because no enquiry endpoint is configured.</p>
    </div>
  ) : (
    <form className="enquiry-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label><span>Name</span><input name="name" required autoComplete="name" /></label>
        <label><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
        <label><span>Company / brand</span><input name="company" autoComplete="organization" /></label>
        <label><span>Project type</span><select name="project" defaultValue="Digital experience"><option>Digital experience</option><option>Brand world</option><option>Creative technology</option><option>Something else</option></select></label>
        <label><span>Indicative budget</span><select name="budget" defaultValue="To discuss"><option>To discuss</option><option>£10k — £25k</option><option>£25k — £50k</option><option>£50k+</option></select></label>
        <label className="form-wide"><span>Tell us what you are building</span><textarea name="message" rows={5} required /></label>
      </div>
      <button className="button button-light" type="submit">Test enquiry flow <span aria-hidden="true">↗</span></button>
      <p className="form-note">No backend is connected yet. Submitting confirms the interface only; no information is transmitted or stored.</p>
    </form>
  )
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <SceneContainer />
      <div className="canvas-scrim" aria-hidden="true" />
      <CinematicCaption />
      <CustomCursor />

      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="DIVINUM home">DIVINUM<span>®</span></a>
        <nav id="main-nav" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {navItems.map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
        </nav>
        <a className="header-cta" href="#enquiries" onClick={() => setMenuOpen(false)}>Start a project <span aria-hidden="true">↗</span></a>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="main-nav">
          <span>{menuOpen ? 'Close' : 'Menu'}</span><i aria-hidden="true" />
        </button>
      </header>

      <main id="main">
        <section className="hero section-shell" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Independent creative studio / London — worldwide</p>
            <h1 id="hero-title">We make<br /><em>meaning</em> move.</h1>
            <p className="hero-intro">DIVINUM is a creative studio for culture-shaping brands, spaces and ideas. We build identities and digital experiences with presence.</p>
            <a className="text-link" href="#enquiries">Start a conversation <span aria-hidden="true">↗</span></a>
          </div>
          <div className="hero-meta"><span>Scroll to explore</span><span className="scroll-line" aria-hidden="true" /></div>
          <div className="hero-index">01 <span>/</span> 06</div>
        </section>

        <section className="content-section studio section-shell" id="studio" aria-labelledby="studio-title">
          <div className="section-heading"><span className="eyebrow">The studio</span><span className="section-number">02</span></div>
          <div className="studio-grid">
            <h2 id="studio-title">A small studio<br /><em>with a wide lens.</em></h2>
            <div className="studio-copy"><p>We work at the meeting point of image, interface and atmosphere. Every engagement begins with a question: what should this feel like in the world?</p><p>From first thought to final detail, DIVINUM pairs strategic clarity with an instinct for the unexpected. The result is work that earns attention, then keeps it.</p><a className="text-link" href="#services">Our capabilities <span aria-hidden="true">↓</span></a></div>
          </div>
        </section>

        <section className="content-section services section-shell" id="services" aria-labelledby="services-title">
          <div className="section-heading"><span className="eyebrow">What we do</span><span className="section-number">03</span></div>
          <div className="services-intro"><h2 id="services-title">Built for<br /><em>the next feeling.</em></h2><p>We bring the right disciplines together around one sharp idea — and stay close enough to make it real.</p></div>
          <div className="services-list">{services.map(([number, title, copy]) => <article className="service-row" key={number}><span className="service-number">{number}</span><h3>{title}</h3><p>{copy}</p><span className="service-arrow" aria-hidden="true">↗</span></article>)}</div>
        </section>

        <section className="content-section work section-shell" id="work" aria-labelledby="work-title">
          <div className="section-heading"><span className="eyebrow">Selected work</span><span className="section-number">04</span></div>
          <div className="work-heading"><h2 id="work-title">Some things<br /><em>we have made.</em></h2><p>A selection of worlds, systems and signals. More to come.</p></div>
          <div className="work-grid">
            <a className="work-card work-card-large browser-preview" href="https://olliewoodford2-ai.github.io/Maison-Aurelle/" target="_blank" rel="noreferrer">
              <div className="browser-window browser-window-aurelle" aria-hidden="true"><span /><span /><span /><div className="browser-preview-mark">MAISON<br />AURELLE</div><div className="browser-preview-line" /></div>
              <div className="work-overlay"><span>01 / Maison Aurelle</span><h3>Maison Aurelle</h3><p>A quiet study in modern hospitality, material and ritual. Visit the live site ↗</p></div>
            </a>
            <a className="work-card browser-preview" href="https://olliewoodford2-ai.github.io/demo-private-aviation-website/" target="_blank" rel="noreferrer">
              <div className="browser-window browser-window-aviation" aria-hidden="true"><span /><span /><span /><div className="browser-preview-mark">PRIVATE<br />AVIATION</div><div className="browser-preview-line" /></div>
              <div className="work-overlay"><span>02 / Private Aviation</span><h3>Private Aviation</h3><p>A considered digital presence for travel without compromise. Visit the live site ↗</p></div>
            </a>
          </div>
        </section>

        <section className="content-section ventures section-shell" id="ventures" aria-labelledby="ventures-title">
          <div className="section-heading"><span className="eyebrow">Associated ventures</span><span className="section-number">05</span></div>
          <div className="ventures-heading"><h2 id="ventures-title">Independent ideas,<br /><em>carefully considered.</em></h2><p>Alongside client work, we are building a small constellation of self-initiated worlds, each with its own atmosphere and point of view.</p></div>
          <div className="venture-grid">
            <a className="venture-card" href="https://olliewoodford2-ai.github.io/Maison-Aurelle/" target="_blank" rel="noreferrer">
              <div className="venture-mark">MA</div>
              <div><span className="eyebrow">Associated project</span><h3>Maison Aurelle</h3><p>A quiet study in modern hospitality, material and ritual.</p></div>
              <span className="venture-status">Visit project ↗</span>
            </a>
            <a className="venture-card" href="https://olliewoodford2-ai.github.io/demo-private-aviation-website/" target="_blank" rel="noreferrer">
              <div className="venture-mark">PA</div>
              <div><span className="eyebrow">Associated project</span><h3>Private Aviation</h3><p>A considered digital presence for travel without compromise.</p></div>
              <span className="venture-status">Visit project ↗</span>
            </a>
          </div>
        </section>

        <section className="content-section enquiries section-shell" id="enquiries" aria-labelledby="enquiries-title">
          <div className="section-heading"><span className="eyebrow">Enquiries</span><span className="section-number">06</span></div>
          <div className="enquiry-grid">                    <div><h2 id="enquiries-title">Have a good<br /><em>feeling?</em></h2><p className="enquiry-lead">Tell us what is taking shape. We will come back with a considered point of view — usually within three working days.</p><div className="direct-contact"><span className="eyebrow">Direct enquiries</span><p><a className="text-link" href="mailto:studio@divinum.studio">studio@divinum.studio <span aria-hidden="true">↗</span></a></p></div></div><EnquiryForm /></div>
        </section>
      </main>

      <footer className="site-footer section-shell" id="footer">
        <div className="footer-top"><a className="wordmark footer-mark" href="#home">DIVINUM<span>®</span></a><p>Ideas with gravity.<br />Experiences with afterimage.</p><a className="text-link" href="#enquiries">Begin a project <span aria-hidden="true">↗</span></a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} DIVINUM STUDIO</span><span>London / Worldwide</span><a href="#home">Back to top ↑</a></div>
      </footer>

      <SceneRail />
      <SoundToggle />
    </div>
  )
}
