import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Globe2,
  Handshake,
  HeartHandshake,
  Instagram,
  Leaf,
  Mail,
  MessageCircle,
  MapPin,
  Recycle,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  approach,
  contactPhone,
  contactWhatsapp,
  flagshipPhoto,
  getNextPage,
  images,
  impact,
  partners,
  portfolio,
  programs,
  values,
} from "./data.js";
import { Eyebrow, PageHeading, Reveal, TextLink } from "./components/SiteLayout.jsx";

const MotionLink = motion(Link);

const programIcons = {
  leaf: Leaf,
  recycle: Recycle,
  users: UsersRound,
  sparkles: Sparkles,
};

const focusAreas = [
  "Environmental Action",
  "Education",
  "Social Empowerment",
  "Cultural Activation",
  "Creative Collaboration",
];

function Photo({ src, alt, className = "", ...props }) {
  return <img className={className} src={src} alt={alt} loading="lazy" {...props} />;
}

function ValueCards() {
  return (
    <div className="values-grid">
      {values.map((value) => (
        <Reveal key={value.letter} className="value-card">
          <span className="value-letter">{value.letter}</span>
          <h3>{value.name}</h3>
          <p>{value.description}</p>
        </Reveal>
      ))}
    </div>
  );
}

function ApproachSteps() {
  return (
    <div className="approach-grid">
      {approach.map((step) => (
        <Reveal key={step.number} className="approach-card">
          <span className="approach-number">{step.number}</span>
          <p className="approach-caption">STEP {step.number}</p>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </Reveal>
      ))}
    </div>
  );
}

function ImpactFlow() {
  return (
    <div className="impact-grid">
      {impact.map((item) => (
        <Reveal className="impact-card" key={item.number}>
          <span>{item.number} / IMPACT</span>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </Reveal>
      ))}
    </div>
  );
}

function AnimatedCount({ value }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.8 });

  useEffect(() => {
    if (!isInView || !ref.current) return undefined;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (current) => {
        if (ref.current) ref.current.textContent = `${Math.round(current)}+`;
      },
    });
    return () => controls.stop();
  }, [isInView, value]);

  return <strong ref={ref} className="stat-number">0+</strong>;
}

function ProgramCard({ program }) {
  const Icon = programIcons[program.icon];
  return (
    <details className="program-card">
      <summary>
        <span className="program-icon"><Icon size={20} strokeWidth={1.6} aria-hidden="true" /></span>
        <span className="program-number">{program.number}</span>
        <h3>{program.title}</h3>
        <p>{program.summary}</p>
        <span className="details-prompt">Baca selengkapnya <ArrowRight size={13} aria-hidden="true" /></span>
      </summary>
      <p className="program-details">{program.details}</p>
    </details>
  );
}

function PortfolioGrid({ limit }) {
  const items = limit ? portfolio.slice(0, limit) : portfolio;
  return (
    <div className="portfolio-grid">
      {items.map(({ number, src }, index) => (
        <Reveal key={number} className="portfolio-card" transition={{ duration: 0.35, delay: (index % 5) * 0.035 }}>
          {number === 76 ? (
            <div className="portfolio-logo-loader" role="img" aria-label="Logo Tangan Edukasi Indonesia">
              <span className="portfolio-logo-orbit" aria-hidden="true" />
              <img src={images.smallLogo} alt="" />
              <span className="portfolio-logo-loader-caption">TANGAN EDUKASI INDONESIA</span>
            </div>
          ) : (
            <Photo src={src} alt={`Dokumentasi kegiatan Tandu Osoji nomor ${number}`} />
          )}
          <figcaption><span>Tandu Osoji</span><strong>#{number}</strong></figcaption>
        </Reveal>
      ))}
    </div>
  );
}

export function HomePage() {
  const nextPage = getNextPage("/");

  return (
    <>
      <section className="container home-hero">
        <Reveal className="home-copy">
          <Eyebrow>YAYASAN TANGAN EDUKASI INDONESIA <span className="eyebrow-divider">·</span> 2026</Eyebrow>
          <h1>TANGAN<br />EDUKASI<br /><span>INDONESIA.</span></h1>
          <span className="page-heading-note home-page-note">
            <span className="page-heading-note-dot" aria-hidden="true" />
            COLLABORATE · LEARN · ACT
          </span>
          <p className="home-tagline">Multi-Sector Collaborative Platform <span>for Public Impact.</span></p>
          <p className="home-note">We start from environment,<br />we grow into collective impact.</p>
          <a className="button button-dark" href={contactWhatsapp} target="_blank" rel="noopener noreferrer">Let&apos;s Collaborate <ArrowUpRight size={15} aria-hidden="true" /></a>
          <p className="home-location">INDONESIA <span>—</span> 2026</p>
        </Reveal>
        <Reveal className="home-visual">
          <MotionLink
            className="home-floating-icon"
            to={nextPage.to}
            aria-label={`Lanjut ke halaman ${nextPage.label}`}
            title={`Lanjut ke ${nextPage.label}`}
            whileHover={{ rotate: 180, scale: 1.05 }}
            whileTap={{ rotate: 360, scale: 0.96 }}
          >
            <Sparkles size={20} strokeWidth={1.5} aria-hidden="true" />
          </MotionLink>
          <figure className="home-logo-frame">
            <Photo src={images.heroLogo} alt="Logo Tangan Edukasi" loading="eager" />
          </figure>
          <p className="home-photo-caption"><span>OUR IDENTITY / 01</span><br />A shared platform for<br />meaningful public action.</p>
        </Reveal>
      </section>

      <div className="focus-strip">
        <div className="container focus-strip-inner">
          {focusAreas.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>

      <section className="container section-block home-introduction">
        <div className="home-intro-copy">
          <Eyebrow number="01">INTRODUCTION</Eyebrow>
          <h2>Ruang kolaborasi.<br /><span>Aksi berdampak.</span></h2>
          <p>Tangan Edukasi Indonesia adalah platform kolaboratif yang menghubungkan masyarakat, pemerintah, dan sektor swasta dalam membangun aksi sosial yang berdampak.</p>
          <TextLink to="/about">Discover our story</TextLink>
        </div>
        <Photo className="home-intro-photo" src={portfolio[0]?.src} alt="Dokumentasi aksi Tandu Osoji bersama masyarakat" />
      </section>

      <section className="feature-band">
        <div className="container feature-band-inner">
          <div className="feature-copy">
            <Eyebrow number="02">FLAGSHIP PROGRAM</Eyebrow>
            <h2>TANDU<br />OSOJI<span>.</span></h2>
            <p>Gerakan aksi berbasis komunitas untuk membangun kesadaran kolektif dan tanggung jawab bersama.</p>
            <TextLink to="/programs">Explore our programs</TextLink>
          </div>
          <div className="feature-visual">
            <Photo src={flagshipPhoto} alt="Kegiatan Tandu Osoji bersama komunitas di Medan" />
            <div className="feature-stat"><AnimatedCount value={68} /><span>KEGIATAN</span></div>
            <div className="feature-stat"><strong>Ribuan</strong><span>PARTISIPAN</span></div>
          </div>
        </div>
      </section>

      <section className="container section-block home-contact">
        <div><Eyebrow number="03">START A CONVERSATION</Eyebrow><h2>Better things happen<br />when we work <span>together.</span></h2></div>
        <Link className="button button-dark" to="/collaboration">Get in touch <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </section>
    </>
  );
}

export function AboutPage() {
  return (
    <div className="container inner-page-content">
      <PageHeading
        number="01"
        label="ABOUT US"
        title={<>Ruang belajar.<br /><span>Ruang kolaborasi.</span></>}
        description="Tangan Edukasi Indonesia membangun ruang tumbuh yang menghubungkan kesadaran dengan aksi nyata."
        icon={BookOpen}
        note="RUANG TUMBUH · 01"
      />

      <section className="section-block intro-layout">
        <div>
          <Eyebrow>INTRODUCTION</Eyebrow>
          <p className="lead-copy">Tangan Edukasi Indonesia adalah platform kolaboratif yang menghubungkan masyarakat, pemerintah, dan sektor swasta dalam membangun aksi sosial yang berdampak.</p>
          <p>Dengan pendekatan yang menggabungkan edukasi, interaksi, dan aksi nyata, kami mendorong terbentuknya keterlibatan publik yang lebih aktif dan berkelanjutan.</p>
        </div>
        <Photo src={portfolio[2]?.src} alt="Kolaborasi komunitas dalam kegiatan lapangan" className="editorial-photo" />
      </section>

      <section className="section-block editorial-columns">
        <article>
          <Eyebrow>THE CONTEXT</Eyebrow><h2>BACKGROUND<span>.</span></h2>
          <p>Dalam berbagai praktik di lapangan, tantangan utama bukan terletak pada kurangnya kepedulian, melainkan rendahnya keterlibatan aktif masyarakat.</p>
          <p>Banyak individu telah memiliki kesadaran terhadap isu sosial, namun belum memiliki ruang dan sistem yang memungkinkan mereka untuk berpartisipasi secara langsung. Kondisi ini menciptakan kesenjangan antara kesadaran dan aksi.</p>
          <p>Tangan Edukasi Indonesia hadir untuk menjembatani kesenjangan tersebut melalui pendekatan yang menggabungkan edukasi, interaksi, dan aksi nyata.</p>
        </article>
        <article>
          <Eyebrow>OUR DISTINCT ROLE</Eyebrow><h2>POSITIONING<span>.</span></h2>
          <p>Kami tidak berdiri sebagai penyelenggara acara semata, bukan pula sebagai komunitas yang bergantung pada momentum.</p>
          <p>Tangan Edukasi Indonesia mengambil posisi sebagai institusi kerja yang membangun ruang belajar, ruang kolaborasi, dan ruang tumbuh secara konsisten.</p>
          <p className="aside-note">FROM AWARENESS <ArrowRight size={14} /> TO COLLECTIVE ACTION</p>
        </article>
      </section>

      <section className="section-block editorial-columns statement-columns">
        <article><Eyebrow>OUR VISION</Eyebrow><h2>VISION<span>.</span></h2><p className="lead-copy">Membangun ekosistem kolaboratif yang mendorong kesadaran, keterlibatan, dan keberlanjutan dalam kehidupan masyarakat.</p></article>
        <article><Eyebrow>HOW WE GET THERE</Eyebrow><h2>MISSION<span>.</span></h2><p className="lead-copy">Untuk mewujudkan hal tersebut, kami menjalankan misi melalui pengembangan program berbasis praktik, penguatan kolaborasi lintas sektor, serta mendorong partisipasi aktif masyarakat dalam berbagai inisiatif sosial yang relevan.</p></article>
      </section>

      <section className="section-block">
        <div className="section-title-row"><div><Eyebrow>THE PRINCIPLES WE BRING</Eyebrow><h2>CORE VALUES<span>.</span></h2></div><p>ROKI menjadi panduan dalam mengambil keputusan, membangun kolaborasi, dan menjalankan program dengan konsisten serta bertanggung jawab.</p></div>
        <ValueCards />
      </section>

      <section className="section-block about-team">
        <div className="section-title-row"><div><Eyebrow>THE PEOPLE BEHIND THE WORK</Eyebrow><h2>ONE TEAM.<br />MANY HANDS<span>.</span></h2></div><p>Kolaborasi bukan sekadar momentum. Ini adalah cara kerja yang terus bertumbuh bersama masyarakat dan berbagai mitra.</p></div>
        <div className="team-feature">
          <Photo src={portfolio[14]?.src} alt="Tim dan relawan bekerja bersama dalam kegiatan lapangan" className="team-photo" />
          <div><Eyebrow>ONE PLATFORM, MANY PERSPECTIVES</Eyebrow><h2>Gerakan dibangun<br />secara <span>bersama.</span></h2><p className="lead-copy">Kami menghubungkan masyarakat, pemerintah, sektor swasta, dan komunitas untuk membangun aksi publik yang relevan dan berdampak.</p><TextLink to="/collaboration">Kenali model kolaborasi</TextLink></div>
        </div>
        <div className="partners-grid">
          {partners.map((partner, index) => {
            const icons = [UsersRound, Globe2, Handshake, HeartHandshake];
            const Icon = icons[index];
            return <Reveal className="partner-card" key={partner}><span>0{index + 1}</span><Icon size={23} strokeWidth={1.5} /><h3>{partner}</h3><p>Mitra dalam membangun ruang publik yang lebih sadar, aktif, dan berkelanjutan.</p></Reveal>;
          })}
        </div>
        <div className="team-quote"><BookOpen size={19} strokeWidth={1.5} /><p>We start from environment,<br /><span>we grow into collective impact.</span></p></div>
      </section>
    </div>
  );
}

export function ProgramsPage() {
  return (
    <>
      <div className="container inner-page-content">
        <PageHeading
          number="02"
          label="PROGRAMS"
          title={<>Belajar bersama.<br /><span>Bergerak berdampak.</span></>}
          description="Program berbasis praktik yang menghubungkan edukasi, kolaborasi lintas sektor, dan aksi nyata di lapangan."
          icon={Leaf}
          note="IDE MENJADI AKSI"
        />
        <section className="section-block">
          <div className="section-title-row"><div><Eyebrow>LEARN, SHARE, TAKE ACTION</Eyebrow><h2>OUR PROGRAMS<span>.</span></h2></div><p>Mulai dari langkah sederhana, lalu tumbuh menjadi gerakan yang dikerjakan bersama.</p></div>
          <div className="program-grid">{programs.map((program) => <ProgramCard key={program.number} program={program} />)}</div>
        </section>
        <section className="section-block">
          <div className="section-title-row"><div><Eyebrow>FROM LEARNING TO DOING</Eyebrow><h2>OUR APPROACH<span>.</span></h2></div><p>Tiga langkah yang menjadi dasar pendekatan kami dalam membangun keterlibatan publik.</p></div>
          <ApproachSteps />
        </section>
      </div>

      <section className="feature-band">
        <div className="container feature-band-inner">
          <div className="feature-copy">
            <Eyebrow number="01">FLAGSHIP PROGRAM</Eyebrow>
            <h2>TANDU<br />OSOJI<span>.</span></h2>
            <p>Salah satu program utama yang menjadi fondasi gerakan adalah Tandu Osoji, sebuah program aksi berbasis komunitas yang dilakukan secara rutin.</p>
            <p>Terinspirasi dari filosofi Jepang Osoji, aktivitas sederhana seperti membersihkan lingkungan menjadi pintu masuk membangun kesadaran kolektif dan tanggung jawab bersama.</p>
            <Link className="button button-light" to="/portfolio">Explore Our Activities <ArrowRight size={15} /></Link>
          </div>
          <div className="feature-visual">
            <Photo src={flagshipPhoto} alt="Kegiatan Tandu Osoji bersama komunitas di Medan" />
            <div className="feature-stat"><AnimatedCount value={68} /><span>KEGIATAN</span></div>
            <div className="feature-stat"><strong>Ribuan</strong><span>PARTISIPAN</span></div>
          </div>
        </div>
      </section>

      <section className="container section-block">
        <div className="section-title-row"><div><Eyebrow>FROM KNOWLEDGE TO CHANGE</Eyebrow><h2>IMPACT FRAMEWORK<span>.</span></h2></div><p>Edukasi dan partisipasi mendorong terbentuknya dampak berkelanjutan.</p></div>
        <ImpactFlow />
        <TextLink to="/impact">Explore our impact</TextLink>
      </section>
    </>
  );
}

export function ImpactPage() {
  const legacyActions = [
    { title: "Pilah sampah", summary: "Mulai kenali sampah yang bisa dipakai ulang atau didaur ulang.", details: "Siapkan tempat terpisah untuk sampah organik dan anorganik. Bilas kemasan yang kotor, lalu cari tahu titik pengumpulan atau bank sampah di dekatmu." },
    { title: "Rawat tanaman", summary: "Tambahkan sedikit ruang hijau di rumah atau sekolah.", details: "Pilih tanaman yang cocok untuk tempatmu, siram secukupnya, dan manfaatkan kompos dari sisa organik bila tersedia." },
    { title: "Ajak teman", summary: "Bagikan kebiasaan baik supaya lebih banyak orang ikut bergerak.", details: "Pilih satu aksi bersama yang mudah dilakukan, sepakati waktunya, dan ceritakan hasilnya agar orang lain mendapat inspirasi." },
  ];

  return (
    <div className="container inner-page-content">
      <PageHeading
        number="06"
        label="IMPACT"
        title={<>Perubahan besar<br /><span>tumbuh dari hal kecil.</span></>}
        description="Dampak berkelanjutan lahir saat kesadaran berkembang menjadi partisipasi dan kebiasaan baik."
        icon={Globe2}
        note="SMALL STEPS · SHARED IMPACT"
      />
      <section className="section-block">
        <div className="section-title-row"><div><Eyebrow>OUR IMPACT FRAMEWORK</Eyebrow><h2>FROM KNOWLEDGE<br />TO CHANGE<span>.</span></h2></div><p>Edukasi dan partisipasi mendorong perubahan perilaku yang positif. Setiap langkah sederhana dapat menjadi awal dari dampak bersama.</p></div>
        <ImpactFlow />
      </section>
      <section className="section-block">
        <div className="section-title-row"><div><Eyebrow>START CLOSE TO HOME</Eyebrow><h2>AKSI YANG BISA DICOBA<span>.</span></h2></div><p>Mulai dari satu aksi kecil di rumah, sekolah, atau lingkungan sekitar.</p></div>
        <div className="program-grid">
          {legacyActions.map((action, index) => (
            <details className="program-card" key={action.title}>
              <summary><span className="program-number">0{index + 1} / ACTION</span><h3>{action.title}</h3><p>{action.summary}</p><span className="details-prompt">Baca selengkapnya <ArrowRight size={13} /></span></summary>
              <p className="program-details">{action.details}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="contact-manifesto"><Eyebrow>YOUR NEXT STEP</Eyebrow><p>EDUCATE <span>·</span> ENGAGE <span>·</span> ACTIVATE</p><TextLink to="/programs">Discover our programs</TextLink></section>
    </div>
  );
}

export function PortfolioPage() {
  return (
    <div className="container inner-page-content">
      <PageHeading
        number="03"
        label="PORTFOLIO & FIELD EXPERIENCE"
        title={<>Cerita di lapangan.<br /><span>Tumbuh bersama.</span></>}
        description="Dokumentasi kegiatan Tandu Osoji #42–#76, sebagaimana ditampilkan pada company profile Tangan Edukasi Indonesia."
        icon={Sparkles}
        note="FIELD NOTES · 42—76"
      />
      <section className="section-block portfolio-section">
        <div className="section-title-row"><div><Eyebrow>FIELD ARCHIVE / INDONESIA</Eyebrow><h2>TANDU OSOJI<span>.</span></h2></div><p>Aksi, kolaborasi, dan pengalaman yang melibatkan masyarakat secara langsung.</p></div>
        <PortfolioGrid />
        <p className="archive-label">35 FIELD NOTES <span>·</span> TANDU OSOJI #42 — #76</p>
      </section>
    </div>
  );
}

export function CollaborationPage() {
  return (
    <div className="container inner-page-content">
      <PageHeading
        number="05"
        label="COLLABORATION MODEL"
        title={<>Perubahan sosial<br /><span>dibangun bersama.</span></>}
        description="Tangan Edukasi Indonesia siap menjadi mitra strategis dalam membangun ruang publik yang lebih sadar, aktif, dan berkelanjutan."
        icon={Handshake}
        note="BETTER, TOGETHER"
      />
      <section className="section-block collaboration-intro">
        <div><Eyebrow>WHY COLLABORATE WITH US</Eyebrow><h2>BETTER<br />TOGETHER<span>.</span></h2></div>
        <div><p className="lead-copy">Kami percaya bahwa perubahan sosial tidak terjadi secara instan, melainkan melalui kolaborasi yang tepat, pendekatan yang relevan, dan aksi yang konsisten.</p><p>Kami bekerja lintas sektor, memulai dari konteks dan kebutuhan lapangan untuk menciptakan ruang belajar, kolaborasi, dan aksi bersama.</p>        <a className="button button-dark" href={contactWhatsapp} target="_blank" rel="noopener noreferrer">Start a conversation <ArrowUpRight size={15} /></a></div>
      </section>
      <section className="section-block">
        <div className="section-title-row"><div><Eyebrow>A PLATFORM FOR SHARED ACTION</Eyebrow><h2>COLLABORATION MODEL<span>.</span></h2></div><p>Menyatukan keahlian dan perspektif agar ide dapat tumbuh menjadi aksi yang terasa di lapangan.</p></div>
        <ApproachSteps />
      </section>
      <section className="section-block sector-section">
        <div className="section-title-row"><div><Eyebrow>OUR COLLABORATION FOCUS</Eyebrow><h2>BUILT ACROSS SECTORS<span>.</span></h2></div></div>
        <div className="sector-grid">{focusAreas.map((area, index) => <div className="sector-card" key={area}><span>0{index + 1}</span><h3>{area}</h3><ArrowUpRight size={16} aria-hidden="true" /></div>)}</div>
      </section>
      <section className="section-block contact-layout" id="contact">
        <div><Eyebrow>OPEN FOR COLLABORATION</Eyebrow><h2>Let&apos;s build<br />something <span>meaningful.</span></h2><p className="lead-copy">Untuk diskusi mengenai program, kemitraan, atau kolaborasi lintas sektor, kami senang mendengar dari Anda.</p></div>
        <div className="contact-details">
          <a href={contactWhatsapp} target="_blank" rel="noopener noreferrer"><span><MessageCircle size={17} /> WHATSAPP</span><strong>Ahmad Zaki</strong><small className="contact-whatsapp-number">{contactPhone}</small><ArrowUpRight size={17} /></a>
          <a href="https://www.instagram.com/tanganedukasi.id?exln=dG1qMWIzYnVlNWdn" target="_blank" rel="noopener noreferrer"><span><Instagram size={17} /> INSTAGRAM</span><strong>@tanganedukasi.id</strong><ArrowUpRight size={17} /></a>
          <a href="https://chat.whatsapp.com/HS7ezdhfE9lFIBpJnOvpSx?mode=wwt" target="_blank" rel="noopener noreferrer"><span><MessageCircle size={17} /> WHATSAPP GROUP</span><strong>Join grup kami</strong><ArrowUpRight size={17} /></a>
          <a href="mailto:tanganedukasi@gmail.com"><span><Mail size={17} /> EMAIL</span><strong>tanganedukasi@gmail.com</strong><ArrowUpRight size={17} /></a>
          <div><span><MapPin size={17} /> LOCATION</span><strong>Indonesia</strong></div>
        </div>
      </section>
      <section className="contact-manifesto"><Eyebrow>A SHARED PLATFORM</Eyebrow><p>EDUCATE <span>·</span> ENGAGE <span>·</span> ACTIVATE</p><Link className="text-link" to="/about">Discover who we are <ArrowRight size={15} /></Link></section>
    </div>
  );
}
